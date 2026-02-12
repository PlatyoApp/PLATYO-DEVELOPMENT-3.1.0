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

/**
 * Caché en memoria (por sesión de SPA)
 * - Evita reconsultar suscripción en cada montaje del Sidebar
 */
type SubCacheEntry = { ts: number; sub: Subscription | null };
const subscriptionCache = new Map<string, SubCacheEntry>();

// Ajusta TTL si quieres (ej. 5 min)
const SUB_CACHE_TTL_MS = 5 * 60 * 1000;

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpen,
  onClose
}) => {
  const { user, restaurant } = useAuth();
  const { t } = useLanguage();

  const restaurantId = restaurant?.id ? String(restaurant.id) : null;

  // Un solo estado para carga (evita 2 setState por ciclo)
  const [subState, setSubState] = useState<{
    status: 'idle' | 'loading' | 'ready' | 'error';
    sub: Subscription | null;
  }>({ status: 'idle', sub: null });

  useEffect(() => {
    let alive = true;

    const loadSubscription = async () => {
      // Superadmin: no necesitas consultar nada
      if (user?.role === 'superadmin') {
        if (!alive) return;
        setSubState({ status: 'ready', sub: {} as any });
        return;
      }

      if (!restaurantId) {
        if (!alive) return;
        setSubState({ status: 'idle', sub: null });
        return;
      }

      // 1) Intenta caché en memoria
      const cached = subscriptionCache.get(restaurantId);
      const now = Date.now();
      if (cached && now - cached.ts < SUB_CACHE_TTL_MS) {
        if (!alive) return;
        setSubState({ status: 'ready', sub: cached.sub });
        return;
      }

      // 2) (Opcional) cache en sessionStorage para recargas suaves
      try {
        const key = `sub-cache:${restaurantId}`;
        const raw = sessionStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as SubCacheEntry;
          if (parsed?.ts && now - parsed.ts < SUB_CACHE_TTL_MS) {
            subscriptionCache.set(restaurantId, parsed);
            if (!alive) return;
            setSubState({ status: 'ready', sub: parsed.sub });
            return;
          }
        }
      } catch {
        // ignorar errores de storage
      }

      // 3) Si no hay cache, consulta
      if (!alive) return;
      setSubState((s) => ({ ...s, status: 'loading' }));

      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('id, restaurant_id, status, plan_name, created_at')
          .eq('restaurant_id', restaurantId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!alive) return;

        if (error) {
          console.error('[Sidebar] Subscription query error:', error);
          setSubState({ status: 'error', sub: null });
          return;
        }

        const sub = (data ?? null) as Subscription | null;

        // Guardar cache
        const entry: SubCacheEntry = { ts: now, sub };
        subscriptionCache.set(restaurantId, entry);
        try {
          sessionStorage.setItem(`sub-cache:${restaurantId}`, JSON.stringify(entry));
        } catch {
          // ignore
        }

        setSubState({ status: 'ready', sub });
      } catch (e) {
        console.error('[Sidebar] Subscription query exception:', e);
        if (!alive) return;
        setSubState({ status: 'error', sub: null });
      }
    };

    loadSubscription();
    return () => {
      alive = false;
    };
  }, [user?.role, restaurantId]);

  /**
   * Mantienes tu comportamiento:
   * - Mientras carga: permitir (para que la pestaña aparezca rápido)
   * - Luego: depende del plan
   */
  const hasAnalyticsAccess = useMemo(() => {
    if (user?.role === 'superadmin') return true;

    if (subState.status === 'loading' || subState.status === 'idle') return true;

    if (!subState.sub) return false;

    const planName = String((subState.sub as any).plan_name ?? '').trim().toLowerCase();
    return planName !== 'free';
  }, [user?.role, subState.status, subState.sub]);

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
          </div>
        </nav>
      </aside>
    </>
  );
};
