import os
import json
import requests
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
from flask import Flask, request, jsonify, Response, stream_template
import json
import time
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,  # Change to DEBUG level
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

class OpenRouterLLM:
    def __init__(self, api_key: Optional[str] = None, model: str = "meta-llama/llama-3.3-70b-instruct:free"):
        """Initialize OpenRouter LLM client.
        
        Args:
            api_key: OpenRouter API key. If None, it will look for OPENROUTER_API_KEY env variable
            model: The model identifier to use
        """
        self.api_key = api_key or os.environ.get("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("OpenRouter API key not found. Set OPENROUTER_API_KEY environment variable or pass api_key.")
        
        self.model = model
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "AI Agent Example"
        }
    
    def generate(self, messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: int = 1000, stream: bool = False):
        """Generate a response using the LLM.
        
        Args:
            messages: List of message objects with role and content
            temperature: Controls randomness (0 to 1)
            max_tokens: Maximum number of tokens to generate
            stream: Whether to stream the response
            
        Returns:
            The LLM response text (string) or generator (if streaming)
        """
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream
        }
        
        try:
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                stream=stream
            )
            response.raise_for_status()
            
            if stream:
                return self._handle_streaming_response(response)
            else:
                result = response.json()
                return result["choices"][0]["message"]["content"]
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling OpenRouter API: {e}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"Response: {e.response.text}")
            if stream:
                def error_generator():
                    yield f"Error generating response: {str(e)}"
                return error_generator()
            else:
                return f"Error generating response: {str(e)}"
    
    def _handle_streaming_response(self, response):
        """Handle streaming response from OpenRouter API."""
        def generate_chunks():
            try:
                for line in response.iter_lines():
                    if line:
                        decoded_line = line.decode('utf-8')
                        if decoded_line.startswith('data: '):
                            data = decoded_line[6:]  # Remove 'data: ' prefix
                            if data.strip() == '[DONE]':
                                break
                            try:
                                chunk_data = json.loads(data)
                                if 'choices' in chunk_data and len(chunk_data['choices']) > 0:
                                    delta = chunk_data['choices'][0].get('delta', {})
                                    if 'content' in delta:
                                        yield delta['content']
                            except json.JSONDecodeError:
                                continue
            except Exception as e:
                logger.error(f"Error in streaming response: {e}")
                yield f" [Error: {str(e)}]"
        
        return generate_chunks()


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
        
        def search_knowledge(query: str, n_results: int = 3) -> str:
            """Search the knowledge base for relevant information."""
            results = self.rag.query(query, n_results=n_results)
            if not results:
                return "No relevant information found in the knowledge base."
            
            response = "Here's what I found in the knowledge base:\n\n"
            for i, result in enumerate(results):
                response += f"#{i+1}: {result['document']}\n\n"
            return response
        
        def add_to_knowledge(text: str, source: str = "user_input") -> str:
            """Add information to the knowledge base."""
            self.rag.add_documents([text], metadatas=[{"source": source}])
            return f"Added to knowledge base: {text[:50]}..." if len(text) > 50 else text
        
        def get_current_time() -> str:
            """Get the current date and time."""
            now = datetime.datetime.now()
            return f"Current date and time: {now.strftime('%Y-%m-%d %H:%M:%S')}"
        
        # Register the tools
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
    
    def process_message(self, user_message: str) -> str:
        """Process a user message and generate a response, potentially using tools.
        
        Args:
            user_message: The message from the user
            
        Returns:
            The agent's response
        """
        # Add user message to conversation history
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
        
    def process_message_stream(self, user_message: str):
        """Process a user message and generate a streaming response.
        
        Args:
            user_message: The message from the user
            
        Yields:
            Chunks of the agent's response
        """
        # Add user message to conversation history
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

llm = OpenRouterLLM(api_key=api_key)
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
        data = request.json
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400
        
        message = data['message']
        should_stream = data.get('stream', False)
        logger.info(f"Received message: {message}, streaming: {should_stream}")
        
        if should_stream:
            def generate_stream():
                try:
                    response_chunks = []  # Collect chunks for potential tool processing
                    
                    for chunk in agent.process_message_stream(message):
                        if chunk:  # Only send non-empty chunks
                            response_chunks.append(chunk)
                            chunk_data = {'content': chunk}
                            sse_data = f"data: {json.dumps(chunk_data)}\n\n"
                            logger.debug(f"Sending SSE chunk: {repr(chunk)}")
                            yield sse_data
                    
                    # Send completion signal
                    logger.debug("Sending [DONE] signal")
                    yield "data: [DONE]\n\n"
                    
                except Exception as e:
                    logger.error(f"Error in streaming: {e}")
                    error_data = {'error': str(e)}
                    yield f"data: {json.dumps(error_data)}\n\n"
                    yield "data: [DONE]\n\n"  # Always send done signal
                finally:
                    # Ensure proper cleanup
                    logger.debug("Streaming completed")
            
            return Response(
                generate_stream(),
                content_type='text/event-stream',
                headers={
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'X-Accel-Buffering': 'no'  # Disable proxy buffering
                }
            )
        else:
            # Non-streaming response (existing behavior)
            response = agent.process_message(message)
            logger.info(f"Agent response: {response}")
            return jsonify({'response': response})
            
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/capabilities', methods=['GET'])
def capabilities():
    """Return API capabilities including streaming support."""
    return jsonify({
        'streaming': True,
        'tools': list(agent.tools.keys()),
        'model': agent.llm.model
    })

if __name__ == "__main__":
    app.run(port=8000, debug=True)