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
      name: 'Basic',
      products: 50,
      categories: 10,
      isCurrent: currentPlan.toLowerCase() === 'basic',
    },
    {
      name: 'Pro',
      products: 200,
      categories: 20,
      isCurrent: currentPlan.toLowerCase() === 'pro',
    },
    {
      name: 'Business',
      products: 1000,
      categories: 50,
      isCurrent: currentPlan.toLowerCase() === 'business',
      popular: true,
    },
  ];

  const features = [
    'Unlimited orders',
    'Advanced analytics',
    'Custom domain support',
    'Priority support',
    'Advanced customization',
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
                <div className="space-y-2">
                  <h5 className={`text-lg font-bold ${plan.isCurrent ? 'text-gray-700' : 'text-blue-900'}`}>
                    {plan.name}
                  </h5>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      <span className="font-medium">{plan.products} products</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FolderTree className="w-4 h-4" />
                      <span className="font-medium">{plan.categories} categories</span>
                    </div>
                  </div>
                  {!plan.isCurrent && (
                    <p className="text-xs text-gray-600 pt-1">
                      +{plan.products - (currentLimit || 0)} more {reason === 'categories' ? 'categories' : 'products'} available
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            All Plans Include
          </h4>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
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
