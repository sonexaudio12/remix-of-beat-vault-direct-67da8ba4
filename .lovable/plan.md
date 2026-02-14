

## Add STRIPE_WEBHOOK_SECRET

### What
Store the Stripe webhook signing secret so the `stripe-webhook` Edge Function can verify incoming webhook signatures.

### Steps
1. Add the secret `STRIPE_WEBHOOK_SECRET` with value `whsec_o3eOThEdz3LPqToNZsNwOd8YCwQe5HXq` to the project's backend secrets
2. No code changes needed -- the webhook function already reads `STRIPE_WEBHOOK_SECRET` from environment variables and uses it for signature verification

### Security Recommendation
Since the secret was shared in plain text in this conversation, after confirming the webhook works:
1. Go to your Stripe Dashboard > Developers > Webhooks
2. Roll/rotate the signing secret
3. Update the stored secret with the new value

### Result
Once added, the `stripe-webhook` function will verify every incoming event's `stripe-signature` header against this secret, rejecting any forged or tampered requests.

