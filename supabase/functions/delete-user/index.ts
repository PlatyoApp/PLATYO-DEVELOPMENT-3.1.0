import { createClient } from 'npm:@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface DeleteUserRequest {
  userId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: userData, error: userDataError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (userDataError || userData?.role !== 'superadmin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Only superadmin can delete users.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body: DeleteUserRequest = await req.json();
    const { userId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: userId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Checking if user is owner of any restaurants:', userId);
    const { data: restaurants } = await supabaseClient
      .from('restaurants')
      .select('id, name')
      .eq('owner_id', userId);

    const restaurantIds = restaurants?.map(r => r.id) || [];

    if (restaurantIds.length > 0) {
      console.log('User is owner of restaurants:', restaurantIds);

      const { data: otherUsers, error: usersError } = await supabaseClient
        .from('users')
        .select('id, full_name, email, role')
        .in('restaurant_id', restaurantIds)
        .neq('id', userId);

      if (usersError) {
        console.error('Error checking other users:', usersError);
        return new Response(
          JSON.stringify({ error: 'Error al verificar usuarios del restaurante' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (otherUsers && otherUsers.length > 0) {
        console.log('Cannot delete: restaurant has other users:', otherUsers);

        const { data: restaurantStats } = await supabaseClient
          .from('restaurants')
          .select(`
            id,
            name,
            products:products(count),
            orders:orders(count),
            customers:customers(count)
          `)
          .in('id', restaurantIds);

        return new Response(
          JSON.stringify({
            error: 'No se puede eliminar este usuario porque es propietario de uno o más restaurantes con otros usuarios activos.',
            cannotDelete: true,
            details: {
              restaurants: restaurants,
              otherUsersCount: otherUsers.length,
              otherUsers: otherUsers.map(u => ({
                id: u.id,
                name: u.full_name,
                email: u.email,
                role: u.role
              })),
              restaurantData: restaurantStats?.map(r => ({
                id: r.id,
                name: r.name,
                productsCount: r.products?.[0]?.count || 0,
                ordersCount: r.orders?.[0]?.count || 0,
                customersCount: r.customers?.[0]?.count || 0
              }))
            },
            suggestion: 'Primero transfiere la propiedad del restaurante a otro usuario administrador, o elimina primero a los otros usuarios del restaurante.'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log('User is the only user of their restaurant(s). Proceeding with deletion.');
      console.log('Step 1: Deleting order_items for restaurants:', restaurantIds);
      const { data: orders } = await supabaseClient
        .from('orders')
        .select('id')
        .in('restaurant_id', restaurantIds);

      const orderIds = orders?.map(o => o.id) || [];
      if (orderIds.length > 0) {
        await supabaseClient.from('order_items').delete().in('order_id', orderIds);
      }

      console.log('Step 2: Deleting product_categories for restaurants');
      const { data: products } = await supabaseClient
        .from('products')
        .select('id')
        .in('restaurant_id', restaurantIds);

      const productIds = products?.map(p => p.id) || [];
      if (productIds.length > 0) {
        await supabaseClient.from('product_categories').delete().in('product_id', productIds);
      }

      console.log('Step 3: Deleting orders for restaurants');
      await supabaseClient.from('orders').delete().in('restaurant_id', restaurantIds);

      console.log('Step 4: Deleting products for restaurants');
      await supabaseClient.from('products').delete().in('restaurant_id', restaurantIds);

      console.log('Step 5: Deleting categories for restaurants');
      await supabaseClient.from('categories').delete().in('restaurant_id', restaurantIds);

      console.log('Step 6: Deleting customers for restaurants');
      await supabaseClient.from('customers').delete().in('restaurant_id', restaurantIds);

      console.log('Step 7: Deleting subscriptions for restaurants');
      await supabaseClient.from('subscriptions').delete().in('restaurant_id', restaurantIds);

      console.log('Step 8: Deleting support tickets for restaurants');
      await supabaseClient.from('support_tickets').delete().in('restaurant_id', restaurantIds);

      console.log('Step 9: Deleting restaurants');
      await supabaseClient.from('restaurants').delete().in('id', restaurantIds);
    }

    console.log('Step 10: Deleting support tickets for user (assigned or created)');
    await supabaseClient.from('support_tickets').delete().eq('user_id', userId);
    await supabaseClient.from('support_tickets').delete().eq('assigned_to', userId);

    console.log('Step 11: Deleting from users table');
    const { error: dbError } = await supabaseClient
      .from('users')
      .delete()
      .eq('id', userId);

    if (dbError) {
      console.error('Database deletion error:', dbError);
      return new Response(
        JSON.stringify({ error: `Error eliminando de la base de datos: ${dbError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Step 12: Deleting user from auth system');
    const { error: authError } = await supabaseClient.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Auth deletion error:', authError);
      return new Response(
        JSON.stringify({ error: `Error eliminando del sistema de autenticación: ${authError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('User deleted successfully from all locations');
    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in delete-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});