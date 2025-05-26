import os
import json
from typing import List, Dict, Any, Union, Optional
import datetime
import inspect
import re
from pathlib import Path
import time
import logging
from dotenv import load_dotenv
import chromadb
from chromadb.utils import embedding_functions
import numpy as np
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from openai import OpenAI
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import markdownify  # pip install markdownify
from xml.etree import ElementTree as ET
import tiktoken  # Add tiktoken for token counting
from werkzeug.utils import secure_filename
import psutil
import threading
from collections import deque
import uuid
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import hashlib
import secrets

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Constants for token management
MAX_CONTEXT_WINDOW = 163840  # Maximum context window size
SAFETY_BUFFER = 0.15  # 15% safety buffer
DEFAULT_MAX_TOKENS = 4096  # Default max tokens for generation

# Add to existing imports and configurations
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'doc', 'docx', 'md'}

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Add settings file path
SETTINGS_FILE = 'settings.json'

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Add debug token management
class DebugTokenManager:
    def __init__(self):
        self.tokens = {}
        self.token_expiry = 3600  # 1 hour expiry
    
    def generate_token(self, client_id: str) -> str:
        """Generate a new debug token for a client."""
        token = secrets.token_urlsafe(32)
        self.tokens[token] = {
            'client_id': client_id,
            'created_at': time.time(),
            'expires_at': time.time() + self.token_expiry
        }
        return token
    
    def validate_token(self, token: str) -> bool:
        """Validate a debug token."""
        if token not in self.tokens:
            return False
        
        token_data = self.tokens[token]
        if time.time() > token_data['expires_at']:
            del self.tokens[token]
            return False
        
        return True
    
    def cleanup_expired_tokens(self):
        """Remove expired tokens."""
        current_time = time.time()
        expired_tokens = [
            token for token, data in self.tokens.items()
            if current_time > data['expires_at']
        ]
        for token in expired_tokens:
            del self.tokens[token]

# Initialize token manager
debug_token_manager = DebugTokenManager()

# Debug data structures
class DebugLog:
    def __init__(self, max_size=1000):
        self.logs = deque(maxlen=max_size)
        self.session_id = str(uuid.uuid4())
        self.start_time = time.time()
        self.metrics = {
            'total_requests': 0,
            'total_tokens': 0,
            'total_errors': 0,
            'avg_response_time': 0
        }
    
    def add_log(self, log_type: str, data: Dict[str, Any]):
        """Add a log entry with timestamp and session info."""
        log_entry = {
            'timestamp': datetime.datetime.now().isoformat(),
            'type': log_type,
            'data': data,
            'session_id': self.session_id
        }
        self.logs.append(log_entry)
        return log_entry
    
    def get_logs(self, log_type: Optional[str] = None, limit: int = 100):
        """Get logs, optionally filtered by type."""
        if log_type:
            return [log for log in self.logs if log['type'] == log_type][-limit:]
        return list(self.logs)[-limit:]
    
    def clear_logs(self):
        """Clear all logs."""
        self.logs.clear()
    
    def get_metrics(self):
        """Get current debug metrics."""
        return self.metrics

# Initialize debug log
debug_log = DebugLog()

def debug_middleware():
    """Middleware to handle debug logging."""
    if not current_settings.get('debugMode', False):
        return
    
    start_time = time.time()
    request_id = str(uuid.uuid4())
    
    # Log request
    debug_log.add_log('request', {
        'id': request_id,
        'method': request.method,
        'path': request.path,
        'headers': dict(request.headers),
        'body': request.get_json(silent=True)
    })
    
    # Track system metrics
    system_metrics = {
        'cpu_percent': psutil.cpu_percent(),
        'memory_percent': psutil.virtual_memory().percent,
        'disk_usage': psutil.disk_usage('/').percent
    }
    debug_log.add_log('system_metrics', system_metrics)
    
    return request_id, start_time

def debug_response(request_id: str, start_time: float, response: Response):
    """Log response data and update metrics."""
    if not current_settings.get('debugMode', False):
        return response
    
    # Calculate response time
    response_time = time.time() - start_time
    
    # Log response
    debug_log.add_log('response', {
        'id': request_id,
        'status_code': response.status_code,
        'headers': dict(response.headers),
        'response_time': response_time
    })
    
    # Update metrics
    debug_log.metrics['total_requests'] += 1
    debug_log.metrics['avg_response_time'] = (
        (debug_log.metrics['avg_response_time'] * (debug_log.metrics['total_requests'] - 1) + response_time)
        / debug_log.metrics['total_requests']
    )
    
    return response

# Add debug token generation endpoint
@app.route('/debug/token', methods=['POST'])
@limiter.limit("5 per minute")
def generate_debug_token():
    """Generate a debug token for authenticated clients."""
    try:
        # Verify debug mode is enabled
        if not current_settings.get('debugMode', False):
            return jsonify({'error': 'Debug mode is disabled'}), 403
        
        # Get client identifier (IP + User Agent)
        client_id = f"{request.remote_addr}-{request.headers.get('User-Agent', '')}"
        client_hash = hashlib.sha256(client_id.encode()).hexdigest()
        
        # Generate token
        token = debug_token_manager.generate_token(client_hash)
        
        return jsonify({
            'token': token,
            'expires_in': debug_token_manager.token_expiry
        })
    except Exception as e:
        logger.error(f"Error generating debug token: {e}")
        return jsonify({'error': str(e)}), 500

