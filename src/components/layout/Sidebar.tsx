import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpen,
  onClose
}) => {
  const { user, restaurant } = useAuth();
  const { t } = useLanguage();

  // 1) Cargar suscripciones a estado (en vez de leer storage en cada render)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() =>
    loadFromStorage('subscriptions', [])
  );

  // 2) Función para recargar desde storage (por si cambian)
  const refreshSubscriptions = useCallback(() => {
    const next = loadFromStorage('subscriptions', []);
    setSubscriptions(Array.isArray(next) ? next : []);
  }, []);

  // 3) Carga inicial + opcional: escuchar cambios del storage entre pestañas/ventanas
  useEffect(() => {
    refreshSubscriptions();

    // Si en algún momento actualizas localStorage en otra pestaña, esto refresca
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'subscriptions') refreshSubscriptions();
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refreshSubscriptions]);

  // 4) Determinar acceso a analytics de forma memoizada
  const hasAnalyticsAccess = useMemo(() => {
    if (user?.role === 'superadmin') return true;
    if (!restaurant?.id) return false;

    // Busca suscripción activa del restaurante
    const currentSubscription = subscriptions.find((sub) => {
      // Ojo: si restaurant.id o sub.restaurant_id pueden ser number/string, normalizamos
      const sameRestaurant = String(sub.restaurant_id) === String(restaurant.id);

      // Ajusta aquí si tu backend usa otros estados (trialing/paid/etc.)
      const isActive = sub.status === 'active';

      return sameRestaurant && isActive;
    });

    // Si no hay suscripción activa, no hay analytics
    if (!currentSubscription) return false;

    // Si tu modelo usa otro campo (ej. plan, tier), aquí es donde se corrige:
    return currentSubscription.plan_type !== 'free';
  }, [user?.role, restaurant?.id, subscriptions]);

  // 5) Tabs memoizadas (evita recrearlas cada render)
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
                        ${isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                      `}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.name}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Debug opcional (quítalo cuando ya funcione)
            <div className="mt-4 text-xs text-gray-500">
              analyticsAccess: {String(hasAnalyticsAccess)}
            </div>
            */}
          </div>
        </nav>
      </aside>
    </>
  );
};
