# 🚀 CampusConnect CI/CD Deployment Checklist

## **Pre-Deployment Setup**

### ✅ **1. GitHub Repository Setup**
- [ ] Push code to GitHub repository
- [ ] Ensure main branch is protected
- [ ] Add collaborators if needed

### ✅ **2. GCP Artifact Registry Setup**
- [ ] Enable Artifact Registry API: `gcloud services enable artifactregistry.googleapis.com`
- [ ] Create repository:
  ```bash
  gcloud artifacts repositories create campusconnect-repo \
    --repository-format=docker \
    --location=asia-south1 \
    --description="CampusConnect application images"
  ```
- [ ] Configure Docker authentication: `gcloud auth configure-docker asia-south1-docker.pkg.dev`

### ✅ **3. Google Cloud Platform Setup**
```bash
# 1. Create GCP Project
gcloud projects create campusconnect-project --name="CampusConnect"
gcloud config set project campusconnect-project

# 2. Enable required APIs
gcloud services enable container.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# 3. Create GKE Cluster in Mumbai region
gcloud container clusters create campusconnect-cluster \
  --zone=asia-south1-a \
  --machine-type=e2-medium \
  --num-nodes=3 \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=5

# 4. Create Service Account
gcloud iam service-accounts create github-actions \
  --description="GitHub Actions Service Account"

# 5. Add IAM roles
gcloud projects add-iam-policy-binding campusconnect-project \
  --member="serviceAccount:github-actions@campusconnect-project.iam.gserviceaccount.com" \
  --role="roles/container.developer"

gcloud projects add-iam-policy-binding campusconnect-project \
  --member="serviceAccount:github-actions@campusconnect-project.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# 6. Generate service account key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@campusconnect-project.iam.gserviceaccount.com
```

### ✅ **4. GitHub Secrets Configuration**
Go to GitHub Repository → Settings → Secrets and variables → Actions

Add these secrets:
- [ ] `GCP_PROJECT_ID` = campusconnect-project
- [ ] `GCP_SA_KEY` = contents of key.json file (entire JSON)

**Note:** No Docker Hub secrets needed anymore! ✅

### ✅ **5. Environment Variables**
Update production secrets:
```bash
# Encode MongoDB connection string
echo -n "mongodb+srv://username:password@cluster.mongodb.net/campusconnect" | base64

# Encode JWT secret
echo -n "your-production-jwt-secret-here" | base64
```
- [ ] Update `k8s/mongodb-secret.yaml` with encoded values

## **Deployment Options**

### 🔄 **Option 1: GitHub Actions (Recommended)**

**Trigger:** Push to main branch

**Pipeline Flow:**
```
GitHub Push → Tests → Docker Build → Artifact Registry → GKE Deploy → Live
```

**Steps:**
1. [ ] Commit and push to main branch
2. [ ] Monitor GitHub Actions tab
3. [ ] Wait for pipeline completion (~10-15 minutes)
4. [ ] Get external IP: `kubectl get services frontend-service -n campusconnect`

### 🔄 **Option 2: Jenkins Pipeline**

**Setup Jenkins:**
```bash
cd jenkins
docker-compose up -d
```

**Jenkins Configuration:**
1. [ ] Access Jenkins at `http://localhost:8080`
2. [ ] Install required plugins:
   - Docker Pipeline
   - Google Kubernetes Engine
   - GitHub Integration
3. [ ] Add credentials:
   - [ ] Docker Hub credentials (ID: `dockerhub-credentials`)
   - [ ] GCP service account (ID: `gcp-service-account`)
4. [ ] Create pipeline job using `jenkins/Jenkinsfile`

## **Manual Deployment (Emergency)**

