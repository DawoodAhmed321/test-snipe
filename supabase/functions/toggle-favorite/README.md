# toggle-favorite

Supabase Edge Function that favorites or unfavorites an item for the authenticated user.

## What it does

1. Validates the `Authorization: Bearer <jwt>` header on every request.
2. Creates a **user-scoped client** (anon key + user JWT) and calls `auth.getUser()` to derive `user_id` server-side.  
   **The client never supplies a user id in the body** — only `item_id`.
3. Creates a **service role client** for all database operations. This bypasses RLS safely because identity is already verified in step 2.
4. Checks whether a row already exists in the `favorites` table for `(user_id, item_id)`.
   - If it **exists** → `DELETE` (unfavorite) → returns `{ "favorited": false }`
   - If it **doesn't exist** → `INSERT` (favorite) → returns `{ "favorited": true }`

### Why two clients?

The user JWT passed as `Authorization` does not propagate `auth.uid()` to RLS when using the anon key in an edge function context. Using the service role key for DB writes (after server-side identity verification) is the correct and standard Supabase pattern.

### Typed response contract

```ts
// success
{ "favorited": boolean }

// error
{ "error": string }   // HTTP status 400 | 401 | 500
```

---

## How to deploy

### Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) ≥ 1.163
- A linked Supabase project (`supabase link --project-ref <ref>`)

### Steps

```bash
# 1. Log in (once)
supabase login

# 2. Link project if not already done
supabase link --project-ref <your-project-ref>

# 3. Deploy the function
supabase functions deploy toggle-favorite

# 4. Verify
supabase functions list
```

### Runtime secrets

The function reads these from the Supabase runtime environment automatically — no manual setup needed for deployed functions:

| Secret | Source |
|---|---|
| `SUPABASE_URL` | Auto-injected by Supabase |
| `SUPABASE_ANON_KEY` | Auto-injected by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Supabase |

For **local development**, create `supabase/.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```
Find it in: **Supabase Dashboard → Project Settings → API → `service_role` key**.

---

## How to call it (from the app)

```ts
const { data, error } = await supabase.functions.invoke('toggle-favorite', {
  body: { item_id: 'some-uuid' },
});
// data: { favorited: boolean } | { error: string }
```

---

## How it was tested

### Local smoke test with `curl`

```bash
# Start local functions server
supabase start
supabase functions serve toggle-favorite

# Get a JWT from a seeded test user
JWT=$(curl -s -X POST \
  "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test-password"}' \
  | jq -r .access_token)

# Toggle favorite (first call → favorited: true)
curl -s -X POST http://localhost:54321/functions/v1/toggle-favorite \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"item_id":"<some-item-uuid>"}' | jq
# → { "favorited": true }

# Toggle again (second call → favorited: false)
curl -s -X POST http://localhost:54321/functions/v1/toggle-favorite \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"item_id":"<some-item-uuid>"}' | jq
# → { "favorited": false }
```

### Error cases verified

- Missing `Authorization` header → `401 { "error": "Missing Authorization header" }`
- Invalid/expired JWT → `401 { "error": "Unauthorized" }`
- Missing `item_id` in body → `400 { "error": "item_id is required" }`
- Invalid JSON body → `400 { "error": "Invalid JSON body" }`

