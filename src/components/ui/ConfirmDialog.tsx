import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';
import { useLanguage } from '../../contexts/LanguageContext';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  itemName?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger',
  itemName
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      gradient: 'from-red-50 to-rose-50',
      border: 'border-red-100',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonClass: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      gradient: 'from-orange-50 to-amber-50',
      border: 'border-orange-100',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      buttonClass: 'bg-orange-600 hover:bg-orange-700 text-white'
    },
    info: {
      gradient: 'from-blue-50 to-indigo-50',
      border: 'border-blue-100',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  };

  const styles = variantStyles[variant];

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon */}
        <div className={`bg-gradient-to-br ${styles.gradient} border-b ${styles.border} p-6 rounded-t-2xl`}>
          <div className="flex items-start gap-4">
            <div className={`${styles.iconBg} rounded-xl p-3 flex-shrink-0`}>
              <AlertTriangle className={`w-6 h-6 ${styles.iconColor}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {title}
              </h3>
              {itemName && (
                <p className="text-sm text-gray-600 font-medium bg-white/60 px-3 py-1 rounded-lg inline-block">
                  {itemName}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed">
            {message}
          </p>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                <strong>{t('warningTitle')}:</strong> {t('actionCannotBeUndone')}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            {cancelText || t('confirmDialogDefaultCancel')}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${styles.buttonClass}`}
          >
            {confirmText || t('confirmDialogDefaultConfirm')}
          </button>
        </div>
      </div>
    </div>
  );
};
