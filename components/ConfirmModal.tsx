import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  isDangerous?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, onClose, onConfirm, title, message, confirmText = "確認", isDangerous = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            {isDangerous && <AlertTriangle size={20} className="text-red-500" />}
            {title}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5">
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button 
              onClick={() => { onConfirm(); onClose(); }}
              className={`flex-1 px-4 py-2 text-white font-medium rounded-lg transition-colors ${
                isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};