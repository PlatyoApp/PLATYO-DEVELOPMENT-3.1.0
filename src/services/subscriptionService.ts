import { supabase } from '../lib/supabase';
import { Product } from '../types';

export interface PlanChangeResult {
  success: boolean;
  isDowngrade: boolean;
  archivedProducts: Product[];
  message: string;
  error?: string;
}

export interface ArchivedProductsInfo {
  products: Product[];
  count: number;
  canActivateCount: number;
}

export const subscriptionService = {
  async getArchivedProducts(restaurantId: string): Promise<ArchivedProductsInfo> {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'archived')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (
            max_products
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('status', 'active')
        .maybeSingle();

      const { count: activeCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('status', 'active');

      const maxProducts = subscription?.subscription_plans?.max_products || subscription?.max_products || 0;
      const currentActive = activeCount || 0;
      const availableSlots = Math.max(0, maxProducts - currentActive);

      return {
        products: products || [],
        count: products?.length || 0,
        canActivateCount: availableSlots,
      };
    } catch (error) {
      console.error('Error fetching archived products:', error);
      return {
        products: [],
        count: 0,
        canActivateCount: 0,
      };
    }
  },

  async activateProduct(productId: string, restaurantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { count: activeCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('status', 'active');

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (
            max_products
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('status', 'active')
        .maybeSingle();

      const maxProducts = subscription?.subscription_plans?.max_products || subscription?.max_products || 0;
      const currentActive = activeCount || 0;

      if (currentActive >= maxProducts) {
        return {
          success: false,
          error: `Product limit reached (${currentActive}/${maxProducts}). Archive another product first or upgrade your plan.`,
        };
      }

      const { error } = await supabase
        .from('products')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', productId)
        .eq('restaurant_id', restaurantId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error activating product:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to activate product',
      };
    }
  },

  async archiveProduct(productId: string, restaurantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', productId)
        .eq('restaurant_id', restaurantId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error archiving product:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to archive product',
      };
    }
  },

  async swapProductActivation(
    productToActivateId: string,
    productToArchiveId: string,
    restaurantId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error: archiveError } = await supabase
        .from('products')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', productToArchiveId)
        .eq('restaurant_id', restaurantId);

      if (archiveError) throw archiveError;

      const { error: activateError } = await supabase
        .from('products')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', productToActivateId)
        .eq('restaurant_id', restaurantId);

      if (activateError) throw activateError;

      return { success: true };
    } catch (error) {
      console.error('Error swapping product activation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to swap product activation',
      };
    }
  },

  async checkPlanLimits(restaurantId: string): Promise<{
    products: { current: number; max: number; exceeded: boolean };
    categories: { current: number; max: number; exceeded: boolean };
  }> {
    try {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (
            max_products,
            max_categories
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('status', 'active')
        .maybeSingle();

      const maxProducts = subscription?.subscription_plans?.max_products || subscription?.max_products || 0;
      const maxCategories = subscription?.subscription_plans?.max_categories || 10;

      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('status', 'active');

      const { count: categoryCount } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true);

      const currentProducts = productCount || 0;
      const currentCategories = categoryCount || 0;

      return {
        products: {
          current: currentProducts,
          max: maxProducts,
          exceeded: currentProducts > maxProducts,
        },
        categories: {
          current: currentCategories,
          max: maxCategories,
          exceeded: currentCategories > maxCategories,
        },
      };
    } catch (error) {
      console.error('Error checking plan limits:', error);
      return {
        products: { current: 0, max: 0, exceeded: false },
        categories: { current: 0, max: 0, exceeded: false },
      };
    }
  },
};
