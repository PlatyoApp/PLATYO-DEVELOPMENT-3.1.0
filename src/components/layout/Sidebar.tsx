import React, { useEffect, useMemo, useState } from 'react';
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
import { supabase } from '../../lib/supabase';
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

  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  useEffect(() => {
    let alive = true;

    const loadSubscription = async () => {
      if (user?.role === 'superadmin') {
        if (!alive) return;
        setCurrentSubscription({} as any);
        setLoadingSubscription(false);
        return;
      }

      if (!restaurant?.id) {
        if (!alive) return;
        setCurrentSubscription(null);
        setLoadingSubscription(false);
        return;
      }

      setLoadingSubscription(true);

      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('id, restaurant_id, status, plan_name, created_at')
          .eq('restaurant_id', restaurant.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!alive) return;

        if (error) {
          console.error('[Sidebar] Error loading subscription:', error);
          setCurrentSubscription(null);
        } else {
          setCurrentSubscription(data ?? null);
        }
      } finally {
        if (alive) setLoadingSubscription(false);
      }
    };

    loadSubscription();

    return () => {
      alive = false;
    };
  }, [user?.role, restaurant?.id]);

  const planNameNorm = useMemo(() => {
    // FREE / Basic / Pro / Business
    return String((currentSubscription as any)?.plan_name ?? '').trim().toLowerCase();
  }, [currentSubscription]);

  /**
   * Regla:
   * - superadmin: true
   * - mientras carga: true (para que la pestaña exista desde el inicio)
   * - cuando carga: depende de plan != free
   */
  const hasAnalyticsAccess = useMemo(() => {
    if (user?.role === 'superadmin') return true;

    // Este es el cambio clave:
    if (loadingSubscription) return true;

    if (!currentSubscription) return false;

    return planNameNorm !== 'free';
  }, [user?.role, loadingSubscription, currentSubscription, planNameNorm]);

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
    const base: Array<{ id: string; name: string; icon: any; disabled?: boolean }> = [
      { id: 'dashboard', name: t('dashboard'), icon: Home },
      { id: 'categories', name: t('categories'), icon: FolderOpen },
      { id: 'menu', name: t('menu'), icon: Menu },
      { id: 'orders', name: t('orders'), icon: ShoppingBag },
      { id: 'customers', name: t('customers'), icon: Users },
      { id: 'subscription', name: t('subscription'), icon: Crown },
      { id: 'settings', name: t('settings'), icon: Settings }
    ];

    if (hasAnalyticsAccess) {
      base.push({
        id: 'analytics',
        name: t('analytics'),
        icon: BarChart3,
        // Opcional: mientras carga, la mostramos deshabilitada para evitar entrar antes de tiempo
        disabled: loadingSubscription
      });
    }

    return base;
  }, [t, hasAnalyticsAccess, loadingSubscription]);

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
                const isActive = activeTab === tab.id;
                const isDisabled = Boolean((tab as any).disabled);

                return (
                  <li key={tab.id}>
                    <button
                      disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) return;
                        onTabChange(tab.id);
                        onClose();
                      }}
                      className={`
                        w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                        ${
                          isDisabled
                            ? 'opacity-50 cursor-not-allowed text-gray-500'
                            : isActive
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.name}
                      {tab.id === 'analytics' && loadingSubscription && (
                        <span className="ml-auto text-[10px] text-gray-500">...</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </aside>
    </>
  );
};
