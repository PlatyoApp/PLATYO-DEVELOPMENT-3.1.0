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
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
      <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
        {/* Si ya tienes un icono importado (ej. AlertTriangle), úsalo aquí */}
        <span className="text-red-600 text-2xl font-bold">!</span>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Suscripción vencida</h2>
      <p className="text-gray-600 mb-5 leading-relaxed">
        {restaurantName ? (
          <>
            El restaurante <strong className="text-gray-900">{restaurantName}</strong> tiene la suscripción vencida o
            inactiva.
          </>
        ) : (
          <>Este restaurante tiene la suscripción vencida o inactiva.</>
        )}
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-left">
        <p className="text-sm text-gray-700">
          Para volver a activar el menú público, por favor contacta con soporte y solicita la renovación.
        </p>
      </div>

      <a
        href="https://www.platyo.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-full rounded-xl bg-blue-600 text-white font-medium py-3 hover:bg-blue-700 transition-colors"
      >
        Ir a platyo.com
      </a>

      <p className="text-xs text-gray-400 mt-4">
        Si crees que esto es un error, intenta nuevamente en unos minutos.
      </p>
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