```bash
# 1. Build and push images manually
docker build -t your-username/campusconnect-backend:latest ./server
docker build -t your-username/campusconnect-frontend:latest ./cc

docker push your-username/campusconnect-backend:latest
docker push your-username/campusconnect-frontend:latest

# 2. Update Kubernetes manifests
cd k8s
sed -i "s|IMAGE_BACKEND|your-username/campusconnect-backend:latest|g" backend-deployment.yaml
sed -i "s|IMAGE_FRONTEND|your-username/campusconnect-frontend:latest|g" frontend-deployment.yaml

# 3. Deploy to GKE
kubectl apply -f namespace.yaml
kubectl apply -f mongodb-secret.yaml
kubectl apply -f mongodb-deployment.yaml
kubectl apply -f backend-configmap.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f frontend-configmap.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

# 4. Monitor deployment
kubectl rollout status deployment/backend-deployment -n campusconnect
kubectl rollout status deployment/frontend-deployment -n campusconnect
```

## **Post-Deployment Verification**

### ✅ **1. Check Cluster Status**
```bash
kubectl get all -n campusconnect
```

Expected output:
- [ ] 2 backend pods running
- [ ] 2 frontend pods running
- [ ] All services active
- [ ] LoadBalancer has external IP

### ✅ **2. Health Checks**
```bash
# Get external IP
EXTERNAL_IP=$(kubectl get service frontend-service -n campusconnect -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Test endpoints
curl http://$EXTERNAL_IP:3700/health
curl http://$EXTERNAL_IP:3700/api/health
```

### ✅ **3. Application Testing**
- [ ] Access frontend: `http://EXTERNAL_IP:3700`
- [ ] Test student registration
- [ ] Test club registration
- [ ] Test admin login
- [ ] Verify database connectivity

### ✅ **4. Monitoring Setup**
```bash
# Check logs
kubectl logs -f deployment/backend-deployment -n campusconnect
kubectl logs -f deployment/frontend-deployment -n campusconnect

# Check resource usage
kubectl top pods -n campusconnect
kubectl top nodes
```

## **Production Optimizations**

### ✅ **Security**
- [ ] Enable network policies
- [ ] Use HTTPS/TLS certificates
- [ ] Implement proper RBAC
- [ ] Scan images for vulnerabilities

### ✅ **Performance**
- [ ] Configure HPA (Horizontal Pod Autoscaler)
- [ ] Set up cluster autoscaling
- [ ] Configure resource requests/limits
- [ ] Enable caching

### ✅ **Monitoring**
- [ ] Set up Google Cloud Monitoring
- [ ] Configure alerting
- [ ] Set up log aggregation
- [ ] Monitor costs

## **Troubleshooting Guide**

### 🔧 **Common Issues**

**Pipeline Fails:**
- [ ] Check GitHub secrets are correct
- [ ] Verify Docker Hub credentials
- [ ] Check GCP service account permissions

**Pods Not Starting:**
```bash
kubectl describe pods -n campusconnect
kubectl logs <pod-name> -n campusconnect
```

**LoadBalancer No External IP:**
```bash
kubectl describe service frontend-service -n campusconnect
# Wait 5-10 minutes for GCP to assign IP
```

**Database Connection Issues:**
- [ ] Verify MongoDB Atlas connection string
- [ ] Check network connectivity
- [ ] Verify secrets are properly encoded

## **Success Criteria**

✅ **Deployment Complete When:**
- [ ] Pipeline runs successfully
- [ ] All pods are running
- [ ] External IP is assigned
- [ ] Application is accessible
- [ ] Database connections work
- [ ] All tests pass

## **URLs & Access Points**

After successful deployment:

- **Application:** `http://EXTERNAL_IP:3700`
- **API Health:** `http://EXTERNAL_IP:3700/api/health`
- **GitHub Actions:** `https://github.com/your-username/campusconnect/actions`
- **GCP Console:** `https://console.cloud.google.com/kubernetes/clusters`
- **Docker Hub:** `https://hub.docker.com/repositories`

## **Cost Management**

- **GKE Cluster:** ~$100-200/month (3 e2-medium nodes)
- **LoadBalancer:** ~$18/month
- **Total Estimated:** ~$120-220/month

**Cost Optimization:**
- [ ] Use preemptible nodes for dev/staging
- [ ] Scale down during off-hours
- [ ] Monitor usage with budget alerts

---

🎉 **Your CampusConnect application is now production-ready with a complete CI/CD pipeline!**