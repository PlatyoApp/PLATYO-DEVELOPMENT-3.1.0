import React, { useEffect, useState, useCallback } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
  useLocation,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './hooks/useToast';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { PublicMenu } from './pages/public/PublicMenu';
import { LandingPage } from './pages/LandingPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { SupabaseHealthMonitor } from './components/ui/SupabaseHealthMonitor';
import { supabase } from './lib/supabase';

const FullPageLoader: React.FC<{ text?: string }> = ({ text = 'Cargando...' }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">{text}</p>
    </div>
  </div>
);

const SubscriptionExpiredScreen: React.FC<{ restaurantName?: string }> = ({ restaurantName }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Suscripción vencida</h2>
      <p className="text-gray-600 mb-2">
        {restaurantName ? (
          <>
            El restaurante <strong>{restaurantName}</strong> tiene la suscripción vencida o inactiva.
          </>
        ) : (
          <>Este restaurante tiene la suscripción vencida o inactiva</>
        )}
      </p>
      <>
      <p className="text-gray-600">Por favor contacta con soporte para renovarla.</p>
      </>
      <p className="text-gray-600">www.platyo.com</p>
    </div>
  </div>
);

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <FullPageLoader text="Cargando..." />;

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

/**
 * Guard para el menú público:
 * - Busca el restaurante por restaurants.slug
 * - Busca la suscripción más reciente por restaurant_id
 * - Si status === 'expired' => bloquea menú
 */
const PublicMenuGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [restaurantName, setRestaurantName] = useState<string>('');

  const validate = useCallback(async () => {
    if (!slug) {
      setAllowed(true);
      return;
    }

    setLoading(true);
    setAllowed(false);
    setRestaurantName('');

    try {
      // 1) Restaurante por slug
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id,name,slug')
        .eq('slug', slug)
        .maybeSingle();

      if (restaurantError) throw restaurantError;

      // Si no existe restaurante, dejamos que PublicMenu maneje el "no encontrado"
      if (!restaurant?.id) {
        setAllowed(true);
        return;
      }

      setRestaurantName(restaurant.name || '');

      // 2) Suscripción más reciente
      const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .select('status,created_at')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) throw subError;

      // Reglas:
      // - Si hay sub y está expired => NO permitir
      // - Si hay sub y está active => permitir
      // - Si NO hay sub => permitir (puedes cambiar a false si deseas bloquear por defecto)
      if (!sub) {
        setAllowed(true);
        return;
      }

      setAllowed(sub.status === 'active');
    } catch (err) {
      console.error('[PublicMenuGuard] Error validando suscripción:', err);
      // Fail-open para no tumbar menús por errores temporales
      setAllowed(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    validate();
    // location.key para que revalide cuando navegues entre slugs
  }, [validate, location.key]);

  if (loading) return <FullPageLoader text="Cargando menú..." />;
  if (!allowed) return <SubscriptionExpiredScreen restaurantName={restaurantName} />;

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route
        path="/login"
        element={
          loading ? (
            <FullPageLoader text="Cargando aplicación..." />
          ) : isAuthenticated ? (
            <Navigate to="/dashboard" />
          ) : (
            <AuthPage />
          )
        }
      />

      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/dashboard"
        element={
          loading ? (
            <FullPageLoader text="Cargando aplicación..." />
          ) : (
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          )
        }
      />

      {/* Menú público protegido por suscripción */}
      <Route
        path="/menu/:slug"
        element={
          <CartProvider>
            <PublicMenuGuard>
              <PublicMenu />
            </PublicMenuGuard>
          </CartProvider>
        }
      />

      <Route
        path="/:slug"
        element={
          <CartProvider>
            <PublicMenuGuard>
              <PublicMenu />
            </PublicMenuGuard>
          </CartProvider>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <SupabaseHealthMonitor />
            <AppRoutes />
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
