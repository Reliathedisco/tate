export default async function handler(req, res) {
  const sessionId = req.query.session_id;

  if (!sessionId) {
    return res.status(400).send(renderPage({
      error: true,
      message: "missing session — try the payment link again"
    }));
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).send(renderPage({
      error: true,
      message: "server config error — contact support"
    }));
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
      return res.status(400).send(renderPage({
        error: true,
        message: "couldn't verify payment — contact support"
      }));
    }

    const session = await sessionRes.json();
    const subscriptionId = session.subscription;
    const customerEmail = session.customer_details?.email || session.customer_email;

    if (!subscriptionId) {
      return res.status(400).send(renderPage({
        error: true,
        message: "no subscription found — contact support"
      }));
    }

    return res.status(200).send(renderPage({
      error: false,
      licenseKey: subscriptionId,
      email: customerEmail
    }));
  } catch {
    return res.status(500).send(renderPage({
      error: true,
      message: "something went wrong — contact support"
    }));
  }
}

function renderPage({ error, message, licenseKey, email }) {
  if (error) {
    return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>tate — oops</title>
${sharedStyles()}
</head><body>
<div class="card">
  <div class="icon">✗</div>
  <h1>something went wrong</h1>
  <p class="dim">${message}</p>
</div>
</body></html>`;
  }

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>tate — you're in</title>
${sharedStyles()}
</head><body>
<div class="card">
  <div class="icon">✦</div>
  <h1>you're in</h1>
  <p class="dim">watch mode is unlocked${email ? ` for <strong>${email}</strong>` : ""}. here's your license key:</p>

  <div class="key-box" onclick="copyKey()">
    <code id="license-key">${licenseKey}</code>
    <span class="copy-label" id="copy-label">click to copy</span>
  </div>

  <p class="dim">now run this in your terminal:</p>

  <div class="command-box" onclick="copyCommand()">
    <span class="prompt">$</span>
    <code id="command">npx tate --activate ${licenseKey}</code>
    <span class="copy-label" id="copy-label-cmd">click to copy</span>
  </div>

  <p class="dim small">then start watch mode with <strong>npx tate --watch</strong></p>
</div>

<script>
function copyKey() {
  navigator.clipboard.writeText('${licenseKey}');
  document.getElementById('copy-label').textContent = 'copied!';
  document.getElementById('copy-label').style.color = '#4ade80';
  setTimeout(() => {
    document.getElementById('copy-label').textContent = 'click to copy';
    document.getElementById('copy-label').style.color = '';
  }, 2000);
}
function copyCommand() {
  navigator.clipboard.writeText('npx tate --activate ${licenseKey}');
  document.getElementById('copy-label-cmd').textContent = 'copied!';
  document.getElementById('copy-label-cmd').style.color = '#4ade80';
  setTimeout(() => {
    document.getElementById('copy-label-cmd').textContent = 'click to copy';
    document.getElementById('copy-label-cmd').style.color = '';
  }, 2000);
}
</script>
</body></html>`;
}

function sharedStyles() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0a0a0b;
    color: #e4e4e7;
    font-family: 'Space Grotesk', system-ui, sans-serif;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .card {
    max-width: 520px;
    width: 100%;
    text-align: center;
    animation: fadeUp 0.6s ease-out both;
  }
  .icon { font-size: 2.5rem; margin-bottom: 16px; }
  h1 {
    font-size: 1.8rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    margin-bottom: 12px;
  }
  .dim { color: #71717a; font-size: 0.95rem; line-height: 1.6; }
  .dim strong { color: #e4e4e7; font-weight: 600; }
  .small { font-size: 0.85rem; margin-top: 24px; }
  .key-box, .command-box {
    background: #141416;
    border: 1px solid #1f1f23;
    border-radius: 12px;
    padding: 16px 20px;
    margin: 20px 0;
    cursor: pointer;
    transition: border-color 0.2s;
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: center;
  }
  .key-box:hover, .command-box:hover { border-color: #2a2a30; }
  .key-box code, .command-box code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
    color: #4ade80;
    word-break: break-all;
  }
  .prompt {
    color: #4ade80;
    font-family: 'JetBrains Mono', monospace;
    user-select: none;
  }
  .copy-label {
    font-size: 0.75rem;
    color: #71717a;
    white-space: nowrap;
    transition: color 0.2s;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>`;
}
