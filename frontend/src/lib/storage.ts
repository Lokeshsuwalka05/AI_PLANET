export interface StoredDocument {
  id: string;
  filename: string;
  uploadTime: Date;
  size: number;
  content: string; // Base64 encoded PDF content
}

const STORAGE_KEY = 'ai_planet_documents';

export const storage = {
  saveDocument: async (file: File): Promise<StoredDocument> => {
    // Convert file to base64
    const content = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.readAsDataURL(file);
    });

    const document: StoredDocument = {
      id: Date.now().toString(),
      filename: file.name,
      uploadTime: new Date(),
      size: file.size,
      content,
    };

    // Get existing documents
    const existingDocs = storage.getDocuments();

    // Add new document
    const updatedDocs = [...existingDocs, document];

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDocs));

    return document;
  },

  getDocuments: (): StoredDocument[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const documents = JSON.parse(stored) as StoredDocument[];
    // Convert string dates back to Date objects
    return documents.map(doc => ({
      ...doc,
      uploadTime: new Date(doc.uploadTime)
    }));
  },

  getDocument: (id: string): StoredDocument | null => {
    const documents = storage.getDocuments();
    return documents.find(doc => doc.id === id) || null;
  },

  deleteDocument: (id: string): void => {
    const documents = storage.getDocuments();
    const updatedDocs = documents.filter(doc => doc.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDocs));
  },

  clearDocuments: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  }
}; 