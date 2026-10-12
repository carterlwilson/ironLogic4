import { Response } from 'express';
import crypto from 'node:crypto';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => `&#${character.charCodeAt(0)};`);

export function linkingPage(res: Response, transaction: string, persistent: boolean, error = '') {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'strict-origin');
  res.setHeader('Content-Security-Policy', `default-src 'none'; style-src 'nonce-${nonce}'; form-action 'self'; frame-ancestors 'none'`);
  res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Connect Cully Strength to ChatGPT</title>
  <style nonce="${nonce}">
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 32px 16px; background: #f8f9fa; color: #1f2937; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.5; }
    main { width: 100%; max-width: 420px; }
    .card { padding: 40px; background: white; border: 1px solid #f0f0f0; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05); }
    .brand { margin: 0 0 8px; color: #3d9f5e; font-size: 14px; font-weight: 600; text-align: center; }
    .shield { display: block; width: 40px; height: 40px; margin: 0 auto 24px; color: #3d9f5e; }
    h1 { margin: 0 0 8px; font-size: 28px; line-height: 1.25; font-weight: 700; text-align: center; }
    .intro { margin: 0 0 24px; color: #6b7280; font-size: 14px; text-align: center; }
    .field { margin-bottom: 16px; }
    .field label { display: block; margin-bottom: 6px; font-size: 14px; font-weight: 500; }
    .required { color: #e03131; }
    .input { display: block; width: 100%; min-height: 44px; padding: 10px 12px; border: 1px solid #e0e0e0; border-radius: 8px; background: white; color: #1f2937; font: inherit; font-size: 16px; }
    .input::placeholder { color: #9ca3af; }
    .input:focus { border-color: #3d9f5e; outline: none; box-shadow: 0 0 0 2px rgba(61,159,94,.15); }
    .permissions { margin: 8px 0 16px; color: #6b7280; font-size: 13px; }
    .consent { display: flex; gap: 10px; align-items: flex-start; margin: 16px 0 24px; font-size: 13px; cursor: pointer; }
    .consent input { flex-shrink: 0; width: 18px; height: 18px; margin: 2px 0 0; accent-color: #3d9f5e; }
    button { width: 100%; min-height: 44px; border: 0; border-radius: 8px; padding: 10px 16px; background: #3d9f5e; color: white; font: inherit; font-size: 16px; font-weight: 500; cursor: pointer; transition: background .2s ease; }
    button:hover { background: #2d8448; }
    button:focus-visible, .consent input:focus-visible { outline: 3px solid #1d6b32; outline-offset: 3px; }
    .alert { margin: 0 0 20px; padding: 12px 16px; border: 1px solid #ffc9c9; border-radius: 8px; background: #fff5f5; color: #c92a2a; font-size: 14px; overflow-wrap: anywhere; }
    .security { margin: 24px 0 0; padding: 16px; border: 1px solid #c3e0d1; border-radius: 8px; background: #f0f7f4; color: #4b5563; font-size: 12px; text-align: center; }
    @media (max-width: 420px) { .card { padding: 28px 24px; } h1 { font-size: 25px; } }
  </style>
</head>
<body>
  <main>
    <section class="card" aria-labelledby="login-title">
      <svg class="shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3z"/><path d="m9 12 2 2 4-4"/></svg>
      <p class="brand">Cully Strength</p>
      <h1 id="login-title">Connect to ChatGPT</h1>
      <p class="intro">Sign in to your Cully Strength account.</p>
      ${error ? `<div class="alert" role="alert">${escapeHtml(error)}</div>` : ''}
      <form method="post" action="/oauth/authorize">
        <input type="hidden" name="transaction" value="${escapeHtml(transaction)}">
        <div class="field"><label for="email">Email Address <span class="required" aria-hidden="true">*</span></label><input class="input" id="email" type="email" name="email" placeholder="your@email.com" required autocomplete="username"></div>
        <div class="field"><label for="password">Password <span class="required" aria-hidden="true">*</span></label><input class="input" id="password" type="password" name="password" placeholder="Your password" required autocomplete="current-password"></div>
        <p class="permissions">ChatGPT can look up clients and manage schedule enrollment using your existing permissions.</p>
        <label class="consent"><input type="checkbox" name="consent" value="yes" required><span>I authorize scheduling access${persistent ? ' and allow ChatGPT to stay connected for up to 365 days without signing in again' : ''}.</span></label>
        <button type="submit">Sign In &amp; Connect</button>
      </form>
    </section>
    <p class="security">Your connection is secure and encrypted. Your password is not shared with ChatGPT.</p>
  </main>
</body>
</html>`);
}
