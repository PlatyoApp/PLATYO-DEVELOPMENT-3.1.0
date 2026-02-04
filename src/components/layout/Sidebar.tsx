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
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSubscription = async () => {
      // Superadmin: acceso total
      if (user?.role === 'superadmin') {
        if (!cancelled) {
          setCurrentSubscription({} as any);
          setSubscriptionLoaded(true);
        }
        return;
      }

      // Si aún no hay restaurant, no consultes
      if (!restaurant?.id) {
        if (!cancelled) {
          setCurrentSubscription(null);
          setSubscriptionLoaded(false);
        }
        return;
      }

      try {
        // Importante: marcamos como "cargando" cada vez que cambia el restaurante
        if (!cancelled) setSubscriptionLoaded(false);

        const { data, error } = await supabase
          .from('subscriptions')
          .select('id, restaurant_id, status, plan_name, created_at')
          .eq('restaurant_id', restaurant.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('[Sidebar] Subscription query error:', error);
        } else {
          console.log('[Sidebar] Subscription loaded:', data);
        }

        if (!cancelled) {
          setCurrentSubscription(data ?? null);
          setSubscriptionLoaded(true);
        }
      } catch (e) {
        console.error('[Sidebar] Subscription query exception:', e);
        if (!cancelled) {
          setCurrentSubscription(null);
          setSubscriptionLoaded(true);
        }
      }
    };

    loadSubscription();

    return () => {
      cancelled = true;
    };
  }, [user?.role, restaurant?.id]);

  const hasAnalyticsAccess = useMemo(() => {
    if (user?.role === 'superadmin') return true;

    // Mientras se está cargando la suscripción, permitir acceso
    // Se reevaluará cuando termine de cargar
    if (!subscriptionLoaded) return true;

    // Si ya cargó y no hay suscripción activa => no acceso
    if (!currentSubscription) return false;

    const planName = String((currentSubscription as any).plan_name ?? '').trim().toLowerCase();

    // Tu BD guarda FREE/Basic/Pro/Business. Normalizamos.
    // Regla: solo FREE no tiene analytics.
    return planName !== 'free';
  }, [user?.role, currentSubscription, subscriptionLoaded]);

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

    // Si quieres que aparezca INMEDIATO pero deshabilitada mientras carga,
    // dime y lo ajusto. Por ahora, la añadimos solo si hay acceso.
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

            {subscriptionLoaded && (
            <div className="mt-4 p-2 text-xs text-gray-500 bg-gray-100 rounded">
              Plan: {String((currentSubscription as any)?.plan_name ?? 'FREE')} | Analytics: {String(hasAnalyticsAccess)}
            </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
};
