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

  // Cargar suscripción real desde Supabase (misma lógica que Dashboard)
  useEffect(() => {
    const loadSubscription = async () => {
      if (user?.role === 'superadmin') {
        setCurrentSubscription({} as any); // no importa, superadmin siempre tiene acceso
        return;
      }
      if (!restaurant?.id) {
        setCurrentSubscription(null);
        return;
      }

      setLoadingSubscription(true);
      try {
        const res = await supabase
          .from('subscriptions')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .eq('status', 'active')
          .maybeSingle();

        if (res.error) {
          console.error('[Sidebar] Error loading subscription:', res.error);
          setCurrentSubscription(null);
        } else {
          setCurrentSubscription(res.data ?? null);
        }
      } finally {
        setLoadingSubscription(false);
      }
    };

    loadSubscription();
  }, [user?.role, restaurant?.id]);

  // Decide acceso a analytics con la suscripción REAL
  const hasAnalyticsAccess = useMemo(() => {
    if (user?.role === 'superadmin') return true;
    if (!currentSubscription) return false;

    // IMPORTANTE: en tu Dashboard el plan se basa en plan_name
    const planName = String((currentSubscription as any).plan_name ?? '').trim().toLowerCase();

    // Si tu plan free se llama exactamente "free", esto basta.
    // Si tu plan gratis se llama "gratuito" o "demo", añade aquí.
    if (!planName) return false;
    return planName !== 'free';
  }, [user?.role, currentSubscription]);

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

    // Si quieres, puedes mostrarla incluso mientras carga, deshabilitada:
    // aquí la añadimos solo cuando está permitido.
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

            {/* Debug temporal (quita luego) */}
            {/* 
            <div className="mt-4 text-xs text-gray-500">
              subLoading: {String(loadingSubscription)} | hasAnalytics: {String(hasAnalyticsAccess)} | plan: {String((currentSubscription as any)?.plan_name ?? 'none')}
            </div>
            */}
          </div>
        </nav>
      </aside>
    </>
  );
};
