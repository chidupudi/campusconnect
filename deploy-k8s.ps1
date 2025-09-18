# CampusConnect Kubernetes Deployment Script for Windows PowerShell
# This script deploys the complete CampusConnect application to Kubernetes

param(
    [switch]$SkipImageBuild = $false
)

Write-Host "🚀 Starting CampusConnect Kubernetes Deployment..." -ForegroundColor Blue

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

# Deploy to Kubernetes
Write-Status "Deploying to Kubernetes..."

# Create namespace
Write-Status "Creating namespace..."
kubectl apply -f k8s/namespace.yaml
Write-Success "Namespace created"

# Deploy secrets and configmaps
Write-Status "Deploying secrets and configmaps..."
kubectl apply -f k8s/mongodb-secret.yaml
kubectl apply -f k8s/mongodb-configmap.yaml
kubectl apply -f k8s/backend-secret.yaml
kubectl apply -f k8s/backend-configmap.yaml
kubectl apply -f k8s/frontend-configmap.yaml
Write-Success "Secrets and ConfigMaps deployed"

# Deploy MongoDB
Write-Status "Deploying MongoDB..."
kubectl apply -f k8s/mongodb-pvc.yaml
kubectl apply -f k8s/mongodb-deployment.yaml
kubectl apply -f k8s/mongodb-service.yaml
Write-Success "MongoDB deployed"

# Wait for MongoDB to be ready
Write-Status "Waiting for MongoDB to be ready..."
kubectl wait --for=condition=ready pod -l app=mongodb -n campusconnect --timeout=300s
if ($LASTEXITCODE -eq 0) {
    Write-Success "MongoDB is ready"
} else {
    Write-Warning "MongoDB might still be starting. Check with: kubectl get pods -n campusconnect"
}

# Deploy Backend
Write-Status "Deploying Backend..."
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
Write-Success "Backend deployed"

# Wait for Backend to be ready
Write-Status "Waiting for Backend to be ready..."
kubectl wait --for=condition=ready pod -l app=backend -n campusconnect --timeout=300s
if ($LASTEXITCODE -eq 0) {
    Write-Success "Backend is ready"
} else {
    Write-Warning "Backend might still be starting. Check with: kubectl get pods -n campusconnect"
}

# Deploy Frontend
Write-Status "Deploying Frontend..."
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
Write-Success "Frontend deployed"

# Wait for Frontend to be ready
Write-Status "Waiting for Frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=frontend -n campusconnect --timeout=300s
if ($LASTEXITCODE -eq 0) {
    Write-Success "Frontend is ready"
} else {
    Write-Warning "Frontend might still be starting. Check with: kubectl get pods -n campusconnect"
}

# Apply network policy
Write-Status "Applying network policies..."
kubectl apply -f k8s/network-policy.yaml
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

# Get service ports
Write-Status "Getting external access information..."
$frontendPort = kubectl get service frontend-service -n campusconnect -o jsonpath='{.spec.ports[0].port}'
$backendPort = kubectl get service backend-service -n campusconnect -o jsonpath='{.spec.ports[0].port}'

Write-Host ""
Write-Success "🌐 Access your application:"
Write-Host "Frontend: http://localhost:$frontendPort" -ForegroundColor Green
Write-Host "Backend API: http://localhost:$backendPort" -ForegroundColor Green

# Port forwarding commands
Write-Host ""
Write-Status "To access your application locally, run these commands in separate PowerShell windows:"
Write-Host "Frontend: kubectl port-forward service/frontend-service 3500:3500 -n campusconnect" -ForegroundColor Cyan
Write-Host "Backend:  kubectl port-forward service/backend-service 3800:3800 -n campusconnect" -ForegroundColor Cyan
Write-Host "MongoDB:  kubectl port-forward service/mongodb-service 27017:27017 -n campusconnect" -ForegroundColor Cyan

Write-Host ""
Write-Status "To check logs:"
Write-Host "MongoDB: kubectl logs -l app=mongodb -n campusconnect" -ForegroundColor Cyan
Write-Host "Backend: kubectl logs -l app=backend -n campusconnect" -ForegroundColor Cyan
Write-Host "Frontend: kubectl logs -l app=frontend -n campusconnect" -ForegroundColor Cyan

Write-Host ""
Write-Status "To delete the deployment:"
Write-Host "kubectl delete namespace campusconnect" -ForegroundColor Red

Write-Host ""
Write-Status "MongoDB Compass Connection:"
Write-Host "1. Run: kubectl port-forward service/mongodb-service 27017:27017 -n campusconnect" -ForegroundColor Cyan
Write-Host "2. Connect to: mongodb://admin:password123@localhost:27017/campusconnect?authSource=admin" -ForegroundColor Cyan

Write-Success "🚀 Deployment script completed successfully!"