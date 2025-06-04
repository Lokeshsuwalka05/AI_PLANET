// API base URL - use environment variable in production
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
export interface ApiDocument {
  id: number;
  filename: string;
  upload_date: string;
  text_length: number;
}

export interface ApiResponse {
  question: string;
  answer: string;
  source_document: string;
}

export const api = {
  // Upload a PDF file
  async uploadPdf(file: File): Promise<ApiDocument> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload document');
    }

    return response.json();
  },

  // Ask a question about the uploaded document
  async askQuestion(question: string): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('question', question);

    const response = await fetch(`${API_BASE_URL}/ask/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get answer');
    }

    return response.json();
  },

  // Get list of uploaded documents
  async getDocuments(): Promise<ApiDocument[]> {
    const response = await fetch(`${API_BASE_URL}/documents/`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch documents');
    }

    return response.json();
  },

  // Delete a document
  async deleteDocument(documentId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete document');
    }
  },
}; 