# admin.tpotdoc.com: Yv'e's private visitor dashboard

A Cloudflare Worker that reads Cloudflare Web Analytics for tpotdoc.com and shows it in plain language
(visits, pages read, most-read lessons, quiet pages, referrers, countries, devices; 7/30/90 days).
It is separate from the public site: GitHub Pages serves tpotdoc.com, and this Worker serves admin.tpotdoc.com.

## Security model
- **Cloudflare Access** (Zero Trust, free) sits in front of admin.tpotdoc.com. Only the allowed emails can sign in,
  using a one-time code sent by email.
- The Worker **also verifies the Access token itself** (signature, audience, issuer, expiry) and returns 403 if it
  is missing or invalid. So the dashboard stays closed even if the Access app is removed or misconfigured.
- The Worker's API token is **read-only** ("Account Analytics: Read") and stored as a Wrangler secret, never in git.

## One-time setup
1. **Zero Trust / Access (dashboard, or Claude Cowork):**
   - Zero Trust → set up a team name (free plan) if not done; note the team domain, e.g. `tpotdoc.cloudflareaccess.com`.
   - Settings → Authentication → enable **One-time PIN**.
   - Access → Applications → Add → **Self-hosted**: domain `admin.tpotdoc.com`; policy **Allow** → Emails:
     `markyve77@gmail.com`, `brandon.bridges@gmail.com`. Session duration 1 week is fine.
   - Copy the app's **Application Audience (AUD) tag**.
2. **Two API tokens** (My Profile → API Tokens → Create custom token), saved locally, never pasted in chat:
   - Deploy token (expires in 1 day): Account → Workers Scripts: Edit; Account → Account Analytics: Read;
     Zone (tpotdoc.com) → Workers Routes: Edit; Zone (tpotdoc.com) → DNS: Edit.
     `pbpaste > ~/.tpotdoc-cf-deploy-token && chmod 600 ~/.tpotdoc-cf-deploy-token`
   - Runtime token (no expiry): Account → Account Analytics: Read only.
     `pbpaste > ~/.tpotdoc-cf-analytics-token && chmod 600 ~/.tpotdoc-cf-analytics-token`
3. **Fill in `wrangler.toml` [vars]:** `ACCOUNT_ID`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, and `SITE_TAG`.
   The site tag (not the public beacon token) can be found with a GraphQL query grouped by `siteTag` and
   `requestHost` over the last few days, using the runtime token.
4. **Deploy:**
   ```sh
   cd admin
   export CLOUDFLARE_API_TOKEN=$(cat ~/.tpotdoc-cf-deploy-token) CLOUDFLARE_ACCOUNT_ID=<account id>
   npx wrangler@3.114.0 secret put CF_API_TOKEN < ~/.tpotdoc-cf-analytics-token
   npx wrangler@3.114.0 deploy
   ```
5. **Test:** open https://admin.tpotdoc.com in a private window. You should get the Access sign-in, then the
   dashboard. `curl -s -o /dev/null -w "%{http_code}" https://admin.tpotdoc.com/api/stats` without signing in should
   not return data (Access redirect or 403).

## Adding someone later
Add their email to the Access policy. Nothing in the code changes.
