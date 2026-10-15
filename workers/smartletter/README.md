# Tunjos Smartletter Worker

Cloudflare Worker that accepts subscription requests from `tunjos.co` and
creates contacts in the Tunjos Smartletter segment in Resend.

## Required Cloudflare configuration

Configure these under **Worker > Settings > Variables and Secrets**:

- `RESEND_API_KEY` — a dedicated Resend API key with full access; store it as
  a Cloudflare secret.
- `RESEND_SEGMENT_ID` — the ID of the Tunjos Smartletter segment in Resend.

`ALLOWED_ORIGINS` is non-sensitive and is committed in `wrangler.jsonc`.

## Local development

```sh
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

Use only a test Resend key in `.dev.vars`. The file is ignored by Git.

## Tests

```sh
npm test
npm run check
```

## Deployment

Connect this repository to Cloudflare Workers Builds with:

- Root directory: `/workers/smartletter`
- Worker name: `tunjos-smartletter`
- Deploy command: `npx wrangler deploy`
- Production branch: the repository's default branch
- Build watch path: `workers/smartletter/**`

Alternatively, deploy from this directory with `npm run deploy`.

The public endpoint is `POST /subscribe` with a JSON body:

```json
{
  "email": "reader@example.com",
  "website": ""
}
```

`website` is a honeypot field and must remain empty for real users.

## Jekyll isolation

The root `_config.yml` excludes `workers`, so this project is neither processed
nor copied into the GitHub Pages build output.
