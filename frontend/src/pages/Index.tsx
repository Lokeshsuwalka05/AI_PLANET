import { useState, useRef, useEffect } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { DocumentList } from '@/components/DocumentList';
import { Header } from '@/components/Header';
import { storage, type StoredDocument } from '@/lib/storage';
import { toast } from 'sonner';

export interface Document {
  id: string;
  filename: string;
  uploadTime: Date;
  size: number;
}

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const Index = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents from storage on component mount
  useEffect(() => {
    const storedDocs = storage.getDocuments();
    setDocuments(storedDocs);
  }, []);

  const handleDocumentUpload = async (file: File) => {
    try {
      const storedDoc = await storage.saveDocument(file);
      setDocuments(prev => [...prev, storedDoc]);
      setSelectedDocument(storedDoc);
      setMessages([]);

      toast.success("Document uploaded successfully");
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error("Failed to upload document");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      handleDocumentUpload(file);
    } else {
      toast.error("Please upload a PDF file");
    }
    // Reset the input value so the same file can be selected again
    event.target.value = '';
  };

  const handleQuestionSubmit = (question: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `Based on the content of "${selectedDocument?.filename}", I can help answer your question about: ${question}. This is a mock response that will be replaced with actual AI-generated answers when connected to your FastAPI backend.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const handleDeleteDocument = (document: Document) => {
    try {
      // Delete from storage
      storage.deleteDocument(document.id);

      // Update state
      setDocuments(prev => prev.filter(doc => doc.id !== document.id));

      // If the deleted document was selected, clear selection
      if (selectedDocument?.id === document.id) {
        setSelectedDocument(null);
        setMessages([]);
      }

      toast.success("Document deleted successfully");
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error("Failed to delete document");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onUploadClick={handleUploadClick} />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Document Management */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Documents</h2>
              <DocumentList
                documents={documents}
                selectedDocument={selectedDocument}
                onSelectDocument={setSelectedDocument}
                onDeleteDocument={handleDeleteDocument}
              />
            </div>
          </div>

          {/* Main Content - Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border h-[800px] flex flex-col">
              {selectedDocument ? (
                <ChatInterface
                  document={selectedDocument}
                  messages={messages}
                  onQuestionSubmit={handleQuestionSubmit}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium">Upload a PDF to get started</p>
                    <p className="text-sm mt-2">Click the "Upload PDF" button in the header to begin asking questions.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;