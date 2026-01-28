import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AuthContextType, User, Restaurant, RegisterData } from '../types';
import { supabase } from '../lib/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const loadingUserRef = useRef(false);
  const initializedRef = useRef(false);
  const authListenerRef = useRef<any>(null);
  const hasDataRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      console.log('[AuthContext] Already initialized, skipping...');
      return;
    }

    console.log('[AuthContext] Initializing auth context...');
    initializedRef.current = true;

    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AuthContext] Error getting session:', error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('[AuthContext] Initial session found for:', session.user.email);
          await loadUserData(session.user.id);
        } else {
          console.log('[AuthContext] No initial session found');
          setLoading(false);
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    if (!authListenerRef.current) {
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('[AuthContext] Auth state changed:', event);

        (async () => {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('[AuthContext] User signed in, loading data...');
            if (!loadingUserRef.current) {
              await loadUserData(session.user.id);
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('[AuthContext] User signed out');
            setUser(null);
            setRestaurant(null);
            setIsAuthenticated(false);
            setLoading(false);
            loadingUserRef.current = false;
            hasDataRef.current = false;
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('[AuthContext] Token refreshed, keeping current state');
          } else if (event === 'USER_UPDATED') {
            console.log('[AuthContext] User updated, keeping current state');
          }
        })();
      });

      authListenerRef.current = authListener;
    }

    return () => {
      console.log('[AuthContext] Cleanup called but keeping listener active');
    };
  }, []);


  const loadUserData = async (userId: string, retryCount = 0) => {
    if (loadingUserRef.current) {
      console.log('[AuthContext] loadUserData already in progress, skipping...');
      return;
    }

    try {
      console.log('[AuthContext] Loading user data for:', userId);
      loadingUserRef.current = true;

      if (!hasDataRef.current) {
        setLoading(true);
      }

      console.log('[AuthContext] Querying users table...');
      const startTime = Date.now();

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name, role, restaurant_id, require_password_change, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      const duration = Date.now() - startTime;
      console.log(`[AuthContext] Query completed in ${duration}ms`);

      if (userError) {
        console.error('[AuthContext] Error loading user data:', userError);

        if (retryCount < 2) {
          console.log('[AuthContext] Retrying... attempt', retryCount + 1);
          loadingUserRef.current = false;
          await new Promise(resolve => setTimeout(resolve, 500));
          return loadUserData(userId, retryCount + 1);
        }

        console.error('[AuthContext] Max retries reached, signing out');
        await supabase.auth.signOut();
        setUser(null);
        setRestaurant(null);
        setIsAuthenticated(false);
        setLoading(false);
        loadingUserRef.current = false;
        hasDataRef.current = false;
        return;
      }

      if (!userData) {
        console.error('[AuthContext] No user data found for userId:', userId);
        await supabase.auth.signOut();
        setUser(null);
        setRestaurant(null);
        setIsAuthenticated(false);
        setLoading(false);
        loadingUserRef.current = false;
        hasDataRef.current = false;
        return;
      }

      console.log('[AuthContext] User data loaded successfully:', userData.email, 'Role:', userData.role);
      setUser(userData as User);
      setIsAuthenticated(true);
      setRequirePasswordChange(userData.require_password_change || false);

      if (userData.role === 'restaurant_owner' && userData.restaurant_id) {
        console.log('[AuthContext] Loading restaurant data for:', userData.restaurant_id);

        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id, name, slug, domain, email, phone, address, logo_url, owner_name, owner_id, is_active, settings, created_at, updated_at, elevenlabs_agent_id')
          .eq('id', userData.restaurant_id)
          .maybeSingle();

        if (restaurantError) {
          console.error('[AuthContext] Error loading restaurant:', restaurantError);
        } else if (restaurantData) {
          console.log('[AuthContext] Restaurant data loaded:', restaurantData.name);
          setRestaurant(restaurantData as Restaurant);
        } else {
          console.warn('[AuthContext] No restaurant data found');
        }
      }

      if (userData.role === 'superadmin') {
        console.log('[AuthContext] User is superadmin, no restaurant needed');
        setRestaurant(null);
      }

      console.log('[AuthContext] Auth context fully loaded');
      hasDataRef.current = true;
      setLoading(false);
      loadingUserRef.current = false;
    } catch (error) {
      console.error('[AuthContext] Unexpected error loading user data:', error);

      if (retryCount < 2) {
        console.log('[AuthContext] Retrying after unexpected error... attempt', retryCount + 1);
        loadingUserRef.current = false;
        await new Promise(resolve => setTimeout(resolve, 500));
        return loadUserData(userId, retryCount + 1);
      }

      console.error('[AuthContext] Max retries reached after unexpected error, signing out');
      await supabase.auth.signOut();
      setUser(null);
      setRestaurant(null);
      setIsAuthenticated(false);
      setLoading(false);
      loadingUserRef.current = false;
      hasDataRef.current = false;
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        return { success: true };
      }

      return { success: false, error: 'Error al iniciar sesión' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Error al iniciar sesión' };
    }
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) return { success: false, error: 'Usuario no autenticado' };

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ require_password_change: false })
        .eq('id', user.id);

      if (userUpdateError) throw userUpdateError;

      setRequirePasswordChange(false);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error: any) {
      console.error('Change password error:', error);

      if (error.message?.includes('weak') || error.message?.includes('easy to guess')) {
        return { success: false, error: 'La contraseña es muy débil o común. Debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y no ser una contraseña común (como "password123", "12345678", etc.)' };
      }

      return { success: false, error: error.message || 'Error al cambiar la contraseña' };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const baseSlug = data.restaurantName.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .trim();

      const { data: existingSlugs } = await supabase
        .from('restaurants')
        .select('slug')
        .like('slug', `${baseSlug}%`);

      let uniqueSlug = baseSlug;
      let counter = 1;
      while (existingSlugs?.some(r => r.slug === uniqueSlug)) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        if (authError.message?.includes('weak') || authError.message?.includes('easy to guess')) {
          throw new Error('La contraseña es débil. Debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números.');
        }
        throw authError;
      }
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      const restaurantData = {
        name: data.restaurantName,
        slug: uniqueSlug,
        email: data.email,
        phone: data.phone,
        address: data.address,
        owner_name: data.ownerName,
        owner_id: authData.user.id,
        settings: {
          currency: 'USD',
          language: 'es',
          timezone: 'America/Bogota',
          ui_settings: {
            layout_type: 'list',
            show_search_bar: true,
            info_message: 'Agrega los productos que desees al carrito, al finalizar tu pedido lo recibiremos por WhatsApp',
          },
          theme: {
            primary_color: '#dc2626',
            secondary_color: '#f3f4f6',
            accent_color: '#16a34a',
            text_color: '#1f2937',
            primary_font: 'Monserrat',
            secondary_font: 'Poppins',
            font_sizes: {
              title: '32px',
              subtitle: '24px',
              normal: '16px',
              small: '14px',
            },
            font_weights: {
              light: 300,
              regular: 400,
              medium: 500,
              bold: 700,
            },
            button_style: 'rounded',
          },
          social_media: {
            facebook: '',
            instagram: '',
            whatsapp: data.phone || '',
          },
          business_hours: {
            monday: { open: '09:00', close: '22:00', is_open: true },
            tuesday: { open: '09:00', close: '22:00', is_open: true },
            wednesday: { open: '09:00', close: '22:00', is_open: true },
            thursday: { open: '09:00', close: '22:00', is_open: true },
            friday: { open: '09:00', close: '23:00', is_open: true },
            saturday: { open: '09:00', close: '23:00', is_open: true },
            sunday: { open: '10:00', close: '21:00', is_open: true },
          },
          delivery: {
            enabled: false,
            zones: [],
            min_order_amount: 0,
          },
          table_orders: {
            enabled: false,
            table_numbers: 0,
            qr_codes: false,
            auto_assign: false,
          },
          notifications: {
            email: data.email,
            whatsapp: data.phone,
            sound_enabled: true,
          },
        },
        domain: uniqueSlug,
      };

      const { data: restaurantResult, error: restaurantError } = await supabase
        .from('restaurants')
        .insert([restaurantData])
        .select()
        .single();

      if (restaurantError) throw restaurantError;

      const { error: userError } = await supabase
        .from('users')
        .update({
          role: 'restaurant_owner',
          restaurant_id: restaurantResult.id,
          full_name: data.ownerName,
        })
        .eq('id', authData.user.id);

      if (userError) throw userError;

      await supabase.auth.signOut();

      return { success: true };
    } catch (error: any) {
      console.error('Register error:', error);
      await supabase.auth.signOut();

      if (error.message?.includes('weak') || error.message?.includes('easy to guess')) {
        return { success: false, error: 'La contraseña es débil. Debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números.' };
      }

      if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
        return { success: false, error: 'Ya existe una cuenta con este correo electrónico.' };
      }

      return { success: false, error: error.message || 'Error al registrar. Por favor intenta nuevamente.' };
    }
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        if (error.message.includes('User not found')) {
          return { success: false, error: 'No se encontró una cuenta con ese email' };
        }
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message || 'Error al solicitar recuperación' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setRestaurant(null);
      setIsAuthenticated(false);
      hasDataRef.current = false;
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setRestaurant(null);
      setIsAuthenticated(false);
      hasDataRef.current = false;
      window.location.href = '/login';
    }
  };

  const refreshRestaurantData = async () => {
    if (!user?.restaurant_id) return;

    try {
      const { data: restaurantData, error } = await supabase
        .from('restaurants')
        .select('id, name, slug, domain, email, phone, address, logo_url, owner_name, owner_id, status, settings, created_at, updated_at, elevenlabs_agent_id')
        .eq('id', user.restaurant_id)
        .maybeSingle();

      if (!error && restaurantData) {
        setRestaurant(restaurantData as Restaurant);
      }
    } catch (error) {
      console.error('[AuthContext] Error refreshing restaurant data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    restaurant,
    isAuthenticated,
    login,
    register,
    logout,
    loading,
    requirePasswordChange,
    changePassword,
    requestPasswordReset,
    refreshRestaurantData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};