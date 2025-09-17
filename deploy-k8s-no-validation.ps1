# CampusConnect Kubernetes Deployment Script for Windows PowerShell (No Validation)
# This script deploys the complete CampusConnect application to Kubernetes

param(
    [switch]$SkipImageBuild = $false
)

Write-Host "🚀 Starting CampusConnect Kubernetes Deployment (No Validation)..." -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if kubectl is installed
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Error "kubectl is not installed. Please install kubectl first."
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Error "Docker is not running. Please start Docker first."
    exit 1
}

Write-Status "Checking Kubernetes cluster connectivity..."
try {
    kubectl cluster-info | Out-Null
    Write-Success "✅ Connected to Kubernetes cluster"
} catch {
    Write-Error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
}

Write-Success "✅ Prerequisites check passed"

# Build Docker images if not skipped
if (-not $SkipImageBuild) {
    Write-Status "Building Docker images..."

    Write-Status "Building backend image..."
    Set-Location "server"
    docker build -t campusconnect-backend:latest .
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Backend image built successfully"
    } else {
        Write-Error "Failed to build backend image"
        exit 1
    }

    Set-Location "..\cc"
    Write-Status "Building frontend image..."
    docker build -t campusconnect-frontend:latest .
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend image built successfully"
    } else {
        Write-Error "Failed to build frontend image"
        exit 1
    }

    Set-Location ".."
    Write-Success "✅ All Docker images built successfully"
} else {
    Write-Warning "Skipping Docker image build as requested"
}

# Deploy to Kubernetes with --validate=false
Write-Status "Deploying to Kubernetes (validation disabled)..."

# Create namespace
Write-Status "Creating namespace..."
kubectl apply -f k8s/namespace.yaml --validate=false
Write-Success "Namespace created"

# Deploy secrets and configmaps
Write-Status "Deploying secrets and configmaps..."
kubectl apply -f k8s/mongodb-secret.yaml --validate=false
kubectl apply -f k8s/mongodb-configmap.yaml --validate=false
kubectl apply -f k8s/backend-secret.yaml --validate=false
kubectl apply -f k8s/backend-configmap.yaml --validate=false
kubectl apply -f k8s/frontend-configmap.yaml --validate=false
Write-Success "Secrets and ConfigMaps deployed"

# Deploy MongoDB
Write-Status "Deploying MongoDB..."
kubectl apply -f k8s/mongodb-pvc.yaml --validate=false
kubectl apply -f k8s/mongodb-deployment.yaml --validate=false
kubectl apply -f k8s/mongodb-service.yaml --validate=false
Write-Success "MongoDB deployed"

# Wait for MongoDB to be ready
Write-Status "Waiting for MongoDB to be ready..."
Start-Sleep -Seconds 10
$timeout = 300
$elapsed = 0
$interval = 10

while ($elapsed -lt $timeout) {
    $mongoReady = kubectl get pods -l app=mongodb -n campusconnect -o jsonpath='{.items[0].status.phase}' 2>$null
    if ($mongoReady -eq "Running") {
        Write-Success "MongoDB is ready"
        break
    }
    Write-Status "MongoDB starting... ($elapsed/$timeout seconds)"
    Start-Sleep -Seconds $interval
    $elapsed += $interval
}

if ($elapsed -ge $timeout) {
    Write-Warning "MongoDB startup timeout. Check with: kubectl get pods -n campusconnect"
}

# Deploy Backend
Write-Status "Deploying Backend..."
kubectl apply -f k8s/backend-deployment.yaml --validate=false
kubectl apply -f k8s/backend-service.yaml --validate=false
Write-Success "Backend deployed"

# Wait for Backend to be ready
Write-Status "Waiting for Backend to be ready..."
Start-Sleep -Seconds 10
$elapsed = 0

while ($elapsed -lt $timeout) {
    $backendReady = kubectl get pods -l app=backend -n campusconnect -o jsonpath='{.items[0].status.phase}' 2>$null
    if ($backendReady -eq "Running") {
        Write-Success "Backend is ready"
        break
    }
    Write-Status "Backend starting... ($elapsed/$timeout seconds)"
    Start-Sleep -Seconds $interval
    $elapsed += $interval
}

if ($elapsed -ge $timeout) {
    Write-Warning "Backend startup timeout. Check with: kubectl get pods -n campusconnect"
}

# Deploy Frontend
Write-Status "Deploying Frontend..."
kubectl apply -f k8s/frontend-deployment.yaml --validate=false
kubectl apply -f k8s/frontend-service.yaml --validate=false
Write-Success "Frontend deployed"

# Wait for Frontend to be ready
Write-Status "Waiting for Frontend to be ready..."
Start-Sleep -Seconds 10
$elapsed = 0

while ($elapsed -lt $timeout) {
    $frontendReady = kubectl get pods -l app=frontend -n campusconnect -o jsonpath='{.items[0].status.phase}' 2>$null
    if ($frontendReady -eq "Running") {
        Write-Success "Frontend is ready"
        break
    }
    Write-Status "Frontend starting... ($elapsed/$timeout seconds)"
    Start-Sleep -Seconds $interval
    $elapsed += $interval
}

if ($elapsed -ge $timeout) {
    Write-Warning "Frontend startup timeout. Check with: kubectl get pods -n campusconnect"
}

# Apply network policy
Write-Status "Applying network policies..."
kubectl apply -f k8s/network-policy.yaml --validate=false
Write-Success "Network policies applied"

Write-Success "🎉 CampusConnect deployment completed successfully!"

# Display service information
Write-Status "Getting service information..."
Write-Host ""
Write-Host "=== SERVICE ENDPOINTS ===" -ForegroundColor Yellow
kubectl get services -n campusconnect

Write-Host ""
Write-Host "=== POD STATUS ===" -ForegroundColor Yellow
kubectl get pods -n campusconnect

Write-Host ""
Write-Host "=== DEPLOYMENT STATUS ===" -ForegroundColor Yellow
kubectl get deployments -n campusconnect

Write-Host ""
Write-Success "🌐 To access your application, run these commands in separate PowerShell windows:"
Write-Host ""
Write-Host "1. Frontend Access:" -ForegroundColor Yellow
Write-Host "   kubectl port-forward service/frontend-service 3500:3500 -n campusconnect" -ForegroundColor Cyan
Write-Host "   Then open: http://localhost:3500" -ForegroundColor Green
Write-Host ""
Write-Host "2. Backend Access:" -ForegroundColor Yellow
Write-Host "   kubectl port-forward service/backend-service 3800:3800 -n campusconnect" -ForegroundColor Cyan
Write-Host "   Then test: http://localhost:3800/health" -ForegroundColor Green
Write-Host ""
Write-Host "3. MongoDB Access (for Compass):" -ForegroundColor Yellow
Write-Host "   kubectl port-forward service/mongodb-service 27017:27017 -n campusconnect" -ForegroundColor Cyan
Write-Host "   Connection: mongodb://admin:password123@localhost:27017/campusconnect?authSource=admin" -ForegroundColor Green

Write-Host ""
Write-Status "Useful commands:"
Write-Host "Check logs: kubectl logs -l app=<mongodb|backend|frontend> -n campusconnect" -ForegroundColor Cyan
Write-Host "Delete all: kubectl delete namespace campusconnect" -ForegroundColor Red

Write-Success "🚀 Deployment script completed successfully!"