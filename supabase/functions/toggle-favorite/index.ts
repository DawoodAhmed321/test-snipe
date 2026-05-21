// toggle-favorite edge function
// Verifies JWT via user client, derives user_id server-side,
// then uses service role client for DB writes (bypasses RLS safely —
// identity is already verified above).
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RequestBody {
  item_id: string;
}

interface SuccessResponse {
  favorited: boolean;
}

interface ErrorResponse {
  error: string;
}

type ResponseBody = SuccessResponse | ErrorResponse;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: ResponseBody, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Missing Authorization header' }, 401);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { item_id } = body;
  if (!item_id || typeof item_id !== 'string') {
    return json({ error: 'item_id is required' }, 400);
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

  // User-scoped client — only used to verify JWT and derive user_id.
  // Never trust a client-supplied user id.
  const userClient = createClient(
    SUPABASE_URL,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const user_id = user.id;

  // Service role client — bypasses RLS for DB operations.
  // Safe because identity is already verified above.
  const adminClient = createClient(
    SUPABASE_URL,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: existing, error: selectError } = await adminClient
    .from('favorites')
    .select('id')
    .eq('user_id', user_id)
    .eq('item_id', item_id)
    .maybeSingle();

  if (selectError) {
    return json({ error: selectError.message }, 500);
  }

  if (existing) {
    const { error: deleteError } = await adminClient
      .from('favorites')
      .delete()
      .eq('user_id', user_id)
      .eq('item_id', item_id);

    if (deleteError) {
      return json({ error: deleteError.message }, 500);
    }
    return json({ favorited: false });
  } else {
    const { error: insertError } = await adminClient
      .from('favorites')
      .insert({ user_id, item_id });

    if (insertError) {
      return json({ error: insertError.message }, 500);
    }
    return json({ favorited: true });
  }
});
