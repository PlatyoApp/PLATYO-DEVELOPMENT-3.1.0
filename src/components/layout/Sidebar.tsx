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
import { loadFromStorage } from '../../data/mockData';
import { Subscription } from '../../types';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;

  /**
   * Pásalo desde el componente donde ya tienes getCurrentPlanName()
   * Ej: currentPlanName={getCurrentPlanName()}
   */
  currentPlanName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  currentPlanName
}) => {
  const { user, restaurant } = useAuth();
  const { t } = useLanguage();

  /**
   * Normaliza el nombre del plan para comparar de forma robusta.
   * Ejemplos que convertimos a "free": "Free", "FREE", "Plan Free", "Gratis", etc.
   */
  const normalizedPlanName = useMemo(() => {
    const p = String(currentPlanName ?? '').trim().toLowerCase();
    return p;
  }, [currentPlanName]);

  /**
   * Fallback (solo por si no te pasan currentPlanName aún)
   * Mantiene compatibilidad con tu sistema actual de storage.
   */
  const hasPaidPlanFromStorage = useMemo(() => {
    if (user?.role === 'superadmin') return true;
    if (!restaurant?.id) return false;

    const subscriptions = loadFromStorage('subscriptions', []) as Subscription[];

    const currentSubscription = subscriptions.find((sub) => {
      const sameRestaurant = String(sub.restaurant_id) === String(restaurant.id);
      const isActive = String(sub.status).toLowerCase() === 'active';
      return sameRestaurant && isActive;
    });

    if (!currentSubscription) return false;

    const planType = String((currentSubscription as any).plan_type ?? '').toLowerCase();
    return planType !== 'free' && planType !== '';
  }, [user?.role, restaurant?.id]);

  /**
   * Regla final para mostrar Analytics:
   * - superadmin: sí
   * - si viene currentPlanName: se usa como fuente de verdad
   * - si no viene, usa fallback del storage
   */
  const hasAnalyticsAccess = useMemo(() => {
    if (user?.role === 'superadmin') return true;

    // Si el padre ya sabe el plan (getCurrentPlanName), úsalo
    if (normalizedPlanName) {
      // Consideramos “free/gratis” como no pagado
      const isFree =
        normalizedPlanName === 'free' ||
        normalizedPlanName === 'gratis' ||
        normalizedPlanName.includes('free') ||
        normalizedPlanName.includes('gratis');

      return !isFree;
    }

    // Fallback
    return hasPaidPlanFromStorage;
  }, [user?.role, normalizedPlanName, hasPaidPlanFromStorage]);

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
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

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
                          activeTab === tab.id
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

            {/* Debug temporal (opcional). Quita cuando funcione:
            <div className="mt-4 text-xs text-gray-500">
              plan: {String(currentPlanName ?? 'N/A')} | analytics: {String(hasAnalyticsAccess)}
            </div>
            */}
          </div>
        </nav>
      </aside>
    </>
  );
};
