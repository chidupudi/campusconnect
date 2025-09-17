# 🚀 Complete CI/CD Pipeline Setup for GKE

## **Pipeline Flow**
```
GitHub Commit → GitHub Actions → Tests → Docker Build → Docker Hub → GKE Deploy → LoadBalancer → Live App
```

## **Prerequisites**

### 1. **Docker Hub Account**
- Create account at https://hub.docker.com
- Create repositories:
  - `your-username/campusconnect-frontend`
  - `your-username/campusconnect-backend`

### 2. **Google Cloud Platform Setup**
```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Create project
gcloud projects create campusconnect-project --name="CampusConnect"
gcloud config set project campusconnect-project

# Enable APIs
gcloud services enable container.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Create GKE cluster in Mumbai region
gcloud container clusters create campusconnect-cluster \
  --zone=asia-south1-a \
  --machine-type=e2-medium \
  --num-nodes=3 \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=5 \
  --enable-autorepair \
  --enable-autoupgrade

# Get credentials
gcloud container clusters get-credentials campusconnect-cluster --zone=asia-south1-a
```

### 3. **Service Account for GitHub Actions**
```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --description="Service account for GitHub Actions" \
  --display-name="GitHub Actions"

# Add roles
gcloud projects add-iam-policy-binding campusconnect-project \
  --member="serviceAccount:github-actions@campusconnect-project.iam.gserviceaccount.com" \
  --role="roles/container.developer"

gcloud projects add-iam-policy-binding campusconnect-project \
  --member="serviceAccount:github-actions@campusconnect-project.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Create and download key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@campusconnect-project.iam.gserviceaccount.com
```

## **GitHub Secrets Configuration**

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

```
DOCKER_HUB_USERNAME=your-dockerhub-username
DOCKER_HUB_ACCESS_TOKEN=your-dockerhub-access-token
GCP_PROJECT_ID=campusconnect-project
GCP_SA_KEY=<contents-of-key.json-file>
```

## **Environment Variables Update**

Update your production environment variables in the Kubernetes secrets:

```bash
# Encode your MongoDB Atlas connection string
echo -n "mongodb+srv://username:password@cluster.mongodb.net/campusconnect" | base64

# Encode JWT secret
echo -n "your-production-jwt-secret" | base64

# Update k8s/mongodb-secret.yaml with the encoded values
```

## **Deployment Steps**

### 1. **Push to GitHub**
```bash
git add .
git commit -m "Setup CI/CD pipeline"
git push origin main
```

### 2. **Monitor Pipeline**
- Go to GitHub Actions tab
- Watch the pipeline execute:
  - ✅ Tests run
  - ✅ Docker images build
  - ✅ Images push to Docker Hub
  - ✅ Deploy to GKE

### 3. **Get External IP**
```bash
kubectl get services frontend-service -n campusconnect
```

### 4. **Access Application**
```
http://<EXTERNAL-IP>:3700
```

## **Pipeline Features**

### ✅ **Automated Testing**
- Frontend and backend unit tests
- Code linting
- Test coverage reports

### ✅ **Docker Multi-Stage Builds**
- Optimized image sizes
- Security scanning
- Layer caching

### ✅ **Kubernetes Deployment**
- Rolling updates with zero downtime
- Health checks and readiness probes
- Resource limits and requests
- Horizontal Pod Autoscaling ready

### ✅ **Production Ready**
- LoadBalancer for external access
- Namespace isolation
- Secret management
- MongoDB Atlas integration

## **Monitoring & Troubleshooting**

### Check Pipeline Status
```bash
# Check GitHub Actions
# Go to: https://github.com/your-username/campusconnect/actions

# Check Kubernetes pods
kubectl get pods -n campusconnect

# Check services
kubectl get services -n campusconnect

# Check logs
kubectl logs -f deployment/backend-deployment -n campusconnect
kubectl logs -f deployment/frontend-deployment -n campusconnect
```

### Common Issues

1. **Image Pull Errors**
   - Verify Docker Hub credentials
   - Check image names in deployment files

2. **Pod Startup Issues**
   - Check resource limits
   - Verify environment variables
   - Check health probe configurations

3. **Service Connection Issues**
   - Verify service names and ports
   - Check network policies
   - Verify LoadBalancer external IP

## **Security Best Practices**

1. **Secrets Management**
   - Never commit secrets to git
   - Use Kubernetes secrets
   - Rotate secrets regularly

2. **Image Security**
   - Use official base images
   - Scan images for vulnerabilities
   - Use minimal base images

3. **Network Security**
   - Use network policies
   - Limit ingress/egress traffic
   - Use TLS for external connections

## **Scaling & Performance**

### Horizontal Pod Autoscaler
```bash
# Enable HPA for backend
kubectl autoscale deployment backend-deployment \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n campusconnect

# Enable HPA for frontend
kubectl autoscale deployment frontend-deployment \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n campusconnect
```

### Cluster Autoscaling
```bash
# Already enabled during cluster creation
# Will automatically add/remove nodes based on demand
```

## **Cost Optimization**

1. **Use Preemptible Nodes** (for dev/staging)
2. **Right-size Resources**
3. **Monitor Usage** with Google Cloud Monitoring
4. **Set Budget Alerts**

Your CampusConnect application is now production-ready with a complete CI/CD pipeline! 🎉