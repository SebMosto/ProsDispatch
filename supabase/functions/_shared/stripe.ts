import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

export const initStripe = (secretKey?: string) => {
  const key = secretKey || Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  return new Stripe(key, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });
};

export const createCheckoutSession = async (
  stripe: Stripe,
  params: Stripe.Checkout.SessionCreateParams,
  options?: Stripe.RequestOptions
) => {
  return await stripe.checkout.sessions.create(params, options);
};

export const constructEvent = async (
  stripe: Stripe,
  req: Request,
  webhookSecret: string
) => {
  const signature = req.headers.get("Stripe-Signature");
  if (!signature) {
    throw new Error("No signature header");
  }
  const body = await req.text();
  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
};

export { Stripe };