# Modify debug endpoints to require token
@app.route('/debug/logs', methods=['GET'])
@limiter.limit("30 per minute")
def get_debug_logs():
    """Get debug logs."""
    try:
        # Verify debug mode and token
        if not current_settings.get('debugMode', False):
            return jsonify({'error': 'Debug mode is disabled'}), 403
        
        token = request.headers.get('X-Debug-Token')
        if not token or not debug_token_manager.validate_token(token):
            return jsonify({'error': 'Invalid or expired debug token'}), 401
        
        log_type = request.args.get('type')
        limit = int(request.args.get('limit', 100))
        
        return jsonify({
            'logs': debug_log.get_logs(log_type, limit),
            'metrics': debug_log.get_metrics()
        })
    except Exception as e:
        logger.error(f"Error getting debug logs: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/debug/logs', methods=['DELETE'])
@limiter.limit("10 per minute")
def clear_debug_logs():
    """Clear debug logs."""
    try:
        # Verify debug mode and token
        if not current_settings.get('debugMode', False):
            return jsonify({'error': 'Debug mode is disabled'}), 403
        
        token = request.headers.get('X-Debug-Token')
        if not token or not debug_token_manager.validate_token(token):
            return jsonify({'error': 'Invalid or expired debug token'}), 401
        
        debug_log.clear_logs()
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Error clearing debug logs: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/debug/metrics', methods=['GET'])
@limiter.limit("30 per minute")
def get_debug_metrics():
    """Get debug metrics."""
    try:
        # Verify debug mode and token
        if not current_settings.get('debugMode', False):
            return jsonify({'error': 'Debug mode is disabled'}), 403
        
        token = request.headers.get('X-Debug-Token')
        if not token or not debug_token_manager.validate_token(token):
            return jsonify({'error': 'Invalid or expired debug token'}), 401
        
        return jsonify(debug_log.get_metrics())
    except Exception as e:
        logger.error(f"Error getting debug metrics: {e}")
        return jsonify({'error': str(e)}), 500

# Add periodic token cleanup
def cleanup_tokens():
    """Periodically clean up expired tokens."""
    while True:
        debug_token_manager.cleanup_expired_tokens()
        time.sleep(300)  # Run every 5 minutes

# Start token cleanup thread
token_cleanup_thread = threading.Thread(target=cleanup_tokens, daemon=True)
token_cleanup_thread.start()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_settings():
    """Load settings from file or return defaults."""
    try:
        if os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        logger.error(f"Error loading settings: {e}")
    
    # Default settings
    return {
        "model": "deepseek/deepseek-r1:free",
        "temperature": 0.7,
        "maxTokens": 1000,
        "streamingEnabled": True,
        "securityLevel": "high",
        "debugMode": False,
        "apiKey": "",
        "tools": {
            "securityScanner": True,
            "codeAnalysis": True,
            "dataOperations": True,
            "networkMonitor": False
        }
    }

def save_settings(settings):
    """Save settings to file."""
    try:
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(settings, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Error saving settings: {e}")
        return False

# Initialize settings
current_settings = load_settings()

class OpenRouterLLM:
    def __init__(self, api_key: Optional[str] = None, 
                 model: str = "deepseek/deepseek-r1:free"):
        """Initialize OpenRouter LLM client using OpenAI library.
        
        Args:
            api_key: OpenRouter API key. If None, it will look for OPENROUTER_API_KEY env variable
            model: Model to use (default: deepseek/deepseek-r1:free)
        """
        self.api_key = api_key or os.environ.get("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("OpenRouter API key not found. Set OPENROUTER_API_KEY environment variable or pass api_key.")
        
        self.model = model
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=self.api_key
        )
        
        # Headers for OpenRouter
        self.extra_headers = {
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "AI Agent Example"
        }
        
        # Initialize tokenizer
        try:
            self.tokenizer = tiktoken.get_encoding("cl100k_base")  # Use cl100k_base for most models
        except Exception as e:
            logger.warning(f"Failed to initialize tokenizer: {e}. Using fallback token counting.")
            self.tokenizer = None
    
    def _count_tokens(self, text: str) -> int:
        """Count the number of tokens in a text string.
        
        Args:
            text: The text to count tokens for
            
        Returns:
            Number of tokens
        """
        if self.tokenizer:
            return len(self.tokenizer.encode(text))
        else:
            # Fallback: rough estimate (4 chars ≈ 1 token)
            return len(text) // 4
    
    def _count_message_tokens(self, message: Dict[str, str]) -> int:
        """Count tokens in a message object.
        
        Args:
            message: Message object with role and content
            
        Returns:
            Number of tokens
        """
        # Count role and content
        role_tokens = self._count_tokens(message["role"])
        content_tokens = self._count_tokens(message["content"])
        
        # Add tokens for message structure (approximate)
        return role_tokens + content_tokens + 4  # +4 for message structure
    
    def _calculate_max_tokens(self, messages: List[Dict[str, str]], requested_max: Optional[int] = None) -> int:
        """Calculate the maximum number of tokens that can be generated.
        
        Args:
            messages: List of message objects
            requested_max: User-requested max tokens (optional)
            
        Returns:
            Maximum number of tokens that can be generated
        """
        # Count input tokens
        input_tokens = sum(self._count_message_tokens(msg) for msg in messages)
        
        # Calculate available tokens
        available_tokens = MAX_CONTEXT_WINDOW - input_tokens
        available_tokens = int(available_tokens * (1 - SAFETY_BUFFER))  # Apply safety buffer
        
        # Use the smaller of requested max and available tokens
        if requested_max is not None:
            return min(requested_max, available_tokens)
        return min(DEFAULT_MAX_TOKENS, available_tokens)
    
    def _handle_streaming_response(self, messages: List[Dict[str, str]], temperature: float, max_tokens: int):
        """Handle streaming response from OpenRouter API using OpenAI client."""
        def generate_chunks():
            try:
                stream = self.client.chat.completions.create(
                    extra_headers=self.extra_headers,
                    model=self.model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=True
                )
                
                for chunk in stream:
                    if chunk.choices[0].delta.content is not None:
                        yield chunk.choices[0].delta.content
                        
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Error in streaming response: {error_msg}")
                if current_settings.get('debugMode', False):
                    debug_log.metrics['total_errors'] += 1
                    debug_log.add_log('error', {
                        'error': error_msg,
                        'type': 'llm_streaming_error',
                        'model': self.model,
                        'timestamp': datetime.datetime.now().isoformat()
                    })
                yield f" [Error: {error_msg}]"
        
        return generate_chunks()
    
    def generate(self, messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: int = 100000, stream: bool = False):
        """Generate a response using the LLM.
        
        Args:
            messages: List of message objects with role and content
            temperature: Controls randomness (0 to 1)
            max_tokens: Maximum number of tokens to generate
            stream: Whether to stream the response
            
        Returns:
            The LLM response text (string) or generator (if streaming)
        """
        try:
            # Calculate safe max_tokens based on context window
            input_tokens = sum(len(msg["content"].split()) for msg in messages)  # Rough estimate
            available_tokens = MAX_CONTEXT_WINDOW - input_tokens
            safe_max_tokens = min(max_tokens, int(available_tokens * 0.85))  # 15% safety buffer
            
            if safe_max_tokens <= 0:
                raise ValueError("Input messages exceed maximum context window size")
            
            logger.debug(f"Using max_tokens: {safe_max_tokens} (requested: {max_tokens})")
            
            if stream:
                return self._handle_streaming_response(messages, temperature, safe_max_tokens)
            else:
                completion = self.client.chat.completions.create(
                    extra_headers=self.extra_headers,
                    model=self.model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=safe_max_tokens,
                    stream=False
                )
                return completion.choices[0].message.content
                
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error calling OpenRouter API: {error_msg}")
            if current_settings.get('debugMode', False):
                debug_log.metrics['total_errors'] += 1
                debug_log.add_log('error', {
                    'error': error_msg,
                    'type': 'llm_api_error',
                    'model': self.model,
                    'timestamp': datetime.datetime.now().isoformat()
                })
            if stream:
                def error_generator():
                    yield f"Error generating response: {error_msg}"
                return error_generator()
            else:
                return f"Error generating response: {error_msg}"


class Tool:
    def __init__(self, name: str, description: str, function):
        """Initialize a tool that can be used by the agent.
        
        Args:
            name: Name of the tool
            description: Description of what the tool does and how to use it
            function: The function to execute when the tool is called
        """
        self.name = name
        self.description = description
        self.function = function
        self.signature = self._get_signature()
    
    def _get_signature(self) -> Dict[str, Any]:
        """Extract the function signature to provide parameter information."""
        sig = inspect.signature(self.function)
        params = {}
        for name, param in sig.parameters.items():
            param_info = {
                "type": str(param.annotation) if param.annotation != inspect.Parameter.empty else "any"
            }
            if param.default != inspect.Parameter.empty:
                param_info["default"] = param.default
            params[name] = param_info
        return params
    
    def __call__(self, *args, **kwargs) -> Any:
        """Execute the tool function with the provided arguments."""
        return self.function(*args, **kwargs)

class WebCrawler:
    def __init__(self, user_agent: str = "AI Agent Web Crawler/1.0"):
        self.user_agent = user_agent
        self.headers = {"User-Agent": user_agent}
        
    def crawl(self, urls: List[str], output_format: str = "markdown") -> List[dict]:
        """Crawl URLs and convert content to specified format.
        
        Args:
            urls: List of URLs to crawl
            output_format: Output format (markdown or xml)
            
        Returns:
            List of dictionaries with content and metadata
        """
        results = []
        
        for url in urls:
            try:
                # Basic URL validation
                parsed = urlparse(url)
                if not parsed.scheme or not parsed.netloc:
                    raise ValueError(f"Invalid URL: {url}")
                
                # Fetch page content
                response = requests.get(url, headers=self.headers, timeout=10)
                response.raise_for_status()
                
                # Parse HTML
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Remove unwanted elements
                for element in soup(['script', 'style', 'nav', 'footer']):
                    element.decompose()
                
                # Convert to target format
                if output_format.lower() == "markdown":
                    content = markdownify.markdownify(str(soup.body), heading_style="ATX")
                elif output_format.lower() == "xml":
                    root = ET.Element("page")
                    ET.SubElement(root, "url").text = url
                    ET.SubElement(root, "title").text = soup.title.string if soup.title else ""
                    ET.SubElement(root, "content").text = soup.get_text()
                    content = ET.tostring(root, encoding='unicode')
                else:
                    raise ValueError(f"Unsupported format: {output_format}")
                
                results.append({
                    "url": url,
                    "content": content, 
                    "title": soup.title.string if soup.title else ""
                })
                
            except Exception as e:
                logger.error(f"Error crawling {url}: {e}")
                results.append({
                    "url": url,
                    "content": f"Error crawling {url}: {str(e)}",
                    "title": ""
                })
                
        return results


class RAGSystem:
    def __init__(self, collection_name: str = "agent_knowledge"):
        """Initialize the RAG system with ChromaDB for vector storage.
        
        Args:
            collection_name: Name for the ChromaDB collection
        """
        # Initialize ChromaDB client
        self.client = chromadb.Client()
        
        # Use Sentence Transformers for embeddings
        self.embedding_function = embedding_functions.DefaultEmbeddingFunction()
        
        # Create or get collection
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embedding_function
        )
    
    def add_documents(self, documents: List[str], metadatas: Optional[List[Dict[str, Any]]] = None, ids: Optional[List[str]] = None):
        """Add documents to the vector store.
        
        Args:
            documents: List of text documents to add
            metadatas: Optional metadata for each document
            ids: Optional IDs for each document (will be auto-generated if not provided)
        """
        if ids is None:
            # Generate IDs based on timestamp and document hash
            ids = [f"doc_{i}_{int(time.time())}" for i in range(len(documents))]
        
        if metadatas is None:
            metadatas = [{"source": "user_input"} for _ in documents]
        
        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        logger.info(f"Added {len(documents)} documents to RAG system")
    
    def query(self, query_text: str, n_results: int = 3) -> List[Dict[str, Any]]:
        """Retrieve relevant documents based on a query.
        
        Args:
            query_text: The text to search for similar documents
            n_results: Number of results to return
            
        Returns:
            List of results including document text and metadata
        """
        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results
        )
        
        # Format results for easier consumption
        formatted_results = []
        if results["documents"]:
            for i, doc in enumerate(results["documents"][0]):  # First query's results
                formatted_results.append({
                    "document": doc,
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "id": results["ids"][0][i],
                    "distance": results["distances"][0][i] if "distances" in results else None
                })
        
        return formatted_results


