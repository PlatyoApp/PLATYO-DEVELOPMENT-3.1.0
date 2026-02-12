import { createClient } from 'npm:@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface TransferOwnershipRequest {
  restaurantId: string;
  newOwnerId: string;
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
        JSON.stringify({ error: 'Unauthorized. Only superadmin can transfer ownership.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body: TransferOwnershipRequest = await req.json();
    const { restaurantId, newOwnerId } = body;

    if (!restaurantId || !newOwnerId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: restaurantId and newOwnerId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Getting restaurant details:', restaurantId);
    const { data: restaurant, error: restaurantError } = await supabaseClient
      .from('restaurants')
      .select('id, name, owner_id')
      .eq('id', restaurantId)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      return new Response(
        JSON.stringify({ error: 'Restaurant not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Verifying new owner:', newOwnerId);
    const { data: newOwner, error: newOwnerError } = await supabaseClient
      .from('users')
      .select('id, full_name, email, role, restaurant_id')
      .eq('id', newOwnerId)
      .maybeSingle();

    if (newOwnerError || !newOwner) {
      return new Response(
        JSON.stringify({ error: 'New owner user not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (newOwner.restaurant_id !== restaurantId) {
      return new Response(
        JSON.stringify({
          error: 'The new owner must be associated with this restaurant'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (newOwner.role !== 'restaurant_owner' && newOwner.role !== 'superadmin') {
      return new Response(
        JSON.stringify({
          error: 'The new owner must have role "restaurant_owner" or "superadmin"'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (restaurant.owner_id === newOwnerId) {
      return new Response(
        JSON.stringify({ error: 'This user is already the owner of the restaurant' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Transferring ownership from', restaurant.owner_id, 'to', newOwnerId);
    const { error: updateError } = await supabaseClient
      .from('restaurants')
      .update({
        owner_id: newOwnerId,
        owner_name: newOwner.full_name,
        updated_at: new Date().toISOString()
      })
      .eq('id', restaurantId);

    if (updateError) {
      console.error('Error updating restaurant:', updateError);
      return new Response(
        JSON.stringify({ error: `Error transferring ownership: ${updateError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Ownership transferred successfully');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Ownership transferred successfully',
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          previousOwnerId: restaurant.owner_id,
          newOwnerId: newOwnerId,
          newOwnerName: newOwner.full_name,
          newOwnerEmail: newOwner.email
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in transfer-restaurant-ownership function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});