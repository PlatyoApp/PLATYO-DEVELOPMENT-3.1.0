import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'superadmin') {
      throw new Error('Only superadmins can delete restaurants');
    }

    const { restaurantId } = await req.json();

    if (!restaurantId) {
      throw new Error('Restaurant ID is required');
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('name')
      .eq('id', restaurantId)
      .single();

    if (restaurantError) {
      throw new Error('Restaurant not found');
    }

    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('restaurant_id', restaurantId);

    if (orders && orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      const { error: deleteOrderItemsError } = await supabase
        .from('order_items')
        .delete()
        .in('order_id', orderIds);

      if (deleteOrderItemsError) {
        console.error('Error deleting order items:', deleteOrderItemsError);
      }
    }

    const { error: deleteOrdersError } = await supabase
      .from('orders')
      .delete()
      .eq('restaurant_id', restaurantId);

    if (deleteOrdersError) {
      console.error('Error deleting orders:', deleteOrdersError);
    }

    const { error: deleteCustomersError } = await supabase
      .from('customers')
      .delete()
      .eq('restaurant_id', restaurantId);

    if (deleteCustomersError) {
      console.error('Error deleting customers:', deleteCustomersError);
    }

    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('restaurant_id', restaurantId);

    if (products && products.length > 0) {
      const productIds = products.map(p => p.id);
      const { error: deleteProductCategoriesError } = await supabase
        .from('product_categories')
        .delete()
        .in('product_id', productIds);

      if (deleteProductCategoriesError) {
        console.error('Error deleting product categories:', deleteProductCategoriesError);
      }
    }

    const { error: deleteProductsError } = await supabase
      .from('products')
      .delete()
      .eq('restaurant_id', restaurantId);

    if (deleteProductsError) {
      console.error('Error deleting products:', deleteProductsError);
    }

    const { error: deleteCategoriesError } = await supabase
      .from('categories')
      .delete()
      .eq('restaurant_id', restaurantId);

    if (deleteCategoriesError) {
      console.error('Error deleting categories:', deleteCategoriesError);
    }

    const { error: deleteSubscriptionsError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('restaurant_id', restaurantId);

    if (deleteSubscriptionsError) {
      console.error('Error deleting subscriptions:', deleteSubscriptionsError);
    }

    const { data: usersToDelete } = await supabase
      .from('users')
      .select('id')
      .eq('restaurant_id', restaurantId);

    if (usersToDelete && usersToDelete.length > 0) {
      for (const userToDelete of usersToDelete) {
        const { error: deleteAuthUserError } = await supabase.auth.admin.deleteUser(
          userToDelete.id
        );
        if (deleteAuthUserError) {
          console.error('Error deleting auth user:', deleteAuthUserError);
        }
      }

      const { error: deleteUsersError } = await supabase
        .from('users')
        .delete()
        .eq('restaurant_id', restaurantId);

      if (deleteUsersError) {
        console.error('Error deleting users:', deleteUsersError);
      }
    }

    const { error: deleteRestaurantError } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', restaurantId);

    if (deleteRestaurantError) {
      throw new Error(`Error deleting restaurant: ${deleteRestaurantError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Restaurant "${restaurant.name}" deleted successfully`,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in delete-restaurant function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});