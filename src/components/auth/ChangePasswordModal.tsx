import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onPasswordChanged: (newPassword: string) => Promise<void>;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onPasswordChanged,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async () => {
    setError('');

    if (newPassword.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwordsDontMatch'));
      return;
    }

    try {
      setLoading(true);
      await onPasswordChanged(newPassword);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const errorMessage = err.message || 'Error al cambiar la contraseña';
      if (errorMessage.includes('weak') || errorMessage.includes('easy to guess')) {
        setError('La contraseña es muy débil o común. Debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y no ser una contraseña común.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title={t('changePasswordRequired')}
      size="md"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>{t('provisionalPasswordDetected')}</strong>
          </p>
          <p className="text-sm text-amber-700 mt-2">
            {t('securityPasswordChange')}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <Input
            label={`${t('newPassword')}*`}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
          />
          <p className="text-xs text-gray-500 mt-1">
            Debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y no ser común
          </p>
        </div>

        <div>
          <Input
            label={`${t('confirmNewPassword')}*`}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('writePasswordAgain')}
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!newPassword || !confirmPassword || loading}
            icon={Lock}
          >
            {loading ? t('processing') : t('changePassword')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
