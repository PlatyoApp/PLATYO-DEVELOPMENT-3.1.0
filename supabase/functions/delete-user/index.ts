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
    const { data: restaurants, error: restaurantsError } = await supabaseClient
      .from('restaurants')
      .select('id, name, domain, slug')
      .eq('owner_id', userId);

    if (restaurantsError) {
      console.error('Error checking restaurant ownership:', restaurantsError);
      return new Response(
        JSON.stringify({ error: 'Error al verificar la propiedad de restaurantes' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (restaurants && restaurants.length > 0) {
      console.log('Cannot delete: User is owner of restaurants:', restaurants);

      return new Response(
        JSON.stringify({
          error: `No se puede eliminar este usuario porque es propietario de ${restaurants.length} restaurante(s). Primero debes transferir la propiedad a otro usuario.`,
          cannotDelete: true,
          reason: 'owner',
          ownedRestaurants: restaurants.map(r => ({
            id: r.id,
            name: r.name,
            domain: r.domain || r.slug
          })),
          message: `Este usuario es propietario de ${restaurants.length} restaurante(s). Debes transferir la propiedad antes de eliminarlo.`
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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