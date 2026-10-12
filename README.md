# GoPrompts

A marketplace for AI prompts: buy, try and sell. Built with Next.js 15 (App Router), Tailwind v4 and Supabase.

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase URL and publishable key.
3. In the Supabase dashboard, open **SQL Editor** and run, in order:
   1. `supabase/migrations/20261011000000_init.sql` (schema, RLS, functions)
   2. `supabase/seed.sql` (optional demo creators, prompts and reviews)
4. In **Authentication → URL Configuration**, set the Site URL to `http://localhost:3100` and add
   `http://localhost:3100/auth/callback` to the redirect URLs.
5. `npm run dev -- -p 3100`

### Make yourself an admin

Sign up in the app, then run in the SQL editor:

```sql
update public.profiles set role = 'admin' where handle = 'your_handle';
```

### Optional: Google login

Enable the Google provider under **Authentication → Providers** with a Google OAuth client.

## How it fits together

| Piece | Where |
|---|---|
| Schema, RLS policies, RPCs | `supabase/migrations/` |
| Supabase clients (cookie sessions) | `lib/supabase/` |
| Session refresh + route guards | `middleware.ts` |
| Read queries | `lib/queries.ts` |
| Mutations (server actions) | `app/actions.ts` |

**Prompt protection:** listing data lives in `prompts` (public), while the template lives in
`prompt_secrets`. RLS only returns a template to its creator, admins, buyers and (for free
prompts) signed-in users. Locked pages never send the template to the browser.

**Purchases** can only be written by security-definer functions. `acquire_prompt()` handles free
prompts, and paid prompts while `app_settings.demo_payments` is `true`. Turn that off when Stripe is wired in:

```sql
update public.app_settings set demo_payments = false;
```

## Not done yet

- Stripe Checkout + Connect payouts (the checkout is a demo)
- LLM calls for "Try it free": currently returns the creator's first example output.
  Needs a server-only Supabase secret key (to read the hidden template) and an LLM API key.
- Editing and deleting listings, profile settings, image uploads
