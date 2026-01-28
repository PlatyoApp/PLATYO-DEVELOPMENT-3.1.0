import React, { useState, useEffect } from 'react';
import { Check, Star, Zap, Crown, Gift, Bot } from 'lucide-react';
import { Plan, Subscription, Restaurant } from '../../types';
import { availablePlans } from '../../data/mockData';
import { loadFromStorage, saveToStorage } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const SubscriptionPlans: React.FC = () => {
  const { restaurant, user } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    if (restaurant) {
      loadCurrentSubscription();
    }
  }, [restaurant]);

  const loadCurrentSubscription = () => {
    const subscriptions = loadFromStorage('subscriptions', []);
    const subscription = subscriptions.find((sub: Subscription) => 
      sub.restaurant_id === restaurant?.id && sub.status === 'active'
    );
    setCurrentSubscription(subscription || null);
  };

  const handleSelectPlan = async (planId: string) => {
    if (!restaurant || !user) return;

    setLoading(true);

    try {
      // Load current data directly from localStorage
      let subscriptions = [];
      let restaurants = [];
      
      try {
        const storedSubs = localStorage.getItem('subscriptions');
        const storedRests = localStorage.getItem('restaurants');
        subscriptions = storedSubs ? JSON.parse(storedSubs) : [];
        restaurants = storedRests ? JSON.parse(storedRests) : [];
      } catch (error) {
        console.error('Error loading data:', error);
        subscriptions = [];
        restaurants = [];
      }

      console.log('Before update:', { subscriptions, restaurants });

      // Deactivate current subscription
      subscriptions = subscriptions.map((sub: Subscription) =>
        sub.restaurant_id === restaurant.id
          ? { ...sub, status: 'cancelled' as const, updated_at: new Date().toISOString() }
          : sub
      );

      // Create new subscription
      const newSubscription: Subscription = {
        id: `sub-${Date.now()}`,
        restaurant_id: restaurant.id,
        plan_type: planId as any,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: planId === 'free' 
          ? '2099-12-31T23:59:59Z' 
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        auto_renew: planId !== 'free',
        created_at: new Date().toISOString(),
      };

      subscriptions.push(newSubscription);

      // Update restaurant status
      restaurants = restaurants.map((r: Restaurant) =>
        r.id === restaurant.id
          ? { ...r, status: 'active' as const, updated_at: new Date().toISOString() }
          : r
      );

      console.log('After update:', { subscriptions, restaurants });

      // Save changes directly to localStorage
      try {
        localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
        localStorage.setItem('restaurants', JSON.stringify(restaurants));
        console.log('Data saved successfully');
      } catch (error) {
        console.error('Error saving data:', error);
      }

      // Verify save directly
      try {
        const savedSubscriptions = localStorage.getItem('subscriptions');
        const savedRestaurants = localStorage.getItem('restaurants');
        console.log('Verified save:', { 
          savedSubscriptions: savedSubscriptions ? JSON.parse(savedSubscriptions) : null,
          savedRestaurants: savedRestaurants ? JSON.parse(savedRestaurants) : null
        });
      } catch (error) {
        console.error('Error verifying save:', error);
      }

      // Update auth context
      try {
        const currentAuthStr = localStorage.getItem('currentAuth');
        if (currentAuthStr) {
          const currentAuth = JSON.parse(currentAuthStr);
          currentAuth.restaurant = restaurants.find((r: Restaurant) => r.id === restaurant.id) || currentAuth.restaurant;
          localStorage.setItem('currentAuth', JSON.stringify(currentAuth));
          console.log('Updated auth context:', currentAuth);
        }
      } catch (error) {
        console.error('Error updating auth context:', error);
      }

      // Force reload of current subscription
      loadCurrentSubscription();
      
      const selectedPlan = availablePlans.find(p => p.id === planId);
      if (planId !== 'free') {
        showToast(
          'success',
          t('planActivated'),
          `Your ${selectedPlan?.name} plan has been activated successfully. You now have access to all included features.`,
          6000
        );
      } else {
        showToast(
          'info',
          'Free Plan Activated',
          'You have switched to the free plan. Some features may be limited.',
          5000
        );
      }

      // Force page reload immediately to ensure all components update
      window.location.reload();
    } catch (error) {
      console.error('Error updating subscription:', error);
      showToast(
        'error',
        'Error Changing Plan',
        'There was a problem changing your subscription plan. Please try again or contact support.',
        6000
      );
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return <Gift className="w-8 h-8" />;
      case 'basic':
        return <Zap className="w-8 h-8" />;
      case 'pro':
        return <Star className="w-8 h-8" />;
      case 'business':
        return <Crown className="w-8 h-8" />;
      default:
        return <Gift className="w-8 h-8" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free':
        return 'text-gray-600';
      case 'basic':
        return 'text-blue-600';
      case 'pro':
        return 'text-purple-600';
      case 'business':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getFeaturesList = (plan: any) => {
    const features = [];

    if (plan.features.max_products === -1) {
      features.push(`${t('unlimited')} productos`);
    } else {
      features.push(`Hasta ${plan.features.max_products} productos`);
    }

    if (plan.features.max_categories === -1) {
      features.push(`${t('unlimited')} categorías`);
    } else {
      features.push(`Hasta ${plan.features.max_categories} categorías`);
    }

    if (plan.features.analytics) features.push('Estadísticas avanzadas');
    if (plan.features.priority_support) features.push('Soporte prioritario');
    if (plan.features.advanced_customization) features.push('Personalización avanzada');
    if (plan.features.ai_assistant) features.push('Asistente IA');

    return features;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getDisplayPrice = (plan: any) => {
    return billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  };

  const getSavings = (plan: any) => {
    if (plan.monthlyPrice === 0) return 0;
    const yearlyMonthly = plan.monthlyPrice * 12;
    return yearlyMonthly - plan.annualPrice;
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan_type === planId;
  };

  const handleContactWhatsApp = (plan: any) => {
    const billingText = billingPeriod === 'monthly' ? 'mensual' : 'anual';
    const priceText = formatPrice(getDisplayPrice(plan));
    const restaurantName = restaurant?.name || 'Mi restaurante';

    const message = `Hola, estoy interesado en adquirir el plan *${plan.name}* con facturación *${billingText}* por ${priceText} para mi restaurante "${restaurantName}". ¿Podrían ayudarme con el proceso de activación?`;

    const whatsappUrl = `https://wa.me/573027099669?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('subscriptionPlans')}</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
          {t('choosePlan')}
        </p>

        {/* Billing Period Toggle */}
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              billingPeriod === 'annual'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Anual
            <span className="ml-2 text-xs text-green-600 font-semibold">Ahorra 15%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {availablePlans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
              plan.popular 
                ? 'border-purple-500 transform scale-105' 
                : isCurrentPlan(plan.id)
                ? 'border-green-500'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge variant="error" className="bg-purple-600 text-white px-4 py-1">
                  {t('mostPopular')}
                </Badge>
              </div>
            )}

            {/* Current Plan Badge */}
            {isCurrentPlan(plan.id) && (
              <div className="absolute -top-3 right-4">
                <Badge variant="success" className="px-3 py-1">
                  {t('currentPlan')}
                </Badge>
              </div>
            )}

            <div className="p-6">
              {/* Plan Header */}
              <div className="text-center mb-6">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 shadow-md mb-4 ${getPlanColor(plan.id)}`}
                >
                  {getPlanIcon(plan.id)}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  {plan.monthlyPrice === 0 ? (
                    <div>
                      <span className="text-3xl font-bold text-gray-900">Gratis</span>
                      <p className="text-sm text-gray-600 mt-1">1 mes</p>
                    </div>
                  ) : (
                    <div>
                      <div>
                        <span className="text-3xl font-bold text-gray-900">
                          {formatPrice(getDisplayPrice(plan))}
                        </span>
                        <span className="text-gray-600 ml-1">
                          {billingPeriod === 'monthly' ? '/mes' : '/año'}
                        </span>
                      </div>
                      {billingPeriod === 'annual' && (
                        <div className="mt-2">
                          <Badge variant="success" className="text-xs">
                            Ahorras {formatPrice(getSavings(plan))}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <ul className="space-y-3">
                  {getFeaturesList(plan).map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="mt-auto">
                {isCurrentPlan(plan.id) ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled
                  >
                    Plan Actual
                  </Button>
                ) : plan.id === 'free' ? (
                  <div className="text-center py-2">
                    <span className="text-sm text-gray-500">Plan gratuito por defecto</span>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleContactWhatsApp(plan)}
                    className={`w-full ${
                      plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                    variant="primary"
                  >
                    Contactar por WhatsApp
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-12 space-y-6">
        <div className="bg-blue-50 rounded-lg p-6 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            ¿Necesitas ayuda para elegir?
          </h3>
          <p className="text-blue-700 mb-4">
            Todos los planes incluyen actualizaciones gratuitas. Puedes cambiar o cancelar en cualquier momento.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-blue-600">
            <div>
              <strong>Free:</strong> Perfecto para comenzar y probar la plataforma
            </div>
            <div>
              <strong>Basic:</strong> Ideal para restaurantes pequeños
            </div>
            <div>
              <strong>Pro:</strong> Para restaurantes en crecimiento con múltiples productos
            </div>
            <div>
              <strong>Business:</strong> Para cadenas y franquicias con alto volumen
            </div>
          </div>
        </div>

        {billingPeriod === 'annual' && (
          <div className="bg-green-50 rounded-lg p-6 max-w-4xl mx-auto border-2 border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-2 flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Beneficio del Plan Anual
            </h3>
            <p className="text-green-700">
              Al elegir la facturación anual, obtienes un <strong>15% de descuento</strong> comparado con el pago mensual.
              Esto significa que pagas 10 meses y recibes hasta 2 meses adicionales gratis
            </p>
          </div>
        )}
      </div>
    </div>
  );
};