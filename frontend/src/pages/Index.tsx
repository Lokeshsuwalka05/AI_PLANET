import { useState, useRef, useEffect } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { DocumentList } from '@/components/DocumentList';
import { Header } from '@/components/Header';
import { toast } from 'sonner';
import { api, type ApiDocument } from '@/lib/api';

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
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents from API on component mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const apiDocs = await api.getDocuments();
      const formattedDocs = apiDocs.map(doc => ({
        id: doc.id.toString(),
        filename: doc.filename,
        uploadTime: new Date(doc.upload_date),
        size: doc.text_length
      }));
      setDocuments(formattedDocs);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error("Failed to load documents");
    }
  };

  const handleDocumentUpload = async (file: File) => {
    try {
      setIsLoading(true);
      const response = await api.uploadPdf(file);

      if (!response || typeof response.id === 'undefined') {
        throw new Error('Invalid response from server');
      }

      const newDoc: Document = {
        id: String(response.id),
        filename: response.filename || file.name,
        uploadTime: new Date(response.upload_date || new Date()),
        size: response.text_length || 0
      };

      setDocuments(prev => [...prev, newDoc]);
      setSelectedDocument(newDoc);
      setMessages([]);

      toast.success("Document uploaded successfully");
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error instanceof Error ? error.message : "Failed to upload document");
    } finally {
      setIsLoading(false);
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

  const handleQuestionSubmit = async (question: string) => {
    if (!selectedDocument) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await api.askQuestion(question);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.answer,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting answer:', error);
      toast.error(error instanceof Error ? error.message : "Failed to get answer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (document: Document) => {
    try {
      await api.deleteDocument(document.id);

      // Remove from state
      setDocuments(prev => prev.filter(doc => doc.id !== document.id));

      // If the deleted document was selected, clear selection
      if (selectedDocument?.id === document.id) {
        setSelectedDocument(null);
        setMessages([]);
      }

      toast.success("Document deleted successfully");
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(error instanceof Error ? error.message : "Failed to delete document");
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
            <div className="bg-white rounded-lg shadow-sm border h-[500px] flex flex-col">
              {selectedDocument ? (
                <ChatInterface
                  document={selectedDocument}
                  messages={messages}
                  onQuestionSubmit={handleQuestionSubmit}
                  isLoading={isLoading}
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