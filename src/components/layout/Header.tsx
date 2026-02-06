import React from 'react';
import { LogOut, User, Settings, Store, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';

interface HeaderProps {
  onNavigateToSettings?: () => void;
  onToggleSidebar?: () => void;
  onNavigateToDashboard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigateToSettings,
  onToggleSidebar,
  onNavigateToDashboard,
}) => {
  const { user, restaurant, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-lg border-b border-slate-700">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Botón hamburguesa para móvil */}
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {user?.role === 'superadmin' && (
              <button
                onClick={onNavigateToDashboard}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-400 rounded-xl flex items-center justify-center shadow-lg">
                  <img
                    src="/PLATYO FAVICON BLANCO.svg"
                    alt="Platyo"
                    className="w-11 h-11 object-contain flex-shrink-0"
                  />
                </div>
                <div className="min-w-0 text-left">
                  <h1 className="text-lg font-bold text-white truncate">Platyo</h1>
                  <p className="text-xs text-slate-400 truncate">Panel de Administración</p>
                </div>
              </button>
            )}

            {user?.role !== 'superadmin' && (
              <button
                onClick={onNavigateToDashboard}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer min-w-0"
              >
                {restaurant?.logo_url ? (
                  // Contenedor fijo (no rompe el layout) + imagen "contain" (no recorta)
                  <div className="h-12 w-12 md:h-12 md:w-12 rounded-xl shadow-md bg-slate-800/40 border border-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img
                      src={restaurant.logo_url}
                      alt={restaurant.name}
                      className="h-11 w-11 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                    <Store className="h-7 w-7 text-white" />
                  </div>
                )}

                <h1 className="text-base md:text-xl font-semibold text-white truncate min-w-0">
                  {restaurant?.name}
                </h1>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
              <User className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-slate-200 truncate max-w-48">
                {user?.email}
              </span>
            </div>

            {user?.role === 'restaurant_owner' && (
              <Button
                variant="ghost"
                size="sm"
                icon={Settings}
                onClick={onNavigateToSettings}
                title={t('settings')}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              />
            )}

            <Button
              variant="ghost"
              size="sm"
              icon={LogOut}
              onClick={logout}
              title={t('logout')}
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
