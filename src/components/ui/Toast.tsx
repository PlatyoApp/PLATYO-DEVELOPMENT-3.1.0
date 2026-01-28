import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
  customColors?: { primary?: string; secondary?: string };
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  duration = 5000,
  customColors,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    const iconColor = customColors?.secondary;
    const iconClass = "w-4 h-4 sm:w-5 sm:h-5";

    switch (type) {
      case 'success':
        return <CheckCircle className={iconClass} style={iconColor ? { color: iconColor } : { color: '#4ade80' }} />;
      case 'warning':
        return <AlertTriangle className={iconClass} style={iconColor ? { color: iconColor } : { color: '#fbbf24' }} />;
      case 'error':
        return <XCircle className={iconClass} style={iconColor ? { color: iconColor } : { color: '#f87171' }} />;
      case 'info':
        return <Info className={iconClass} style={iconColor ? { color: iconColor } : { color: '#60a5fa' }} />;
    }
  };

  const getStyles = () => {
    if (customColors?.primary) {
      return {
        style: {
          backgroundColor: `${customColors.primary}ff`,
          borderColor: `${customColors.primary}40`,
          color: customColors.secondary || '#000000'
        },
        className: ''
      };
    }

    switch (type) {
      case 'success':
        return { className: 'bg-green-50 border-green-200 text-green-800', style: undefined };
      case 'warning':
        return { className: 'bg-yellow-50 border-yellow-200 text-yellow-800', style: undefined };
      case 'error':
        return { className: 'bg-red-50 border-red-200 text-red-800', style: undefined };
      case 'info':
        return { className: 'bg-blue-50 border-blue-200 text-blue-800', style: undefined };
      default:
        return { className: 'bg-gray-50 border-gray-200 text-gray-800', style: undefined };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`fixed top-4 right-4 left-4 sm:left-auto z-50 max-w-sm sm:w-full w-auto border rounded-lg p-3 sm:p-4 shadow-lg transform transition-all duration-300 ease-in-out ${styles.className}`}
      style={styles.style}
    >
      <div className="flex items-start gap-2 sm:gap-0">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <>
          {customColors?.primary && (
            <style>
              {`
                .customSecondaryImportant {
                  color: ${customColors?.secondary} !important;
                }
                .customSecondaryImportant svg {
                  color: ${customColors?.secondary} !important;
                  opacity: 0.6;
                }
              `}
            </style>
          )}

          <div className="ml-2 sm:ml-3 flex-1 min-w-0">
            <h3
              className={`text-xs sm:text-sm font-medium break-words ${
                customColors?.primary ? 'customSecondaryImportant' : ''
              }`}
            >
              {title}
            </h3>
            <p
              className={`text-xs sm:text-sm mt-1 opacity-90 break-words ${
                customColors?.primary ? 'customSecondaryImportant' : ''
              }`}
            >
              {message}
            </p>
          </div>

          <div className="ml-2 sm:ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className={`inline-flex transition ease-in-out duration-150 ${
                customColors?.primary ? 'customSecondaryImportant' : ''
              }`}
              style={!customColors?.primary ? { color: '#9ca3af' } : undefined}
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </>
      </div>
    </div>
  );
};