class Agent:
    def __init__(self, llm: OpenRouterLLM, system_prompt: Optional[str] = None):
        """Initialize an agent with an LLM, tools, and RAG system.
        
        Args:
            llm: The language model to use for reasoning
            system_prompt: Optional system prompt to define agent behavior
        """
        self.llm = llm
        self.tools = {}
        self.conversation_history = []
        self.rag = RAGSystem()
        
        # Default system prompt if none provided
        if system_prompt is None:
            self.system_prompt = """You are a helpful AI assistant with access to various tools.
When you need to use a tool, respond with JSON in the format:
{"tool": "tool_name", "parameters": {"param1": "value1", ...}}
When providing responses, use these formatting conventions:
- Use # ## ### for headers to organize information
- Wrap code in ```language blocks with proper language specification  
- Use **Important:** **Warning:** **Tip:** for callouts
- Use **bold** and *italic* for emphasis
- Structure lists with - or 1. 2. 3.
- Break long responses into logical sections
Otherwise, respond directly to the user's query in a helpful and conversational manner.
Based on the conversation history and any retrieved context, provide accurate and helpful responses.
If you don't know something, say so instead of making up information.
"""
        else:
            self.system_prompt = system_prompt
        
        # Register built-in tools
        self._register_builtin_tools()
    
    def _register_builtin_tools(self):
        """Register the built-in tools for the agent."""
        
        # Initialize web crawler instance
        web_crawler = WebCrawler()
        
        def crawl_website(url: str, output_format: str = "markdown", add_to_knowledge: bool = True) -> str:
            """Crawl a website and optionally add the content to the knowledge base.
            
            Args:
                url: The URL to crawl
                output_format: Format for the content (markdown or xml)
                add_to_knowledge: Whether to automatically add crawled content to knowledge base
            """
            try:
                results = web_crawler.crawl([url], output_format=output_format)
                
                if not results:
                    return f"Failed to crawl {url} - no results returned"
                
                result = results[0]  # Single URL, single result
                
                # Check if crawling was successful
                if result['content'].startswith('Error crawling'):
                    return result['content']
                
                # Optionally add to knowledge base
                if add_to_knowledge:
                    metadata = {
                        "source": "web_crawl",
                        "url": url,
                        "title": result.get('title', ''),
                        "format": output_format
                    }
                    self.rag.add_documents([result['content']], metadatas=[metadata])
                    knowledge_msg = " (Added to knowledge base)"
                else:
                    knowledge_msg = ""
                
                return f"Successfully crawled {url}{knowledge_msg}\n\nTitle: {result.get('title', 'N/A')}\n\nContent preview: {result['content'][:500]}..."
                
            except Exception as e:
                return f"Error crawling {url}: {str(e)}"
        
        def search_knowledge(query: str, n_results: int = 3) -> str:
            """Search the knowledge base for relevant information."""
            results = self.rag.query(query, n_results=n_results)
            if not results:
                return "No relevant information found in the knowledge base."
            
            response = "Here's what I found in the knowledge base:\n\n"
            for i, result in enumerate(results):
                source_info = ""
                if result['metadata'].get('url'):
                    source_info = f" (Source: {result['metadata']['url']})"
                response += f"**Result {i+1}**{source_info}:\n{result['document'][:300]}...\n\n"
            return response
        
        def add_to_knowledge(text: str, source: str = "user_input") -> str:
            """Add information to the knowledge base."""
            self.rag.add_documents([text], metadatas=[{"source": source}])
            return f"Added to knowledge base: {text[:50]}..." if len(text) > 50 else text
        
        def get_current_time() -> str:
            """Get the current date and time."""
            now = datetime.datetime.now()
            return f"Current date and time: {now.strftime('%Y-%m-%d %H:%M:%S')}"
        
        # Register all tools
        self.register_tool(
            Tool(
                name="crawl_website",
                description="Crawl a website URL to extract its content in markdown or XML format. Automatically adds content to knowledge base unless specified otherwise.",
                function=crawl_website
            )
        )
        
        self.register_tool(
            Tool(
                name="search_knowledge",
                description="Search the knowledge base for relevant information about a query",
                function=search_knowledge
            )
        )
        
        self.register_tool(
            Tool(
                name="add_to_knowledge",
                description="Add new information to the knowledge base for future reference",
                function=add_to_knowledge
            )
        )
        
        self.register_tool(
            Tool(
                name="get_current_time",
                description="Get the current date and time",
                function=get_current_time
            )
        )
    
    def register_tool(self, tool: Tool):
        """Register a new tool with the agent.
        
        Args:
            tool: Tool object to register
        """
        self.tools[tool.name] = tool
        logger.info(f"Registered tool: {tool.name}")
    
    def get_tools_description(self) -> str:
        """Get a description of all available tools for the LLM."""
        descriptions = []
        for name, tool in self.tools.items():
            param_desc = []
            for param_name, param_info in tool.signature.items():
                param_type = param_info["type"]
                default = f" (default: {param_info['default']})" if "default" in param_info else ""
                param_desc.append(f"  - {param_name}: {param_type}{default}")
            
            tool_desc = f"Tool: {name}\n"
            tool_desc += f"Description: {tool.description}\n"
            if param_desc:
                tool_desc += "Parameters:\n" + "\n".join(param_desc)
            descriptions.append(tool_desc)
        
        return "\n\n".join(descriptions)
    
    def _extract_tool_call(self, llm_response: str) -> Optional[Dict[str, Any]]:
        """Extract tool call from LLM response if present.
        
        Args:
            llm_response: The raw response from the LLM
            
        Returns:
            Extracted tool call as a dictionary or None if no tool call
        """
        # First, try to find JSON within the response
        json_match = re.search(r'```json\s*(.*?)\s*```', llm_response, re.DOTALL)
        if not json_match:
            json_match = re.search(r'{.*"tool".*}', llm_response, re.DOTALL)
        
        if json_match:
            try:
                tool_call = json.loads(json_match.group(1) if '```' in llm_response else json_match.group(0))
                if "tool" in tool_call and tool_call["tool"] in self.tools:
                    return tool_call
            except json.JSONDecodeError:
                pass
        
        return None
    
    def get_last_user_message(self) -> Optional[str]:
        """Get the last user message from conversation history."""
        for message in reversed(self.conversation_history):
            if message["role"] == "user":
                return message["content"]
        return None
    
    def regenerate_last_response(self) -> str:
        """Regenerate the last assistant response by removing it and re-processing the last user message."""
        # Remove the last assistant message(s) and any tool-related messages
        while (self.conversation_history and 
               self.conversation_history[-1]["role"] in ["assistant", "system"]):
            self.conversation_history.pop()
        
        # Get the last user message
        last_user_message = self.get_last_user_message()
        if not last_user_message:
            return "No previous user message found to regenerate response for."
        
        # Process the message again (this will add new messages to history)
        return self.process_message(last_user_message, is_regeneration=True)
    
    def regenerate_last_response_stream(self):
        """Regenerate the last assistant response with streaming."""
        # Remove the last assistant message(s) and any tool-related messages
        while (self.conversation_history and 
               self.conversation_history[-1]["role"] in ["assistant", "system"]):
            self.conversation_history.pop()
        
        # Get the last user message
        last_user_message = self.get_last_user_message()
        if not last_user_message:
            def error_generator():
                yield "No previous user message found to regenerate response for."
            return error_generator()
        
        # Process the message again with streaming
        return self.process_message_stream(last_user_message, is_regeneration=True)
    
    def process_message(self, user_message: str, is_regeneration: bool = False) -> str:
        """Process a user message and generate a response, potentially using tools.
        
        Args:
            user_message: The message from the user
            is_regeneration: Whether this is a regeneration of a previous response
            
        Returns:
            The agent's response
        """
        # Only add user message to conversation history if it's not a regeneration
        if not is_regeneration:
            self.conversation_history.append({"role": "user", "content": user_message})
        
        # Construct messages for the LLM
        messages = [{"role": "system", "content": self.system_prompt + "\n\nAvailable Tools:\n" + self.get_tools_description()}]
        messages.extend(self.conversation_history)
        
        # Get initial response from LLM
        response = self.llm.generate(messages)
        
        # Check if response contains a tool call
        tool_call = self._extract_tool_call(response)
        
        if tool_call:
            tool_name = tool_call["tool"]
            parameters = tool_call.get("parameters", {})
            
            logger.info(f"Tool call detected: {tool_name} with parameters {parameters}")
            
            # Execute the tool
            try:
                tool_result = self.tools[tool_name](**parameters)
                
                # Add tool call and result to conversation history
                self.conversation_history.append({"role": "assistant", "content": f"I'll use the {tool_name} tool with parameters: {json.dumps(parameters)}"})
                self.conversation_history.append({"role": "system", "content": f"Tool result: {tool_result}"})
                
                # Get final response from LLM that incorporates tool result
                messages = [{"role": "system", "content": self.system_prompt + "\n\nAvailable Tools:\n" + self.get_tools_description()}]
                messages.extend(self.conversation_history)
                
                final_response = self.llm.generate(messages)
                self.conversation_history.append({"role": "assistant", "content": final_response})
                return final_response
                
            except Exception as e:
                error_message = f"Error executing tool {tool_name}: {str(e)}"
                logger.error(error_message)
                self.conversation_history.append({"role": "system", "content": error_message})
                
                # Generate response that acknowledges the error
                error_response = self.llm.generate([
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_message},
                    {"role": "assistant", "content": response},
                    {"role": "system", "content": error_message}
                ])
                
                self.conversation_history.append({"role": "assistant", "content": error_response})
                return error_response
        else:
            # No tool call, just add response to history and return
            self.conversation_history.append({"role": "assistant", "content": response})
            return response
        
    def process_message_stream(self, user_message: str, is_regeneration: bool = False):
        """Process a user message and generate a streaming response.
        
        Args:
            user_message: The message from the user
            is_regeneration: Whether this is a regeneration of a previous response
            
        Yields:
            Chunks of the agent's response
        """
        # Only add user message to conversation history if it's not a regeneration
        if not is_regeneration:
            self.conversation_history.append({"role": "user", "content": user_message})
        
        # Construct messages for the LLM
        messages = [{"role": "system", "content": self.system_prompt + "\n\nAvailable Tools:\n" + self.get_tools_description()}]
        messages.extend(self.conversation_history)
        
        # Get streaming response from LLM
        response_generator = self.llm.generate(messages, stream=True)
        
        full_response = ""
        for chunk in response_generator:
            if chunk:
                full_response += chunk
                yield chunk
        
        # Check if the complete response contains a tool call
        tool_call = self._extract_tool_call(full_response)
        
        if tool_call:
            tool_name = tool_call["tool"]
            parameters = tool_call.get("parameters", {})
            
            logger.info(f"Tool call detected: {tool_name} with parameters {parameters}")
            
            try:
                # Execute the tool
                tool_result = self.tools[tool_name](**parameters)
                
                # Add tool call and result to conversation history
                self.conversation_history.append({"role": "assistant", "content": full_response})
                self.conversation_history.append({"role": "system", "content": f"Tool result: {tool_result}"})
                
                # Stream a message about tool usage
                tool_message = f"\n\n[Used {tool_name} tool]\n\n"
                for char in tool_message:
                    yield char
                    time.sleep(0.01)  # Small delay for visual effect
                
                # Get final streaming response that incorporates tool result
                messages = [{"role": "system", "content": self.system_prompt + "\n\nAvailable Tools:\n" + self.get_tools_description()}]
                messages.extend(self.conversation_history)
                
                final_response_generator = self.llm.generate(messages, stream=True)
                final_response = ""
                
                for chunk in final_response_generator:
                    if chunk:
                        final_response += chunk
                        yield chunk
                
                self.conversation_history.append({"role": "assistant", "content": final_response})
                
            except Exception as e:
                error_message = f"\n\n[Error executing tool {tool_name}: {str(e)}]"
                for char in error_message:
                    yield char
                    time.sleep(0.01)
        else:
            # No tool call, just add response to history
            self.conversation_history.append({"role": "assistant", "content": full_response})


