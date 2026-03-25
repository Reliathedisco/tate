export default async function handler(req, res) {
  const sessionId = req.query.session_id;

  if (!sessionId) {
    return res.status(400).json({ error: "missing session — try the payment link again" });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: "server config error — contact support" });
  }

  try {
    const sessionRes = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${stripeKey}`,
        },
      }
    );

    if (!sessionRes.ok) {
      return res.status(400).json({ error: "couldn't verify payment — contact support" });
    }

    const session = await sessionRes.json();
    const subscriptionId = session.subscription;
    const customerEmail = session.customer_details?.email || session.customer_email;

    if (!subscriptionId) {
      return res.status(400).json({ error: "no subscription found — contact support" });
    }

    return res.status(200).json({
      licenseKey: subscriptionId,
      email: customerEmail,
    });
  } catch {
    return res.status(500).json({ error: "something went wrong — contact support" });
  }
}
