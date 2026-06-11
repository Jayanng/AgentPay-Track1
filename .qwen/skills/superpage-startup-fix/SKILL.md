---
name: AgentPay-startup-fix
description: Complete procedure to fix and start all AgentPay servers on Windows/PowerShell
source: auto-skill
extracted_at: '2026-06-11T02:37:35.244Z'
---

# AgentPay Startup Fix Procedure

## Context
The AgentPay monorepo (https://github.com/TheSupermanish/AgentPay) requires several fixes to run all 3 servers on Windows:
- Backend API â†’ http://localhost:3001
- Payment Server â†’ http://localhost:3002
- Frontend â†’ http://localhost:3000

## Critical Fixes Required

### 1. Remove `path-to-regexp` override
**File:** Root `package.json` in `pnpm.overrides`

Remove `"path-to-regexp": "^8.4.0"` â€” it forces Express 4 to use path-to-regexp v8 which is incompatible. Express 4 requires v1.x (the `pathRegexp` function export differs in v8).

```json
"pnpm": {
  "overrides": {
    "@reown/appkit-controllers": "1.7.8",
    "signal-exit": "^4.1.0",
    "picomatch": "^4.0.4",
    ...
  }
}
```

After removing, run `pnpm install`.

### 2. Fix Shopify variable name in `.env.sample`
**File:** `packages/backend/.env.sample`

The sample uses `SHOPIFY_CLIENT_ID` but `validateEnvironment()` in `src/index.ts` checks for `SHOPIFY_API_KEY`. Change to:
```
SHOPIFY_API_KEY=xxxx
```

### 3. Add missing `MONGODB_URI` to `.env.sample`
**File:** `packages/backend/.env.sample`

Backend code requires `MONGODB_URI` but the sample doesn't include it. Add:
```
MONGODB_URI=mongodb://localhost:27017/x402
```

### 4. Create frontend `.env.local`
**File:** `packages/frontend/.env.local` (doesn't exist by default)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=placeholder
NEXT_PUBLIC_X402_CHAIN=base-sepolia
```

### 5. Build x402-sdk-eth before backend starts
The backend imports from `packages/x402-sdk-eth/dist/index.js` which doesn't exist until built:

```powershell
pnpm --filter @super-x402/sdk run build
```

### 6. Use PowerShell startup script instead of `dev.sh`
The `dev.sh` uses bash commands (`lsof`, `kill`) that don't work on Windows. Use `dev.ps1` instead:

```powershell
.\dev.ps1
```

Or run manually:
```powershell
npx concurrently -n "backend,payment,frontend" -c "blue,green,yellow" `
    "pnpm --filter backend run dev" `
    "pnpm --filter backend run dev:payment" `
    "pnpm --filter frontend run dev"
```

### 7. Add port-killing logic to dev.ps1 (EADDRINUSE fix)
**File:** `dev.ps1`

When restarting the dev server, old Node processes on ports 3000-3002 cause EADDRINUSE errors. Add this to the top of dev.ps1:

```powershell
# Kill existing processes on our ports to prevent EADDRINUSE errors
Write-Host "Checking for existing processes on ports 3000, 3001, 3002..." -ForegroundColor Yellow
foreach ($port in @(3000, 3001, 3002)) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $pids) {
            if ($pid -and $pid -ne 0) {
                Write-Host "  Killing process on port $port (PID $pid)" -ForegroundColor Red
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        }
    }
}
Start-Sleep -Seconds 2
Write-Host "Port cleanup complete." -ForegroundColor Green
```

### 8. Make WalletConnect graceful when unconfigured
**Files:** 
- `packages/frontend/components/providers/ethereum-wallet-provider.tsx`
- `packages/frontend/components/wallet-connect.tsx`

When `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=placeholder`, RainbowKit makes API calls that return 403 errors. Fix by:

1. **In ethereum-wallet-provider.tsx**: Check if project ID is valid before creating Wagmi config. If not configured, skip provider initialization and render children directly.

2. **In wallet-connect.tsx**: Add try-catch around wagmi hooks and show a non-functional "Connect Wallet" button with tooltip when unconfigured.

**Why:** The frontend should render marketplace pages even without wallet connection.

### 9. Add MongoDB connection guard
**File:** `packages/backend/src/config/database.ts`

On hot reload or multiple imports, MongoDB connects twice. Add readyState guard:

```typescript
if (mongoose.connection.readyState === 1) {
  console.log('âœ… MongoDB already connected');
  return;
}
```

**Why:** Prevents duplicate connection logs and potential connection pool issues.

## Backend `.env` Template

```env
# SERVER
PORT=3001
PAYMENT_SERVER_PORT=3002
NODE_ENV=development
APP_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# MONGODB (required)
MONGODB_URI=mongodb://localhost:27017/x402

# SUPABASE (optional)
SUPABASE_URL=https://placeholder.supabase.co
SUPABASE_KEY=placeholder

# X402 PAYMENT
X402_NETWORK=devnet

# WALLET
WALLET_PRIVATE_KEY=placeholder
X402_RECIPIENT_ADDRESS=0xa22c5d0840aae11a5483ca6dff12206905320496

# JWT
JWT_SECRET=hackathon-demo-secret-2026

# SHOPIFY (optional)
# SHOPIFY_API_KEY=your-key
# SHOPIFY_CLIENT_SECRET=your-secret
```

## Additional Notes

### Shopify vars made optional
The `validateEnvironment()` function in `src/index.ts` makes `SHOPIFY_API_KEY` and `SHOPIFY_CLIENT_SECRET` optional. They produce a warning instead of exiting. This allows hackathon/demo use without Shopify credentials.

### Required environment variables (strict)
- `MONGODB_URI`
- `JWT_SECRET`
- `APP_URL`
- `FRONTEND_URL`

### Optional environment variables (warned if missing)
- `SHOPIFY_API_KEY`
- `SHOPIFY_CLIENT_SECRET`

### ERC-8004 warning is normal
Backend shows `[ERC-8004] Skipped: no wallet key configured` when `WALLET_PRIVATE_KEY=placeholder`. This is expected and doesn't affect functionality.

### multer override is safe
The root `package.json` has `"multer": "^2.0.1"` in overrides. This is consistent with what `packages/backend/package.json` uses, so it's safe to keep.

## Success Criteria
- âœ… dev.ps1 kills old processes automatically before starting
- âœ… Backend starts on port 3001 without EADDRINUSE errors
- âœ… Payment server starts on port 3002
- âœ… Frontend loads at http://localhost:3000 without 403 WalletConnect errors
- âœ… Marketplace pages render even without wallet connected
- âœ… MongoDB connects only once per backend instance
- âœ… Restarting dev.ps1 works cleanly without port conflicts
- âœ… Backend API responds at http://localhost:3001/health
- âœ… Payment Server responds at http://localhost:3002/health

