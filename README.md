# Net-Agent Project

A cyberpunk-styled AI agent system with a modern web interface, combining a React frontend with a Python-based AI agent backend.

## Overview

This project consists of two main components:
1. A cyberpunk-styled chat interface built with React and TypeScript
2. A powerful AI agent backend built with Python, featuring RAG capabilities and tool-based interactions

## Frontend (Varys Chat Interface)

### Features
- Modern cyberpunk UI design inspired by Cyberpunk 2077
- Real-time chat interface
- Responsive layout
- Custom components with cyberpunk styling
- TypeScript for type safety

### Tech Stack
- React 18
- TypeScript
- Tailwind CSS
- Vite
- React Icons

### Frontend Project Structure
```
varys/
  ├── src/
  │   ├── components/
  │   │   ├── Button.tsx
  │   │   ├── Chat.tsx
  │   │   ├── ChatInput.tsx
  │   │   ├── Message.tsx
  │   │   └── Navbar.tsx
  │   ├── App.tsx
  │   ├── index.css
  │   └── main.tsx
```

## Backend (AI Agent System)

### Features
- OpenRouter LLM integration for advanced language model capabilities
- RAG (Retrieval-Augmented Generation) system using ChromaDB
- Tool-based architecture for extensible agent capabilities
- RESTful API endpoints for frontend communication
- Built-in tools for knowledge management and time-based operations

### Tech Stack
- Python 3.x
- Flask
- ChromaDB
- OpenRouter API
- Sentence Transformers

### Backend Components
- `OpenRouterLLM`: Handles communication with OpenRouter's language models
- `RAGSystem`: Manages document storage and retrieval using ChromaDB
- `Tool`: Base class for implementing agent tools
- `Agent`: Core agent class that orchestrates LLM, tools, and RAG system

### Built-in Tools
- `search_knowledge`: Search the knowledge base for relevant information
- `add_to_knowledge`: Add new information to the knowledge base
- `get_current_time`: Retrieve current date and time

## Getting Started

### Prerequisites
- Node.js and npm for frontend
- Python 3.x for backend
- OpenRouter API key

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd varys
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   ```bash
   # Create .env file
   OPENROUTER_API_KEY=your_api_key_here
   ```
4. Start the backend server:
   ```bash
   python app.py
   ```

## API Endpoints

### POST /chat
- Handles chat messages from the frontend
- Request body: `{"message": "user message"}`
- Response: `{"response": "agent response"}`

## Contributing

Feel free to submit issues and enhancement requests! 

## License

General 
