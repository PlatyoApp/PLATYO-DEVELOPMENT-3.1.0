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

/** ======= Caché + dedupe (módulo global) ======= */
type CacheEntry = { ts: number; sub: Subscription | null };
const subCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<Subscription | null>>();

const TTL_MS = 10 * 60 * 1000; // 10 min (ajusta)

function sessionKey(restaurantId: string) {
  return `sub-cache:v1:${restaurantId}`;
}

function readSession(restaurantId: string): CacheEntry | null {
  try {
    const raw = sessionStorage.getItem(sessionKey(restaurantId));
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

function writeSession(restaurantId: string, entry: CacheEntry) {
  try {
    sessionStorage.setItem(sessionKey(restaurantId), JSON.stringify(entry));
  } catch {
    // ignore
  }
}

async function fetchSubscriptionOnce(restaurantId: string): Promise<Subscription | null> {
  // dedupe: si ya hay una petición en vuelo, reutilízala
  const existing = inFlight.get(restaurantId);
  if (existing) return existing;

  const p = (async () => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, restaurant_id, status, plan_name, created_at')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // importante: no spamear logs; deja solo error real
      console.error('[Sidebar] Subscription query error:', error);
      return null;
    }
    return (data ?? null) as Subscription | null;
  })();

  inFlight.set(restaurantId, p);

  try {
    return await p;
  } finally {
    inFlight.delete(restaurantId);
  }
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpen,
  onClose
}) => {
  const { user, restaurant } = useAuth();
  const { t } = useLanguage();

  const restaurantId = restaurant?.id ? String(restaurant.id) : null;

  // Estado mínimo: sub + loading (sin “loaded” extra)
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loadingSub, setLoadingSub] = useState(false);

  // 1) Render instantáneo: NO dependemos de sub para construir tabs (si quieres)
  //    Si quieres condicionar analytics, puedes hacerlo, pero tú ya viste que genera “lag”.
  //    Aquí lo dejamos siempre visible para no bloquear UX.
  const hasAnalyticsTab = true;

  // 2) Cargar suscripción en background + cacheada
  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (user?.role === 'superadmin') {
        // superadmin: no necesita fetch
        if (!alive) return;
        setSub({} as any);
        setLoadingSub(false);
        return;
      }

      if (!restaurantId) {
        if (!alive) return;
        setSub(null);
        setLoadingSub(false);
        return;
      }

      const now = Date.now();

      // a) memoria
      const mem = subCache.get(restaurantId);
      if (mem && now - mem.ts < TTL_MS) {
        if (!alive) return;
        setSub(mem.sub);
        setLoadingSub(false);
        return;
      }

      // b) sessionStorage
      const sess = readSession(restaurantId);
      if (sess && now - sess.ts < TTL_MS) {
        subCache.set(restaurantId, sess);
        if (!alive) return;
        setSub(sess.sub);
        setLoadingSub(false);
        return;
      }

      // c) fetch
      if (!alive) return;
      setLoadingSub(true);

      const fresh = await fetchSubscriptionOnce(restaurantId);

      if (!alive) return;

      const entry: CacheEntry = { ts: now, sub: fresh };
      subCache.set(restaurantId, entry);
      writeSession(restaurantId, entry);

      setSub(fresh);
      setLoadingSub(false);
    };

    load();
    return () => {
      alive = false;
    };
  }, [user?.role, restaurantId]);

  // Tabs memoizados (barato, pero ok)
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

    if (hasAnalyticsTab) {
      base.push({ id: 'analytics', name: t('analytics'), icon: BarChart3 });
    }

    return base;
  }, [t, hasAnalyticsTab]);

  const tabs = user?.role === 'superadmin' ? superAdminTabs : restaurantTabs;

  // Texto “Plan: …” rápido (no bloquea)
  const planLabel = useMemo(() => {
    if (user?.role === 'superadmin') return 'SUPERADMIN';
    if (loadingSub) return t('loading') || 'Cargando…';
    const planName = String((sub as any)?.plan_name ?? '').trim();
    return planName || 'FREE';
  }, [user?.role, loadingSub, sub, t]);

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
        <nav className="mt-6">
          <div className="px-4">
            {/* Indicador visual (no bloquea) */}
            <div className="mb-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{t('statusSubscription') ?? 'Suscripción'}</span>
                <span className="font-semibold">
                  {planLabel}
                </span>
              </div>

              {/* “Skeleton” simple */}
              {loadingSub && (
                <div className="mt-2 h-2 w-full rounded bg-gray-100 overflow-hidden">
                  <div className="h-2 w-1/2 bg-gray-200 animate-pulse rounded" />
                </div>
              )}
            </div>

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
          </div>
        </nav>
      </aside>
    </>
  );
};
