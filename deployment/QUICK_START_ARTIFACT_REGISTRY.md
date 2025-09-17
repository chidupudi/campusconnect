# 🚀 Quick Start with GCP Artifact Registry

## **One-Command Setup**

```bash
# Run this single command to set everything up
./scripts/setup-artifact-registry.sh
```

## **Manual Quick Setup**

### **1. Enable APIs and Create Repository**
```bash
# Set project
gcloud config set project campusconnect-project

# Enable API
gcloud services enable artifactregistry.googleapis.com

# Create repository
gcloud artifacts repositories create campusconnect-repo \
  --repository-format=docker \
  --location=asia-south1 \
  --description="CampusConnect container images"

# Configure Docker
gcloud auth configure-docker asia-south1-docker.pkg.dev
```

### **2. Test Local Build and Push**
```bash
# Set variables
PROJECT_ID="campusconnect-project"
REPO="campusconnect-repo"
LOCATION="asia-south1"

# Build and push backend
docker build -t ${LOCATION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/campusconnect-backend:latest ./server
docker push ${LOCATION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/campusconnect-backend:latest

# Build and push frontend
docker build -t ${LOCATION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/campusconnect-frontend:latest ./cc
docker push ${LOCATION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/campusconnect-frontend:latest
```

### **3. GitHub Secrets (Required)**
| Secret | Value |
|--------|-------|
| `GCP_PROJECT_ID` | `campusconnect-project` |
| `GCP_SA_KEY` | `{service account JSON}` |

### **4. Deploy via GitHub Actions**
```bash
git add .
git commit -m "Switch to Artifact Registry"
git push origin main
```

## **Verification Commands**

```bash
# List repositories
gcloud artifacts repositories list --location=asia-south1

# List images
gcloud artifacts docker images list asia-south1-docker.pkg.dev/campusconnect-project/campusconnect-repo

# View specific image
gcloud artifacts docker images describe \
  asia-south1-docker.pkg.dev/campusconnect-project/campusconnect-repo/campusconnect-backend:latest
```

## **Your Image URLs**

After setup, your images will be at:
- **Backend**: `asia-south1-docker.pkg.dev/campusconnect-project/campusconnect-repo/campusconnect-backend:latest`
- **Frontend**: `asia-south1-docker.pkg.dev/campusconnect-project/campusconnect-repo/campusconnect-frontend:latest`

## **Benefits You Get**

✅ **No Rate Limits** - Unlike Docker Hub
✅ **Better Security** - IAM-based access control
✅ **Lower Latency** - Mumbai region storage
✅ **Cost Effective** - Pay only for storage used
✅ **Vulnerability Scanning** - Built-in security
✅ **Native GCP Integration** - Seamless with GKE

---

**Ready to deploy!** Your pipeline will now use Artifact Registry for better performance and security. 🏗️