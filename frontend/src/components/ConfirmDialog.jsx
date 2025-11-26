import React from 'react';
import { FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) => {
    if (!isOpen) return null;

    const iconColors = {
        danger: 'text-red-600',
        warning: 'text-yellow-600',
        info: 'text-blue-600',
        success: 'text-green-600'
    };

    const buttonColors = {
        danger: 'bg-red-600 hover:bg-red-700',
        warning: 'bg-yellow-600 hover:bg-yellow-700',
        info: 'bg-blue-600 hover:bg-blue-700',
        success: 'bg-green-600 hover:bg-green-700'
    };

    const Icon = type === 'danger' ? FaExclamationTriangle : 
                 type === 'warning' ? FaExclamationTriangle :
                 type === 'success' ? FaCheckCircle : FaTimesCircle;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                            type === 'danger' ? 'bg-red-100' : 
                            type === 'warning' ? 'bg-yellow-100' : 
                            type === 'success' ? 'bg-green-100' : 
                            'bg-blue-100'
                        } ${iconColors[type]}`}>
                            <Icon className="text-xl" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                        </div>
                    </div>
                    <p className="text-gray-600 mb-6">{message}</p>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`px-4 py-2 text-white rounded-lg transition-colors font-medium ${buttonColors[type]}`}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;