# Initialize the LLM and agent
api_key = os.environ.get("OPENROUTER_API_KEY")
if not api_key:
    raise ValueError("Please set the OPENROUTER_API_KEY environment variable")

llm = OpenRouterLLM(
    api_key=current_settings.get('apiKey') or os.environ.get("OPENROUTER_API_KEY"),
    model=current_settings.get('model', "deepseek/deepseek-r1:free")
)
agent = Agent(llm=llm)

# Add some initial knowledge
agent.rag.add_documents([
    "Python is a high-level, interpreted programming language known for its readability and versatility.",
    "RAG (Retrieval-Augmented Generation) is a technique that enhances LLM outputs by retrieving relevant information from a knowledge base.",
    "AI agents are systems that can perceive their environment, make decisions, and take actions to achieve specific goals."
], metadatas=[
    {"source": "initial_knowledge", "topic": "programming"},
    {"source": "initial_knowledge", "topic": "ai_techniques"},
    {"source": "initial_knowledge", "topic": "ai_systems"}
])

@app.route('/chat', methods=['POST'])
def chat():
    """Handle chat messages from the frontend with optional streaming."""
    try:
        # Debug middleware
        request_id, start_time = debug_middleware()
        
        data = request.json
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400
        
        message = data['message']
        should_stream = data.get('stream', False)
        logger.info(f"Received message: {message}, streaming: {should_stream}")
        
        # Log token usage
        if current_settings.get('debugMode', False):
            try:
                encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
                tokens = len(encoding.encode(message))
                debug_log.metrics['total_tokens'] += tokens
                debug_log.add_log('token_usage', {
                    'request_id': request_id,
                    'tokens': tokens,
                    'total_tokens': debug_log.metrics['total_tokens']
                })
            except Exception as e:
                logger.error(f"Error counting tokens: {e}")
        
        if should_stream:
            def generate_stream():
                try:
                    response_chunks = []
                    
                    for chunk in agent.process_message_stream(message):
                        if chunk:
                            response_chunks.append(chunk)
                            chunk_data = {'content': chunk}
                            sse_data = f"data: {json.dumps(chunk_data)}\n\n"
                            logger.debug(f"Sending SSE chunk: {repr(chunk)}")
                            yield sse_data
                    
                    # Log successful completion
                    if current_settings.get('debugMode', False):
                        debug_log.add_log('stream_complete', {
                            'request_id': request_id,
                            'chunks': len(response_chunks)
                        })
                    
                    yield "data: [DONE]\n\n"
                    
                except Exception as e:
                    logger.error(f"Error in streaming: {e}")
                    if current_settings.get('debugMode', False):
                        debug_log.metrics['total_errors'] += 1
                        debug_log.add_log('error', {
                            'request_id': request_id,
                            'error': str(e),
                            'type': 'streaming_error'
                        })
                    error_data = {'error': str(e)}
                    yield f"data: {json.dumps(error_data)}\n\n"
                    yield "data: [DONE]\n\n"
                finally:
                    logger.debug("Streaming completed")
            
            response = Response(
                generate_stream(),
                content_type='text/event-stream',
                headers={
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'X-Accel-Buffering': 'no'
                }
            )
            return debug_response(request_id, start_time, response)
        else:
            # Non-streaming response
            response = agent.process_message(message)
            logger.info(f"Agent response: {response}")
            
            # Log successful completion
            if current_settings.get('debugMode', False):
                debug_log.add_log('response_complete', {
                    'request_id': request_id,
                    'response_length': len(response)
                })
            
            return debug_response(request_id, start_time, jsonify({'response': response}))
            
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        if current_settings.get('debugMode', False):
            debug_log.metrics['total_errors'] += 1
            debug_log.add_log('error', {
                'request_id': request_id,
                'error': str(e),
                'type': 'processing_error'
            })
        return debug_response(request_id, start_time, jsonify({'error': str(e)}), 500)

