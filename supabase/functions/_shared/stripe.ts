import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const getStripe = () => {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });
};

export const createCheckoutSession = async (
  params: Stripe.Checkout.SessionCreateParams,
  stripeAccount?: string
) => {
  const options = stripeAccount ? { stripeAccount } : undefined;
  return await getStripe().checkout.sessions.create(params, options);
};

export const constructWebhookEvent = (body: string, signature: string, secret: string) => {
  return getStripe().webhooks.constructEvent(body, signature, secret);
};

export type { Stripe };
