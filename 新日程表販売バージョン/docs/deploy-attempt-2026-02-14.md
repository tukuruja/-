# Deploy Attempt Log (2026-02-14)

## Commands
1. `npm run build`
2. `npx vercel deploy --prod -y --name shinnitteihyo-app`

## Result
- Build: success
- Deploy: failed (`npm ERR! code E403` when fetching `vercel` from npm registry)

## Error excerpt
```
403 Forbidden - GET https://registry.npmjs.org/vercel
```

## Impact
- `dist/` artifacts were regenerated from the latest source.
- Production deployment could not be completed from this environment because Vercel CLI package download is blocked by registry policy/network controls.

## Next step
- Run deployment in an environment with npm access to `vercel` package (or preinstalled Vercel CLI + authenticated token).

## Follow-up investigation
- Checked environment variables for Vercel credentials:
  - Command: `env | rg -n "VERCEL|TOKEN|NPM|REGISTRY"`
  - Result: no Vercel token (`VERCEL_TOKEN`) found in current shell environment.
- Verified Vercel CLI availability:
  - Command: `vercel --version`
  - Result: `command not found`.

## Blockers in this container
1. Vercel CLI is not installed.
2. Installing via npm/npx is blocked by npm registry `E403` for package `vercel`.
3. No preconfigured Vercel authentication token is available in environment variables.

## Ready-to-run deploy command (in a compatible environment)
```bash
cd 新日程表販売バージョン
npm run build
vercel deploy --prod -y --name shinnitteihyo-app
```
