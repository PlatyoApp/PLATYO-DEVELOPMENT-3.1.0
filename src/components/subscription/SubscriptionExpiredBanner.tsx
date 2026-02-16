import { AlertTriangle, Lock, Archive, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface SubscriptionExpiredBannerProps {
  type: 'expired' | 'limit_reached' | 'downgraded' | 'near_limit';
  planName?: string;
  current?: number;
  max?: number;
  resourceType?: 'products' | 'categories';
  archivedCount?: number;
  daysRemaining?: number;
  onViewArchived?: () => void;
  dismissible?: boolean;
}

export function SubscriptionExpiredBanner({
  type,
  planName,
  current,
  max,
  resourceType = 'products',
  archivedCount = 0,
  daysRemaining,
  onViewArchived,
  dismissible = false,
}: SubscriptionExpiredBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const getBannerConfig = () => {
    switch (type) {
      case 'expired':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          textColor: 'text-red-900',
          title: 'Subscription Expired',
          message: 'Your plan has expired. Renew now to continue using all features.',
          actionText: 'Renew Plan',
          actionLink: '/dashboard/subscription',
        };
      case 'limit_reached':
        return {
          icon: Lock,
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          iconColor: 'text-amber-600',
          textColor: 'text-amber-900',
          title: `${resourceType === 'products' ? 'Product' : 'Category'} Limit Reached`,
          message: `You've reached your limit of ${max} ${resourceType} on the ${planName} plan. Upgrade to add more.`,
          actionText: 'Upgrade Plan',
          actionLink: '/dashboard/subscription',
        };
      case 'downgraded':
        return {
          icon: Archive,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          textColor: 'text-blue-900',
          title: 'Products Archived Due to Plan Change',
          message: `${archivedCount} ${resourceType} were automatically archived to match your new plan limit (${max} ${resourceType}).`,
          actionText: 'View Archived',
          actionLink: '#',
          showSecondaryAction: true,
        };
      case 'near_limit':
        return {
          icon: TrendingUp,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          textColor: 'text-yellow-900',
          title: 'Approaching Limit',
          message: `You're using ${current} of ${max} ${resourceType}. Consider upgrading soon.`,
          actionText: 'View Plans',
          actionLink: '/dashboard/subscription',
        };
      default:
        return null;
    }
  };

  const config = getBannerConfig();
  if (!config) return null;

  const Icon = config.icon;

  const handleAction = (e: React.MouseEvent) => {
    if (type === 'downgraded' && onViewArchived) {
      e.preventDefault();
      onViewArchived();
    }
  };

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 mb-6 relative`}>
      <div className="flex items-start gap-3">
        <div className={`${config.iconColor} flex-shrink-0 mt-0.5`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold ${config.textColor} mb-1`}>
            {config.title}
          </h3>
          <p className={`text-sm ${config.textColor} mb-3`}>
            {config.message}
          </p>
          <div className="flex flex-wrap gap-2">
            {type === 'downgraded' && onViewArchived ? (
              <button
                onClick={handleAction}
                className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${config.iconColor} bg-white border ${config.borderColor} hover:bg-opacity-90 transition-colors`}
              >
                {config.actionText}
              </button>
            ) : (
              <Link
                to={config.actionLink}
                className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${config.iconColor} bg-white border ${config.borderColor} hover:bg-opacity-90 transition-colors`}
              >
                {config.actionText}
              </Link>
            )}
            {config.showSecondaryAction && (
              <Link
                to="/dashboard/subscription"
                className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${config.iconColor} bg-white border ${config.borderColor} hover:bg-opacity-90 transition-colors`}
              >
                Upgrade Plan
              </Link>
            )}
          </div>
        </div>
        {dismissible && (
          <button
            onClick={() => setIsDismissed(true)}
            className={`${config.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      {daysRemaining !== undefined && daysRemaining <= 7 && type !== 'expired' && (
        <div className={`mt-3 pt-3 border-t ${config.borderColor}`}>
          <p className={`text-xs ${config.textColor} font-medium`}>
            ⏰ {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining in your subscription
          </p>
        </div>
      )}
    </div>
  );
}
