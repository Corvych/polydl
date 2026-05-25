import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div 
                className="relative w-full max-w-lg bg-white/95 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl transform transition-all animate-in fade-in zoom-in-95 duration-200"
                style={{ 
                    backgroundColor: 'var(--tg-theme-bg-color, undefined)', 
                    color: 'var(--tg-theme-text-color, undefined)' 
                }}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800/50">
                    <h3 className="text-xl font-bold">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--tg-theme-hint-color, undefined)' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[80vh]">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
