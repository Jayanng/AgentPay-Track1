# AgentPay Development Server Startup Script (PowerShell)
# This script starts all 3 servers: backend, payment, and frontend

Write-Host "Starting AgentPay development servers..." -ForegroundColor Cyan
Write-Host "  Backend API    ? http://localhost:3001" -ForegroundColor Blue
Write-Host "  Payment Server ? http://localhost:3002" -ForegroundColor Green
Write-Host "  Frontend       ? http://localhost:3000" -ForegroundColor Yellow
Write-Host ""

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
Write-Host ""

# Build x402-sdk-eth first (required before backend starts)
Write-Host "Building x402-sdk-eth..." -ForegroundColor Cyan
pnpm --filter @super-x402/sdk run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to build x402-sdk-eth" -ForegroundColor Red
    exit 1
}

# Start all servers concurrently
npx concurrently -n "backend,payment,frontend" -c "blue,green,yellow" `
    "pnpm --filter backend run dev" `
    "pnpm --filter backend run dev:payment" `
    "pnpm --filter frontend run dev"
