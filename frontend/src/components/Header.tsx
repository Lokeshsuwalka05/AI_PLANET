import React from 'react';
import logo from '../assets/AI Planet Logo.png';

interface HeaderProps {
  onUploadClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onUploadClick }) => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
         
            <img src={logo} alt="Logo" className="h-9 w-35" />
         
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={onUploadClick}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Upload PDF
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};