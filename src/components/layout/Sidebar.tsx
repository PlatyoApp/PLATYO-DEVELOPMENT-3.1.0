import React, { useMemo } from 'react';
import {
  BarChart3,
  Store,
  Menu,
  Settings,
  ShoppingBag,
  Users,
  CreditCard,
  Home,
  FolderOpen,
  Crown,
  HelpCircle
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Subscription } from '../../types';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;

  /**
   * Debe venir del mismo lugar que usas para:
   * <Badge variant={currentSubscription?.status === 'active' ? 'success' : 'warning'}>
   *   {getCurrentPlanName()}
   * </Badge>
   */
  currentSubscription?: Subscription | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  currentSubscription
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  /**
   * Acceso a Analytics:
   * - superadmin: siempre
   * - restaurante: solo si hay suscripción activa y NO es free
   *
   * OJO:
   * - Si tu "plan free" se llama distinto (ej. 'basic_free'), ajusta aquí.
   * - Si tu status puede ser 'trialing', 'paid', etc., ajusta aquí.
   */
  const hasAnalyticsAccess = useMemo(() => {
    if (user?.role === 'superadmin') return true;

    const isActive = currentSubscription?.status === 'active';
    const isPaid = currentSubscription?.plan_type !== 'free';

    return Boolean(isActive && isPaid);
  }, [user?.role, currentSubscription?.status, currentSubscription?.plan_type]);

  const superAdminTabs = useMemo(
    () => [
      { id: 'dashboard', name: t('dashboard'), icon: Home },
      { id: 'restaurants', name: 'Restaurants', icon: Store },
      { id: 'users', name: 'Users', icon: Users },
      { id: 'subscriptions', name: 'Subscriptions', icon: CreditCard },
      { id: 'support', name: 'Soporte', icon: HelpCircle },
      { id: 'analytics', name: t('analytics'), icon: BarChart3 }
    ],
    [t]
  );

  const restaurantTabs = useMemo(() => {
    const base = [
      { id: 'dashboard', name: t('dashboard'), icon: Home },
      { id: 'categories', name: t('categories'), icon: FolderOpen },
      { id: 'menu', name: t('menu'), icon: Menu },
      { id: 'orders', name: t('orders'), icon: ShoppingBag },
      { id: 'customers', name: t('customers'), icon: Users },
      { id: 'subscription', name: t('subscription'), icon: Crown },
      { id: 'settings', name: t('settings'), icon: Settings }
    ];

    if (hasAnalyticsAccess) {
      base.push({ id: 'analytics', name: t('analytics'), icon: BarChart3 });
    }

    return base;
  }, [t, hasAnalyticsAccess]);

  const tabs = user?.role === 'superadmin' ? superAdminTabs : restaurantTabs;

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-gray-50 min-h-screen border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <nav className="mt-8">
          <div className="px-4">
            <ul className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => {
                        onTabChange(tab.id);
                        onClose();
                      }}
                      className={`
                        w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                        ${
                          isActive
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.name}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Debug rápido opcional (quítalo luego)
            <div className="mt-4 text-xs text-gray-500">
              status: {currentSubscription?.status ?? 'none'} | plan: {currentSubscription?.plan_type ?? 'none'} | analytics: {String(hasAnalyticsAccess)}
            </div>
            */}
          </div>
        </nav>
      </aside>
    </>
  );
};
console.log('Sidebar currentSubscription:', currentSubscription);
