import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { SubscriptionLimits, SubscriptionStatus, LimitCheckResult } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface UseSubscriptionLimitsReturn {
  limits: SubscriptionLimits | null;
  status: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
  checkProductLimit: () => Promise<LimitCheckResult>;
  checkCategoryLimit: () => Promise<LimitCheckResult>;
  canActivateProduct: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useSubscriptionLimits(restaurantId: string | undefined): UseSubscriptionLimitsReturn {
  const { subscription: contextSubscription } = useAuth();
  const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionData = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      let subscription = contextSubscription;

      if (subscription && subscription.restaurant_id === restaurantId) {
        const endDate = new Date(subscription.end_date);
        const now = new Date();
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isExpired = subscription.status !== 'active' || endDate < now;
        const isActive = subscription.status === 'active' && endDate >= now;

        setStatus({
          isExpired,
          isActive,
          daysRemaining: Math.max(0, daysRemaining),
          planName: subscription.plan_name,
          endDate: subscription.end_date,
        });
      }

      setLoading(true);

      if (!subscription || subscription.restaurant_id !== restaurantId) {
        const { data: fetchedSubscription, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subError) throw subError;

        if (!fetchedSubscription) {
          setError('No subscription found');
          setStatus({
            isExpired: true,
            isActive: false,
            daysRemaining: 0,
            planName: 'None',
            endDate: new Date().toISOString(),
          });
          setLimits({
            max_products: 0,
            max_categories: 0,
            current_products: 0,
            current_categories: 0,
            canCreateProduct: false,
            canCreateCategory: false,
          });
          setLoading(false);
          return;
        }

        subscription = fetchedSubscription;
      }

      const endDate = new Date(subscription.end_date);
      const now = new Date();
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = subscription.status !== 'active' || endDate < now;
      const isActive = subscription.status === 'active' && endDate >= now;

      const { count: productCount, error: productError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('status', 'active');

      if (productError) throw productError;

      const { count: categoryCount, error: categoryError } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true);

      if (categoryError) throw categoryError;

      const maxProducts = subscription.max_products || 0;

      const planName = subscription.plan_name.toLowerCase();
      let maxCategories = 10;
      if (planName === 'free') maxCategories = 5;
      else if (planName === 'basic') maxCategories = 15;
      else if (planName === 'pro') maxCategories = 25;
      else if (planName === 'business') maxCategories = 50;

      const currentProducts = productCount || 0;
      const currentCategories = categoryCount || 0;

      setLimits({
        max_products: maxProducts,
        max_categories: maxCategories,
        current_products: currentProducts,
        current_categories: currentCategories,
        canCreateProduct: isActive && currentProducts < maxProducts,
        canCreateCategory: isActive && currentCategories < maxCategories,
      });

      setStatus({
        isExpired,
        isActive,
        daysRemaining: Math.max(0, daysRemaining),
        planName: subscription.plan_name,
        endDate: subscription.end_date,
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription data');
      setLoading(false);
    }
  }, [restaurantId, contextSubscription]);

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const checkProductLimit = useCallback(async (): Promise<LimitCheckResult> => {
    if (!limits) {
      return {
        canCreate: false,
        canActivate: false,
        currentCount: 0,
        maxCount: 0,
        message: 'Subscription data not loaded',
      };
    }

    const canCreate = limits.current_products < limits.max_products;

    return {
      canCreate,
      canActivate: canCreate,
      currentCount: limits.current_products,
      maxCount: limits.max_products,
      message: canCreate
        ? `You can create ${limits.max_products - limits.current_products} more product(s)`
        : `Product limit reached (${limits.current_products}/${limits.max_products}). Upgrade your plan to add more products.`,
    };
  }, [limits]);

  const checkCategoryLimit = useCallback(async (): Promise<LimitCheckResult> => {
    if (!limits) {
      return {
        canCreate: false,
        canActivate: false,
        currentCount: 0,
        maxCount: 0,
        message: 'Subscription data not loaded',
      };
    }

    const canCreate = limits.current_categories < limits.max_categories;

    return {
      canCreate,
      canActivate: canCreate,
      currentCount: limits.current_categories,
      maxCount: limits.max_categories,
      message: canCreate
        ? `You can create ${limits.max_categories - limits.current_categories} more category/categories`
        : `Category limit reached (${limits.current_categories}/${limits.max_categories}). Upgrade your plan to add more categories.`,
    };
  }, [limits]);

  const canActivateProduct = useCallback(async (): Promise<boolean> => {
    if (!limits) return false;
    return limits.current_products < limits.max_products;
  }, [limits]);

  const refresh = useCallback(async () => {
    await fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  return {
    limits,
    status,
    loading,
    error,
    checkProductLimit,
    checkCategoryLimit,
    canActivateProduct,
    refresh,
  };
}
