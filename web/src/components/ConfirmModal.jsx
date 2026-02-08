import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    isDangerous = false
}) => {
    const { t } = useTranslation();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-6">
                <div className="flex items-start gap-4">
                    {isDangerous && (
                        <div className="p-3 bg-red-500/10 rounded-xl">
                            <AlertTriangle className="text-red-500" size={24} />
                        </div>
                    )}
                    <div className="space-y-2">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                    >
                        {cancelText || t('components.confirmModal.cancel')}
                    </Button>
                    <Button
                        variant={isDangerous ? 'danger' : 'primary'}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText || t('components.confirmModal.confirm')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