@app.route('/chat/regenerate', methods=['POST'])
def regenerate():
    """Handle regeneration requests for the last assistant response."""
    try:
        data = request.json
        should_stream = data.get('stream', False) if data else False
        logger.info(f"Regenerating last response, streaming: {should_stream}")
        
        if should_stream:
            def generate_stream():
                try:
                    response_chunks = []
                    
                    for chunk in agent.regenerate_last_response_stream():
                        if chunk:  # Only send non-empty chunks
                            response_chunks.append(chunk)
                            chunk_data = {'content': chunk}
                            sse_data = f"data: {json.dumps(chunk_data)}\n\n"
                            logger.debug(f"Sending regenerate SSE chunk: {repr(chunk)}")
                            yield sse_data
                    
                    # Send completion signal
                    logger.debug("Sending [DONE] signal for regeneration")
                    yield "data: [DONE]\n\n"
                    
                except Exception as e:
                    logger.error(f"Error in regeneration streaming: {e}")
                    error_data = {'error': str(e)}
                    yield f"data: {json.dumps(error_data)}\n\n"
                    yield "data: [DONE]\n\n"
                finally:
                    logger.debug("Regeneration streaming completed")
            
            return Response(
                generate_stream(),
                content_type='text/event-stream',
                headers={
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'X-Accel-Buffering': 'no'
                }
            )
        else:
            # Non-streaming regeneration
            response = agent.regenerate_last_response()
            logger.info(f"Regenerated response: {response}")
            return jsonify({'response': response})
            
    except Exception as e:
        logger.error(f"Error regenerating response: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/capabilities', methods=['GET'])
def capabilities():
    """Return API capabilities including streaming support and settings."""
    return jsonify({
        'streaming': True,
        'tools': list(agent.tools.keys()),
        'model': agent.llm.model,
        'settings': {
            'model': current_settings['model'],
            'temperature': current_settings['temperature'],
            'maxTokens': current_settings['maxTokens'],
            'streamingEnabled': current_settings['streamingEnabled'],
            'securityLevel': current_settings['securityLevel'],
            'debugMode': current_settings['debugMode'],
            'tools': current_settings['tools']
        }
    })

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file uploads from the frontend."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
            
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
            
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        should_stream = request.form.get('stream', 'false').lower() == 'true'
        
        if should_stream:
            def generate_stream():
                try:
                    # Read file content
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Process file content with the agent
                    for chunk in agent.process_message_stream(f"Process this file content: {content}"):
                        if chunk:
                            chunk_data = {'content': chunk}
                            sse_data = f"data: {json.dumps(chunk_data)}\n\n"
                            yield sse_data
                    
                    yield "data: [DONE]\n\n"
                    
                except Exception as e:
                    logger.error(f"Error processing file: {e}")
                    error_data = {'error': str(e)}
                    yield f"data: {json.dumps(error_data)}\n\n"
                    yield "data: [DONE]\n\n"
                finally:
                    # Clean up the uploaded file
                    try:
                        os.remove(filepath)
                    except:
                        pass
            
            return Response(
                generate_stream(),
                content_type='text/event-stream',
                headers={
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'X-Accel-Buffering': 'no'
                }
            )
        else:
            # Read file content
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Process file content with the agent
            response = agent.process_message(f"Process this file content: {content}")
            
            # Clean up the uploaded file
            try:
                os.remove(filepath)
            except:
                pass
            
            return jsonify({
                'success': True,
                'message': response
            })
            
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/settings', methods=['GET'])
def get_settings():
    """Get current settings."""
    try:
        return jsonify({
            'settings': current_settings,
            'success': True
        })
    except Exception as e:
        logger.error(f"Error getting settings: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/settings', methods=['PUT'])
def update_settings():
    """Update settings."""
    try:
        data = request.json
        if not data or 'settings' not in data:
            return jsonify({
                'success': False,
                'message': 'No settings provided'
            }), 400
        
        new_settings = data['settings']
        
        # Validate settings
        required_fields = ['model', 'temperature', 'maxTokens', 'streamingEnabled', 
                         'securityLevel', 'debugMode', 'apiKey', 'tools']
        for field in required_fields:
            if field not in new_settings:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Validate tool fields
        required_tools = ['securityScanner', 'codeAnalysis', 'dataOperations', 'networkMonitor']
        for tool in required_tools:
            if tool not in new_settings['tools']:
                return jsonify({
                    'success': False,
                    'message': f'Missing required tool: {tool}'
                }), 400
        
        # Update settings
        global current_settings
        current_settings = new_settings
        
        # Save to file
        if not save_settings(new_settings):
            return jsonify({
                'success': False,
                'message': 'Failed to save settings'
            }), 500
        
        # Reinitialize agent with new settings
        global llm, agent
        llm = OpenRouterLLM(
            api_key=new_settings.get('apiKey') or os.environ.get("OPENROUTER_API_KEY"),
            model=new_settings.get('model', "deepseek/deepseek-r1:free")
        )
        agent = Agent(llm=llm)
        
        return jsonify({
            'settings': current_settings,
            'success': True
        })
    except Exception as e:
        logger.error(f"Error updating settings: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/settings/reset', methods=['POST'])
def reset_settings():
    """Reset settings to defaults."""
    try:
        global current_settings, llm, agent
        
        # Load default settings
        current_settings = load_settings()
        
        # Save to file
        if not save_settings(current_settings):
            return jsonify({
                'success': False,
                'message': 'Failed to save settings'
            }), 500
        
        # Reinitialize agent with default settings
        llm = OpenRouterLLM(
            api_key=current_settings.get('apiKey') or os.environ.get("OPENROUTER_API_KEY"),
            model=current_settings.get('model', "deepseek/deepseek-r1:free")
        )
        agent = Agent(llm=llm)
        
        return jsonify({
            'settings': current_settings,
            'success': True
        })
    except Exception as e:
        logger.error(f"Error resetting settings: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

if __name__ == "__main__":
    app.run(port=8000, debug=True)