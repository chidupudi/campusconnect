#!/bin/bash

# CampusConnect Kubernetes Deployment Script
# This script deploys the complete CampusConnect application to Kubernetes

set -e

echo "🚀 Starting CampusConnect Kubernetes Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_status "Checking Kubernetes cluster connectivity..."
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

print_success "✅ Prerequisites check passed"

# Build Docker images first
print_status "Building Docker images..."

print_status "Building backend image..."
cd server
docker build -t campusconnect-backend:latest .
if [ $? -eq 0 ]; then
    print_success "Backend image built successfully"
else
    print_error "Failed to build backend image"
    exit 1
fi

cd ../cc
print_status "Building frontend image..."
docker build -t campusconnect-frontend:latest .
if [ $? -eq 0 ]; then
    print_success "Frontend image built successfully"
else
    print_error "Failed to build frontend image"
    exit 1
fi

cd ..

print_success "✅ All Docker images built successfully"

# Deploy to Kubernetes
print_status "Deploying to Kubernetes..."

# Create namespace
print_status "Creating namespace..."
kubectl apply -f k8s/namespace.yaml
print_success "Namespace created"

# Deploy secrets and configmaps
print_status "Deploying secrets and configmaps..."
kubectl apply -f k8s/backend-secret.yaml
kubectl apply -f k8s/backend-configmap.yaml
kubectl apply -f k8s/frontend-configmap.yaml
print_success "Secrets and ConfigMaps deployed"

# Note: MongoDB Atlas is used, so no local MongoDB deployment needed
print_status "Using MongoDB Atlas (cloud-hosted) - no local MongoDB deployment required"

# Deploy Backend
print_status "Deploying Backend..."
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
print_success "Backend deployed"

# Wait for Backend to be ready
print_status "Waiting for Backend to be ready..."
kubectl wait --for=condition=ready pod -l app=backend -n campusconnect --timeout=300s
print_success "Backend is ready"

# Deploy Frontend
print_status "Deploying Frontend..."
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
print_success "Frontend deployed"

# Wait for Frontend to be ready
print_status "Waiting for Frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=frontend -n campusconnect --timeout=300s
print_success "Frontend is ready"

# Apply network policy
print_status "Applying network policies..."
kubectl apply -f k8s/network-policy.yaml
print_success "Network policies applied"

print_success "🎉 CampusConnect deployment completed successfully!"

# Display service information
print_status "Getting service information..."
echo ""
echo "=== SERVICE ENDPOINTS ==="
kubectl get services -n campusconnect

echo ""
echo "=== POD STATUS ==="
kubectl get pods -n campusconnect

echo ""
echo "=== DEPLOYMENT STATUS ==="
kubectl get deployments -n campusconnect

# Get external IPs
print_status "Getting external access information..."
FRONTEND_PORT=$(kubectl get service frontend-service -n campusconnect -o jsonpath='{.spec.ports[0].port}')
BACKEND_PORT=$(kubectl get service backend-service -n campusconnect -o jsonpath='{.spec.ports[0].port}')

echo ""
print_success "🌐 Access your application:"
echo "Frontend: http://localhost:$FRONTEND_PORT"
echo "Backend API: http://localhost:$BACKEND_PORT"

# Port forwarding commands
echo ""
print_status "To access your application locally, run these commands in separate terminals:"
echo "Frontend: kubectl port-forward service/frontend-service 3500:3500 -n campusconnect"
echo "Backend:  kubectl port-forward service/backend-service 5000:5000 -n campusconnect"

echo ""
print_status "To check logs:"
echo "Backend: kubectl logs -l app=backend -n campusconnect -f"
echo "Frontend: kubectl logs -l app=frontend -n campusconnect -f"

echo ""
print_status "To check API health:"
echo "Backend Health: kubectl port-forward service/backend-service 5000:5000 -n campusconnect & curl http://localhost:5000/health"
echo "Frontend Health: kubectl port-forward service/frontend-service 3500:3500 -n campusconnect & curl http://localhost:3500/health"

echo ""
print_status "To delete the deployment:"
echo "kubectl delete namespace campusconnect"

print_success "🚀 Deployment script completed successfully!"