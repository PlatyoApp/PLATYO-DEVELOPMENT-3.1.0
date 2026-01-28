import React, { useState } from 'react';
import { Store, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { TermsAndConditions } from './TermsAndConditions';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    restaurantName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '+57 ',
    address: '',
    ownerName: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  const { register } = useAuth();
  const { t } = useLanguage();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.restaurantName.trim()) {
      newErrors.restaurantName = t('restaurantNameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('invalidEmail');
    }

    if (!formData.password) {
      newErrors.password = t('passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('passwordTooShort');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordsDontMatch');
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = t('mustAcceptTerms');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await register({
        restaurantName: formData.restaurantName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
        ownerName: formData.ownerName,
      });

      if (result.success) {
        setSuccess(true);
      } else {
        setErrors({ general: result.error || t('registerError') });
      }
    } catch (err) {
      setErrors({ general: t('unexpectedError') });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Store className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('registrationSuccessful')}</h2>
          <p className="text-gray-600 mb-8">
            {t('accountPendingApproval')}
          </p>
          <Button
            onClick={onSwitchToLogin}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            size="lg"
          >
            {t('backToLogin')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <div>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('registerTitle')}</h2>
          <p className="text-gray-600">{t('registerSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              name="restaurantName"
              label={`${t('restaurantName')}*`}
              value={formData.restaurantName}
              onChange={handleChange}
              error={errors.restaurantName}
              placeholder={t('restaurantNamePlaceholder')}
            />

            <Input
              name="ownerName"
              label={t('ownerName')}
              value={formData.ownerName}
              onChange={handleChange}
              placeholder={t('ownerNamePlaceholder')}
            />

            <Input
              name="email"
              type="email"
              label={`${t('contactEmail')}*`}
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder={t('contactEmailPlaceholder')}
            />

            <Input
              name="phone"
              label={t('phone')}
              value={formData.phone}
              onChange={handleChange}
              placeholder={t('phonePlaceholder')}
            />
          </div>

          <Input
            name="address"
            label={t('restaurantAddress')}
            value={formData.address}
            onChange={handleChange}
            placeholder={t('addressPlaceholder')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                name="password"
                type="password"
                label={`${t('password')}*`}
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Mínimo 8 caracteres"
              />
              <p className="text-xs text-gray-500 mt-1">
                Debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y no ser común
              </p>
            </div>

            <Input
              name="confirmPassword"
              type="password"
              label={`${t('confirmPassword')}*`}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder={t('repeatPassword')}
            />
          </div>

          <div className="flex items-start">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-600">
              {t('acceptTerms')}{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowTermsModal(true);
                }}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                {t('termsAndConditions')}
              </button>{' '}
              {t('ofService')}
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-red-600 text-sm">{errors.acceptTerms}</p>
          )}

          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            className="w-full bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-600 hover:to-red-700"
            size="lg"
          >
            {t('createAccount')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onSwitchToLogin}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('backToLogin')}
          </button>
        </div>
      </div>

      <Modal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title={t('termsModalTitle')}
        size="xl"
      >
        <TermsAndConditions onAccept={() => {
          setFormData(prev => ({ ...prev, acceptTerms: true }));
          setShowTermsModal(false);
          if (errors.acceptTerms) {
            setErrors(prev => ({ ...prev, acceptTerms: '' }));
          }
        }} />
      </Modal>
    </div>
  );
};
