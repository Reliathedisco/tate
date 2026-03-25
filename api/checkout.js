export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: "server config error" });
  }

  try {
    const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "subscription",
        "line_items[0][price]": "price_1TF0H9PdD9uuGx4XkFIReyEu",
        "line_items[0][quantity]": "1",
        success_url: "https://tate-gamma.vercel.app/success.html?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "https://tate-gamma.vercel.app/cancel.html",
      }),
    });

    if (!sessionRes.ok) {
      const err = await sessionRes.json();
      return res.status(400).json({ error: err.error?.message || "checkout failed" });
    }

    const session = await sessionRes.json();
    return res.status(200).json({ url: session.url });
  } catch {
    return res.status(500).json({ error: "something went wrong" });
  }
}
