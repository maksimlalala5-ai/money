# Money in Sight — deployment guide

This repository contains the Money in Sight web app and Netlify functions.

## Quick setup (local)

1. Copy `.env.example` to `.env` and fill values (do NOT commit `.env`).
2. Install deps:

```bash
npm install
```

3. Install Netlify CLI (if not installed):

```bash
npm install -g netlify-cli
```

4. Run locally with Netlify Dev (it picks up environment variables from your shell):

```bash
netlify dev --env-file .env
```

Open http://localhost:8888 to test.

## Environment variables
Fill these in Netlify (Site → Settings → Build & deploy → Environment):

- `FIREBASE_ADMIN_CREDENTIALS` — JSON content of Firebase service account (single line or quoted).
- `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID` — optional web config.
- `YOOMONEY_SHOP_ID`, `YOOMONEY_SECRET_KEY` — YooKassa credentials.
- `YOOKASSA_WEBHOOK_SECRET` — HMAC secret used by webhook verification.
- `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY` — for EmailJS production.

## Firestore rules
See `firestore.rules` in repo — adapt to your project and publish via Firebase Console.

## Publish to GitHub and connect to Netlify
1. Initialize git (if not already):

```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create a remote GitHub repo (manual via GitHub UI) or using GitHub CLI:

```bash
# with GitHub CLI (you must be authenticated with `gh auth login`)
gh repo create your-org-or-username/money-in-sight --public --source=. --remote=origin --push
```

3. If you created repo manually, add remote and push:

```bash
git remote add origin https://github.com/<youruser>/<repo>.git
git branch -M main
git push -u origin main
```

4. In Netlify: Sites → Add new site → Import from Git → choose the GitHub repo and set branch `main`. Add environment variables in Site settings.

## Testing webhooks locally
Use the `body.json` example and compute HMAC-SHA256 signature with your `YOOKASSA_WEBHOOK_SECRET` and POST to `http://localhost:8888/.netlify/functions/yookassa-webhook`.

PowerShell example (Windows):

```powershell
$body = Get-Content -Raw -Path .\body.json
$secret = 'your_webhook_secret'
$hmac = New-Object System.Security.Cryptography.HMACSHA256([Text.Encoding]::UTF8.GetBytes($secret))
$hash = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($body))
$sig = ([System.BitConverter]::ToString($hash)).Replace('-','').ToLower()
Invoke-RestMethod -Uri 'http://localhost:8888/.netlify/functions/yookassa-webhook' -Method Post -Body $body -ContentType 'application/json' -Headers @{ 'X-Webhook-Signature' = $sig }
```

## Release workflow (recommended)
- Create feature branch, push, open PR → review → merge to `main`.
- Netlify will auto-deploy when `main` is updated.
- Tag releases with `git tag -a vX.Y.Z -m "release"` and `git push --tags`.

---
If you want, I can create a sample GitHub Actions workflow for CI, or prepare a small `scripts/publish.sh` to automate `git` and `gh` steps.
