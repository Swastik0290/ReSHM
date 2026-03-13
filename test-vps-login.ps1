# VPS Backend Login Test Script
# Run this script to test the admin login on the VPS backend

$VPS_URL = "http://103.86.177.125:5000"
$EMAIL = "admin@swas.com"
$PASSWORD = "123456"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Svasa Metric - VPS Backend Login Test" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "[1/3] Testing backend health..." -ForegroundColor Blue
try {
    $healthResponse = Invoke-WebRequest -Uri "$VPS_URL/api/health" -TimeoutSec 10 -UseBasicParsing
    $health = $healthResponse.Content | ConvertFrom-Json
    Write-Host "✓ Backend is running" -ForegroundColor Green
    Write-Host "    Status: $($health.status)" -ForegroundColor Green
    Write-Host "    Message: $($health.message)" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend health check failed" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Ensure the backend is deployed and running on the VPS" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: Login Request
Write-Host "[2/3] Testing login with admin credentials..." -ForegroundColor Blue
$loginBody = @{
    email = $EMAIL
    password = $PASSWORD
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$VPS_URL/api/auth/login" `
        -Method POST `
        -Headers @{'Content-Type' = 'application/json'} `
        -Body $loginBody `
        -TimeoutSec 10 `
        -UseBasicParsing
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token
    $user = $loginData.user
    
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "    User: $($user.username)" -ForegroundColor Green
    Write-Host "    Email: $($user.email)" -ForegroundColor Green
    Write-Host "    Role: $($user.role)" -ForegroundColor Green
    Write-Host "    Verified: $($user.verified)" -ForegroundColor Green
} catch {
    Write-Host "✗ Login failed" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3: Authenticated Request
Write-Host "[3/3] Testing authenticated request..." -ForegroundColor Blue
try {
    $authHeaders = @{
        'Content-Type' = 'application/json'
        'Authorization' = "Bearer $token"
    }
    
    $authResponse = Invoke-WebRequest -Uri "$VPS_URL/api/auth/me" `
        -Headers $authHeaders `
        -TimeoutSec 10 `
        -UseBasicParsing
    
    $authUser = $authResponse.Content | ConvertFrom-Json
    Write-Host "✓ Authentication verified" -ForegroundColor Green
    Write-Host "    ID: $($authUser._id)" -ForegroundColor Green
    Write-Host "    Username: $($authUser.username)" -ForegroundColor Green
} catch {
    Write-Host "✗ Authentication verification failed" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "All Tests Passed! ✓" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend Configuration:" -ForegroundColor Cyan
Write-Host "  URL: $VPS_URL" -ForegroundColor White
Write-Host "  Admin Email: $EMAIL" -ForegroundColor White
Write-Host "  Admin Password: $PASSWORD" -ForegroundColor White
Write-Host ""
Write-Host "The client can now be deployed and will connect to this backend." -ForegroundColor Yellow
