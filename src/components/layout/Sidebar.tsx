import React, { useState, useEffect } from 'react';
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

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen, onClose }) => {
  const { user, restaurant } = useAuth();
  const { t } = useLanguage();
  
  // Check if user has a paid subscription
  const hasAnalyticsAccess = () => {
    if (user?.role === 'superadmin') return true;
    
    if (!restaurant) return false;
    
    const subscriptions = loadFromStorage('subscriptions', []);
    const currentSubscription = subscriptions.find((sub: Subscription) => 
      sub.restaurant_id === restaurant.id && sub.status === 'active'
    );
    
    return currentSubscription && currentSubscription.plan_type !== 'free';
  };

  const superAdminTabs = [
    { id: 'dashboard', name: t('dashboard'), icon: Home },
    { id: 'restaurants', name: 'Restaurants', icon: Store },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'subscriptions', name: 'Subscriptions', icon: CreditCard },
    { id: 'support', name: 'Soporte', icon: HelpCircle },
    { id: 'analytics', name: t('analytics'), icon: BarChart3 },
  ];

  let restaurantTabs = [
    { id: 'dashboard', name: t('dashboard'), icon: Home },
    { id: 'categories', name: t('categories'), icon: FolderOpen },
    { id: 'menu', name: t('menu'), icon: Menu },
    { id: 'orders', name: t('orders'), icon: ShoppingBag },
    { id: 'customers', name: t('customers'), icon: Users },
    { id: 'subscription', name: t('subscription'), icon: Crown },
    { id: 'settings', name: t('settings'), icon: Settings },
  ];
  
  // Add analytics tab only if user has paid subscription
  if (hasAnalyticsAccess()) {
    restaurantTabs.push({ id: 'analytics', name: t('analytics'), icon: BarChart3 });
  }

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
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-gray-50 min-h-screen border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
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
                      ${activeTab === tab.id
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