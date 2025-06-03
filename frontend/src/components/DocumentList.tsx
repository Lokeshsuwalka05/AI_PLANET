import React from 'react';
import type { Document } from '@/pages/Index';
// import { toast } from 'sonner';

interface DocumentListProps {
  documents: Document[];
  selectedDocument: Document | null;
  onSelectDocument: (document: Document) => void;
  onDeleteDocument: (document: Document) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedDocument,
  onSelectDocument,
  onDeleteDocument,
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = (e: React.MouseEvent, document: Document) => {
    e.stopPropagation(); // Prevent document selection when clicking delete
    onDeleteDocument(document);
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((document) => (
        <div
          key={document.id}
          onClick={() => onSelectDocument(document)}
          className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedDocument?.id === document.id
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
        >
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {document.filename}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(document.size)} • {formatDate(document.uploadTime)}
              </p>
            </div>
            <button
              onClick={(e) => handleDelete(e, document)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete document"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};