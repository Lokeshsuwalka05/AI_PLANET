# PDF Question Answering System

A full-stack application that allows users to upload PDF documents and ask questions about their content using AI.

## Features

- PDF document upload and processing
- AI-powered question answering using Google's Gemini API
- Real-time chat interface
- Document management
- Responsive design

## Tech Stack

### Frontend
- React with TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components

### Backend
- FastAPI
- SQLite (for document storage)
- LangChain
- Google Gemini API
- PDF processing with pdfplumber

## Local Development

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file with your Google API key:
   ```
   GOOGLE_API_KEY=your_api_key_here
   ```

4. Start the backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

The application is deployed using:
- Backend: Render.com (Free tier)
- Frontend: Vercel (Free tier)

## Live Demo

[Add your deployed application URL here]

## Project Structure

```
.
├── backend/
│   ├── main.py           # FastAPI application
│   ├── requirements.txt  # Python dependencies
│   └── uploads/         # PDF storage directory
└── frontend/
    ├── src/
    │   ├── components/  # React components
    │   ├── lib/        # API and utilities
    │   └── pages/      # Page components
    └── package.json    # Node.js dependencies
```
