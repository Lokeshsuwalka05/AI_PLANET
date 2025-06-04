from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

# Load .env file
load_dotenv()

# Configure Gemini API
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is not set")

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./documents.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Initialize LangChain components
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len
)

# Initialize Google embeddings
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001",
    google_api_key=GOOGLE_API_KEY
)

# Store for vector databases
vector_stores = {}

# Initialize Gemini LLM
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=GOOGLE_API_KEY)

# Define a prompt template for QA
qa_prompt = PromptTemplate(
    input_variables=["context", "question"],
    template="""Context: {context}

Question: {question}

Please provide your answer in a clear, structured format:
1. Use bullet points or numbered lists where appropriate
2. Break down complex information into smaller, digestible points
3. Highlight key information using markdown formatting
4. Keep each point concise and focused

Answer:"""
)

# Create a QA chain using LLMChain
qa_chain = LLMChain(llm=llm, prompt=qa_prompt)

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    upload_date = Column(DateTime, default=datetime.utcnow)
    text = Column(String)

# Create database tables
Base.metadata.create_all(bind=engine)

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

@app.post("/upload/")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        print(f"\n=== Starting PDF Upload Process ===")
        print(f"Processing file: {file.filename}")
        
        # Save the uploaded file
        file_path = f"uploads/{file.filename}"
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        print(f"File saved to: {file_path}")
        
        # Extract text from PDF
        text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            print(f"Successfully extracted text from PDF")
            print(f"Extracted text length: {len(text)} characters")
            if len(text) == 0:
                raise Exception("No text could be extracted from the PDF")
        except Exception as e:
            print(f"Error extracting text from PDF: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error extracting text from PDF: {str(e)}"
            )
        
        # Save to database
        try:
            db = SessionLocal()
            doc = Document(filename=file.filename, text=text)
            db.add(doc)
            db.commit()
            db.refresh(doc)
            db.close()
            print(f"Document saved to database with ID: {doc.id}")
        except Exception as e:
            print(f"Error saving to database: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error saving to database: {str(e)}"
            )

        try:
            # Create vector store for the document
            print("Creating vector store...")
            texts = text_splitter.split_text(text)
            print(f"Split text into {len(texts)} chunks")
            vector_store = Chroma.from_texts(texts, embeddings)
            vector_stores[file.filename] = vector_store
            print("Vector store created successfully")
        except Exception as e:
            print(f"Error creating vector store: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error creating vector store: {str(e)}"
            )
        
        print("=== PDF Upload Process Completed Successfully ===\n")
        return {
            "id": doc.id,
            "filename": file.filename,
            "upload_date": doc.upload_date.isoformat(),
            "text_length": len(text)
        }
    
    except Exception as e:
        print(f"Error in upload endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing file: {str(e)}"
        )

@app.post("/ask/")
async def ask_question(question: str = Form(...)):
    try:
        print(f"\n=== Processing Question ===")
        print(f"Question: {question}")
        
        # Get the most recently uploaded document
        db = SessionLocal()
        doc = db.query(Document).order_by(Document.upload_date.desc()).first()
        db.close()
        
        if not doc:
            print("No documents found in database")
            raise HTTPException(status_code=404, detail="No documents found. Please upload a PDF first.")
        
        print(f"Found document: {doc.filename}")
        
        # Get the vector store for the document
        vector_store = vector_stores.get(doc.filename)
        if not vector_store:
            print(f"Vector store not found for {doc.filename}, creating new one...")
            # Create vector store if it doesn't exist
            texts = text_splitter.split_text(doc.text)
            vector_store = Chroma.from_texts(texts, embeddings)
            vector_stores[doc.filename] = vector_store
            print("Vector store created successfully")
        
        try:
            # Retrieve relevant chunks from the vector store
            print("Retrieving relevant chunks...")
            retriever = vector_store.as_retriever(search_kwargs={"k": 3})
            docs = retriever.get_relevant_documents(question)
            context = "\n".join([doc.page_content for doc in docs])
            print(f"Retrieved {len(docs)} relevant chunks")
            
            # Generate answer using Gemini via LangChain
            print("Generating answer...")
            answer = qa_chain.run(context=context, question=question)
            print("Answer generated successfully")
            
            print("=== Question Processing Completed Successfully ===\n")
            return {
                "question": question,
                "answer": answer,
                "source_document": doc.filename
            }
        except Exception as e:
            print(f"Error in QA chain: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error processing question: {str(e)}"
            )
    
    except Exception as e:
        print(f"Error in ask endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {str(e)}"
        )

@app.get("/documents/")
async def list_documents():
    try:
        db = SessionLocal()
        documents = db.query(Document).all()
        db.close()
        
        return [
            {
                "id": doc.id,
                "filename": doc.filename,
                "upload_date": doc.upload_date.isoformat(),
                "text_length": len(doc.text)
            }
            for doc in documents
        ]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/{document_id}")
async def delete_document(document_id: int):
    try:
        db = SessionLocal()
        doc = db.query(Document).filter(Document.id == document_id).first()
        
        if not doc:
            db.close()
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Remove from vector store
        if doc.filename in vector_stores:
            del vector_stores[doc.filename]
        
        # Remove from database
        db.delete(doc)
        db.commit()
        db.close()
        
        # Remove the file from uploads directory
        file_path = f"uploads/{doc.filename}"
        if os.path.exists(file_path):
            os.remove(file_path)
        
        return {"message": "Document deleted successfully"}
    
    except Exception as e:
        print(f"Error deleting document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 