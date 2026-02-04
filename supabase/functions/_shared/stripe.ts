import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

export { Stripe };

export const createStripeClient = (apiKey: string) => {
  return new Stripe(apiKey, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });
};

export const createCheckoutSession = async (
  stripe: Stripe,
  params: Stripe.Checkout.SessionCreateParams
) => {
  return await stripe.checkout.sessions.create(params);
};

export const constructEvent = (
  stripe: Stripe,
  body: string,
  signature: string,
  secret: string
) => {
  return stripe.webhooks.constructEvent(body, signature, secret);
};
