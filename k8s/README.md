# CampusConnect Kubernetes Deployment

This directory contains all the Kubernetes manifests and deployment scripts for the CampusConnect application.

## Architecture

The application consists of:
- **Frontend**: React app (nginx) - Port 3500
- **Backend**: Node.js API server - Port 3800
- **Database**: MongoDB - Port 27017

## Files Structure

```
k8s/
├── namespace.yaml              # Creates campusconnect namespace
├── mongodb-secret.yaml         # MongoDB credentials
├── mongodb-configmap.yaml      # MongoDB configuration & init script
├── mongodb-pvc.yaml           # Persistent volume for MongoDB data
├── mongodb-deployment.yaml     # MongoDB deployment
├── mongodb-service.yaml       # MongoDB service
├── backend-secret.yaml        # Backend secrets (JWT)
├── backend-configmap.yaml     # Backend environment variables
├── backend-deployment.yaml    # Backend API deployment
├── backend-service.yaml       # Backend service (LoadBalancer)
├── frontend-configmap.yaml    # Frontend environment variables
├── frontend-deployment.yaml   # Frontend deployment
├── frontend-service.yaml      # Frontend service (LoadBalancer)
├── network-policy.yaml        # Network security policies
└── README.md                  # This file
```

## Quick Deployment

### Prerequisites
- Docker installed and running
- kubectl installed and configured
- Kubernetes cluster running (Docker Desktop, minikube, etc.)

### Deploy Everything
```bash
# Make the script executable (Linux/Mac)
chmod +x deploy-k8s.sh

# Run the deployment script
./deploy-k8s.sh
```

### Manual Deployment Steps
If you prefer manual deployment:

```bash
# 1. Build Docker images
cd server && docker build -t campusconnect-backend:latest .
cd ../cc && docker build -t campusconnect-frontend:latest .
cd ..

# 2. Create namespace
kubectl apply -f k8s/namespace.yaml

# 3. Deploy secrets and configs
kubectl apply -f k8s/mongodb-secret.yaml
kubectl apply -f k8s/mongodb-configmap.yaml
kubectl apply -f k8s/backend-secret.yaml
kubectl apply -f k8s/backend-configmap.yaml
kubectl apply -f k8s/frontend-configmap.yaml

# 4. Deploy MongoDB
kubectl apply -f k8s/mongodb-pvc.yaml
kubectl apply -f k8s/mongodb-deployment.yaml
kubectl apply -f k8s/mongodb-service.yaml

# 5. Deploy Backend
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

# 6. Deploy Frontend
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

# 7. Apply network policies
kubectl apply -f k8s/network-policy.yaml
```

## Access the Application

### Local Access (Port Forwarding)
```bash
# Frontend
kubectl port-forward service/frontend-service 3500:3500 -n campusconnect

# Backend API
kubectl port-forward service/backend-service 3800:3800 -n campusconnect
```

Then access:
- Frontend: http://localhost:3500
- Backend API: http://localhost:3800

### LoadBalancer Access
If your cluster supports LoadBalancer services, get external IPs:
```bash
kubectl get services -n campusconnect
```

## Monitoring & Troubleshooting

### Check Status
```bash
# All resources
kubectl get all -n campusconnect

# Pods
kubectl get pods -n campusconnect

# Services
kubectl get services -n campusconnect

# Deployments
kubectl get deployments -n campusconnect
```

### View Logs
```bash
# MongoDB logs
kubectl logs -l app=mongodb -n campusconnect

# Backend logs
kubectl logs -l app=backend -n campusconnect

# Frontend logs
kubectl logs -l app=frontend -n campusconnect
```

### Debug Issues
```bash
# Describe a pod
kubectl describe pod <pod-name> -n campusconnect

# Get events
kubectl get events -n campusconnect --sort-by='.lastTimestamp'

# Shell into a pod
kubectl exec -it <pod-name> -n campusconnect -- /bin/sh
```

## Configuration

### Database
- **Username**: admin
- **Password**: password123
- **Database**: campusconnect

### Environment Variables
- Backend configured via `backend-configmap.yaml`
- Frontend configured via `frontend-configmap.yaml`
- Secrets stored in `*-secret.yaml` files

### Resource Limits
- MongoDB: 512Mi-1Gi RAM, 250m-500m CPU
- Backend: 256Mi-512Mi RAM, 250m-500m CPU
- Frontend: 256Mi-512Mi RAM, 250m-500m CPU

## Scaling

### Scale Deployments
```bash
# Scale backend
kubectl scale deployment backend-deployment --replicas=3 -n campusconnect

# Scale frontend
kubectl scale deployment frontend-deployment --replicas=3 -n campusconnect
```

### Horizontal Pod Autoscaler
```bash
# Auto-scale backend based on CPU
kubectl autoscale deployment backend-deployment --cpu-percent=50 --min=2 --max=10 -n campusconnect
```

## Cleanup

### Delete Everything
```bash
kubectl delete namespace campusconnect
```

### Delete Specific Resources
```bash
kubectl delete -f k8s/
```

## Security Features

- Namespace isolation
- Network policies restricting inter-pod communication
- Secrets for sensitive data
- Non-root containers
- Resource limits and requests
- Health checks and readiness probes

## Production Considerations

1. **Storage**: Use proper storage classes for production
2. **Secrets**: Use external secret management (Vault, etc.)
3. **Monitoring**: Add Prometheus/Grafana
4. **Logging**: Add ELK stack or similar
5. **Backup**: Implement MongoDB backup strategy
6. **SSL/TLS**: Add ingress controller with SSL certificates
7. **Security**: Update network policies for production requirements