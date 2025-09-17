# 🏗️ GCP Artifact Registry Setup Guide

## **Why Artifact Registry over Docker Hub?**

✅ **Better Integration** - Native GCP service integration
✅ **Lower Latency** - Images stored in Mumbai region
✅ **Enhanced Security** - IAM-based access control
✅ **Cost Effective** - No pull rate limits
✅ **Regional Storage** - Data stays in India
✅ **Vulnerability Scanning** - Built-in security scanning

## **Prerequisites**

### **1. Enable Artifact Registry API**
```bash
gcloud services enable artifactregistry.googleapis.com
```

### **2. Set Default Project and Region**
```bash
gcloud config set project campusconnect-project
gcloud config set artifacts/location asia-south1
```

## **Manual Setup (One-time)**

### **Step 1: Create Artifact Registry Repository**
```bash
# Create repository for Docker images
gcloud artifacts repositories create campusconnect-repo \
    --repository-format=docker \
    --location=asia-south1 \
    --description="CampusConnect application container images"
```

### **Step 2: Configure Docker Authentication**
```bash
# Configure Docker to use gcloud for authentication
gcloud auth configure-docker asia-south1-docker.pkg.dev
```

### **Step 3: Test Local Build and Push**
```bash
# Build images with Artifact Registry tags
PROJECT_ID="campusconnect-project"
LOCATION="asia-south1"
REPOSITORY="campusconnect-repo"

# Backend image
docker build -t asia-south1-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/campusconnect-backend:latest ./server
docker push asia-south1-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/campusconnect-backend:latest

# Frontend image
docker build -t asia-south1-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/campusconnect-frontend:latest ./cc
docker push asia-south1-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/campusconnect-frontend:latest
```

## **Service Account Permissions**

### **Required IAM Roles for CI/CD**
```bash
# Add Artifact Registry permissions to service account
gcloud projects add-iam-policy-binding campusconnect-project \
    --member="serviceAccount:github-actions@campusconnect-project.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding campusconnect-project \
    --member="serviceAccount:github-actions@campusconnect-project.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.reader"
```

## **GitHub Secrets Configuration**

**Required Secrets** (no Docker Hub secrets needed anymore):
| Secret Name | Value | Description |
|-------------|-------|-------------|
| `GCP_PROJECT_ID` | `campusconnect-project` | Your GCP project ID |
| `GCP_SA_KEY` | `{entire service account JSON}` | Service account key |

**Remove these old secrets:**
- ~~`DOCKER_HUB_USERNAME`~~
- ~~`DOCKER_HUB_ACCESS_TOKEN`~~

## **Image URLs Format**

### **Artifact Registry Image URLs**
```
asia-south1-docker.pkg.dev/campusconnect-project/campusconnect-repo/campusconnect-backend:latest
asia-south1-docker.pkg.dev/campusconnect-project/campusconnect-repo/campusconnect-frontend:latest
```

### **GitHub Actions Environment Variables**
```yaml
env:
  PROJECT_ID: campusconnect-project
  GAR_LOCATION: asia-south1
  GAR_REPOSITORY: campusconnect-repo
  IMAGE_BACKEND: campusconnect-backend
  IMAGE_FRONTEND: campusconnect-frontend
```

## **Pipeline Flow**

### **Updated CI/CD Flow**
```
GitHub Push → Tests → Build Images → Push to Artifact Registry → Deploy to GKE → Live App
```

### **Image Tagging Strategy**
- **Latest**: `latest` tag for stable releases
- **Commit SHA**: `$GITHUB_SHA` for specific builds
- **Branch**: `main-$GITHUB_SHA` for branch-specific builds

## **Artifact Registry Features**

### **1. Vulnerability Scanning**
```bash
# Enable vulnerability scanning
gcloud container images scan IMAGE_URL

# View scan results
gcloud container images list-tags asia-south1-docker.pkg.dev/campusconnect-project/campusconnect-repo/campusconnect-backend \
    --format="table(digest,tags,timestamp)"
```

### **2. Access Control**
```bash
# Grant specific users access to repository
gcloud artifacts repositories add-iam-policy-binding campusconnect-repo \
    --location=asia-south1 \
    --member="user:developer@company.com" \
    --role="roles/artifactregistry.reader"
```

### **3. Cleanup Policies**
```bash
# Create cleanup policy to remove old images
gcloud artifacts repositories set-cleanup-policy campusconnect-repo \
    --location=asia-south1 \
    --policy=cleanup-policy.json
```

**cleanup-policy.json:**
```json
{
  "rules": [
    {
      "name": "keep-recent-versions",
      "action": "KEEP",
      "mostRecentVersions": {
        "keepCount": 10
      }
    },
    {
      "name": "delete-old-untagged",
      "action": "DELETE",
      "condition": {
        "olderThan": "30d",
        "tagState": "UNTAGGED"
      }
    }
  ]
}
```

## **Cost Management**

### **Artifact Registry Pricing (Mumbai Region)**
- **Storage**: ₹0.10 per GB per month
- **Egress**: ₹8.00 per GB (to internet)
- **Operations**: Free for first 0.5GB storage

**Estimated Costs:**
- **Images**: ~100MB each = ₹0.02/month storage
- **Egress**: Minimal within GCP
- **Total**: ~₹5-10/month

### **Cost Optimization**
1. **Cleanup old images** automatically
2. **Use multi-stage builds** to reduce image size
3. **Compress layers** efficiently
4. **Delete unused tags** regularly

## **Monitoring & Logging**

### **View Repository Activity**
```bash
# List all images
gcloud artifacts docker images list asia-south1-docker.pkg.dev/campusconnect-project/campusconnect-repo

# View image details
gcloud artifacts docker images describe IMAGE_URL
```

### **Audit Logs**
```bash
# View Artifact Registry audit logs
gcloud logging read 'resource.type="artifact_registry"' --limit=50
```

## **Troubleshooting**

### **Authentication Issues**
```bash
# Re-configure Docker authentication
gcloud auth configure-docker asia-south1-docker.pkg.dev

# Check current authentication
gcloud auth list

# Login if needed
gcloud auth login
```

### **Push Permission Denied**
```bash
# Check IAM permissions
gcloud projects get-iam-policy campusconnect-project

# Add missing permissions
gcloud projects add-iam-policy-binding campusconnect-project \
    --member="user:your-email@gmail.com" \
    --role="roles/artifactregistry.writer"
```

### **Repository Not Found**
```bash
# List repositories
gcloud artifacts repositories list --location=asia-south1

# Create if missing
gcloud artifacts repositories create campusconnect-repo \
    --repository-format=docker \
    --location=asia-south1
```

## **Security Best Practices**

### **1. Least Privilege Access**
- Grant minimum required permissions
- Use service accounts for automation
- Regular audit of IAM bindings

### **2. Image Security**
- Enable vulnerability scanning
- Use minimal base images
- Scan images before deployment

### **3. Network Security**
- Use private endpoints when possible
- Restrict egress from GKE to registry
- Monitor access logs

## **Migration from Docker Hub**

### **Quick Migration Steps**
1. **✅ Update GitHub Actions workflow** - Already done
2. **✅ Update Jenkins pipeline** - Already done
3. **Create Artifact Registry repository**
4. **Update GitHub secrets**
5. **Test pipeline**
6. **Delete old Docker Hub repositories** (optional)

### **Rollback Plan**
If needed, you can quickly rollback to Docker Hub by:
1. Reverting workflow files
2. Re-adding Docker Hub secrets
3. Pushing to GitHub

---

🏗️ **Your CampusConnect application now uses GCP Artifact Registry for better integration and performance!**