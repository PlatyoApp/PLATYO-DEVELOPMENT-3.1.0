import { X, Check, TrendingUp, Package, FolderTree, MessageCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  reason: 'products' | 'categories' | 'expired' | 'archived';
  currentLimit?: number;
  additionalInfo?: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  currentPlan,
  reason,
  currentLimit,
}: UpgradeModalProps) {
  const getReasonConfig = () => {
    switch (reason) {
      case 'products':
        return {
          icon: Package,
          title: 'Product Limit Reached',
          description: `Your ${currentPlan} plan includes ${currentLimit} products. Upgrade to add more.`,
        };
      case 'categories':
        return {
          icon: FolderTree,
          title: 'Category Limit Reached',
          description: `Your ${currentPlan} plan includes ${currentLimit} categories. Upgrade to add more.`,
        };
      case 'expired':
        return {
          icon: TrendingUp,
          title: 'Subscription Expired',
          description: 'Renew your subscription to continue using all features.',
        };
      case 'archived':
        return {
          icon: Package,
          title: 'Products Archived',
          description: 'Upgrade your plan to activate all your archived products.',
        };
      default:
        return {
          icon: TrendingUp,
          title: 'Upgrade Your Plan',
          description: 'Get more features and capacity with an upgraded plan.',
        };
    }
  };

  const config = getReasonConfig();
  const Icon = config.icon;

  const plans = [
    {
      name: 'FREE',
      price: 'Gratis',
      duration: '1 mes',
      products: 5,
      categories: 5,
      features: ['Hasta 5 productos', 'Hasta 5 categorías', 'Menú digital', 'Gestión de órdenes', 'Soporte por email'],
      isCurrent: currentPlan.toLowerCase() === 'free',
    },
    {
      name: 'Basic',
      price: '$49.900',
      duration: '/mes',
      products: 25,
      categories: 15,
      features: ['Hasta 25 productos', 'Hasta 15 categorías', 'Análisis y estadísticas', 'Personalización avanzada', 'Soporte prioritario'],
      isCurrent: currentPlan.toLowerCase() === 'basic',
    },
    {
      name: 'Pro',
      price: '$99.900',
      duration: '/mes',
      products: 100,
      categories: 25,
      features: ['Hasta 100 productos', 'Hasta 25 categorías', 'Análisis avanzados', 'Soporte prioritario 24/7', 'Personalización completa'],
      isCurrent: currentPlan.toLowerCase() === 'pro',
    },
    {
      name: 'Business',
      price: '$199.900',
      duration: '/mes',
      products: 200,
      categories: 50,
      features: ['Hasta 200 productos', 'Hasta 50 categorías', 'Todo lo de Pro +', 'Asistente virtual con IA', 'API personalizada', 'Soporte dedicado'],
      isCurrent: currentPlan.toLowerCase() === 'business',
      popular: true,
    },
  ];

  const handleContactSupport = () => {
    const message = encodeURIComponent(
      `Hi! I'm interested in upgrading my ${currentPlan} plan. Can you help me?`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade Your Plan">
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                {config.title}
              </h4>
              <p className="text-sm text-blue-800">
                {config.description}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Available Plans
          </h4>
          <div className="space-y-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative border-2 rounded-lg p-4 transition-all ${
                  plan.isCurrent
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-blue-200 bg-blue-50 hover:border-blue-300'
                } ${plan.popular ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                {plan.isCurrent && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded">
                      CURRENT
                    </span>
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <h5 className={`text-lg font-bold ${plan.isCurrent ? 'text-gray-700' : 'text-blue-900'}`}>
                      {plan.name}
                    </h5>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={`text-xl font-bold ${plan.isCurrent ? 'text-gray-600' : 'text-blue-800'}`}>
                        {plan.price}
                      </span>
                      {plan.duration && (
                        <span className="text-sm text-gray-500">{plan.duration}</span>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                        <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {!plan.isCurrent && (
                    <p className="text-xs text-blue-600 font-medium pt-2">
                      +{plan.products - (currentLimit || 0)} more {reason === 'categories' ? 'categories' : 'products'} available
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <p className="text-sm text-center text-gray-700">
            ¿Necesitas ayuda para elegir el plan correcto?{' '}
            <button
              onClick={handleContactSupport}
              className="text-blue-600 hover:text-blue-700 font-semibold underline"
            >
              Contáctanos
            </button>
          </p>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Maybe Later
          </Button>
          <Button
            onClick={() => {
              window.location.href = '/dashboard/subscription';
            }}
            className="flex-1"
          >
            View Plans
          </Button>
        </div>

        <div className="text-center">
          <button
            onClick={handleContactSupport}
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Contact support for help
          </button>
        </div>
      </div>
    </Modal>
  );
}
