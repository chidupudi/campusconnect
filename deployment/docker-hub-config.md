# 🐳 Docker Hub Configuration Template

## **Replace Placeholders**

After setting up Docker Hub, update these files with your actual username:

### **1. GitHub Actions Workflow**
File: `.github/workflows/ci-cd.yml`

```yaml
# Replace YOUR-USERNAME with your actual Docker Hub username
env:
  DOCKER_HUB_USERNAME: ${{ secrets.DOCKER_HUB_USERNAME }}
  IMAGE_FRONTEND: campusconnect-frontend  # Will become: YOUR-USERNAME/campusconnect-frontend
  IMAGE_BACKEND: campusconnect-backend    # Will become: YOUR-USERNAME/campusconnect-backend
```

### **2. Jenkins Pipeline**
File: `jenkins/Jenkinsfile`

```groovy
// Replace YOUR-USERNAME with your actual Docker Hub username
IMAGE_FRONTEND = "${DOCKER_HUB_USERNAME}/campusconnect-frontend"
IMAGE_BACKEND = "${DOCKER_HUB_USERNAME}/campusconnect-backend"
```

### **3. Kubernetes Manifests**
The workflow will automatically replace `IMAGE_BACKEND` and `IMAGE_FRONTEND` placeholders with:
- `YOUR-USERNAME/campusconnect-backend:latest`
- `YOUR-USERNAME/campusconnect-frontend:latest`

## **Your Docker Hub Repositories**

After setup, your repositories will be:
- Frontend: `https://hub.docker.com/r/YOUR-USERNAME/campusconnect-frontend`
- Backend: `https://hub.docker.com/r/YOUR-USERNAME/campusconnect-backend`

## **GitHub Secrets Required**

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `DOCKER_HUB_USERNAME` | `your-username` | Your Docker Hub username |
| `DOCKER_HUB_ACCESS_TOKEN` | `dckr_pat_...` | Your Docker Hub access token |

## **Verification Commands**

```bash
# Test local Docker login
docker login
# Enter username and ACCESS TOKEN (not password)

# Test repository access
docker pull YOUR-USERNAME/campusconnect-frontend:latest
docker pull YOUR-USERNAME/campusconnect-backend:latest

# Test push (after building locally)
docker build -t YOUR-USERNAME/campusconnect-frontend:test ./cc
docker push YOUR-USERNAME/campusconnect-frontend:test
```

## **Security Notes**

1. **Never commit Docker Hub credentials** to git
2. **Use access tokens**, not passwords
3. **Limit token permissions** to what's needed
4. **Rotate tokens regularly** (every 90 days)
5. **Use private repositories** for sensitive applications

## **Troubleshooting**

### **Authentication Failed**
- Check username is correct
- Ensure you're using ACCESS TOKEN, not password
- Verify token has correct permissions

### **Repository Not Found**
- Verify repository names match exactly
- Check repository visibility (public vs private)
- Ensure repositories exist on Docker Hub

### **Push Denied**
- Check token permissions include "Write"
- Verify you own the repositories
- Check Docker Hub rate limits

## **Example Complete Workflow**

```yaml
# Example with actual username (replace 'johndoe' with yours)
name: CI/CD Pipeline
env:
  DOCKER_HUB_USERNAME: ${{ secrets.DOCKER_HUB_USERNAME }}
  IMAGE_FRONTEND: campusconnect-frontend
  IMAGE_BACKEND: campusconnect-backend

jobs:
  build-and-push:
    steps:
    - name: Login to Docker Hub
      uses: docker/login-action@v3
      with:
        username: ${{ secrets.DOCKER_HUB_USERNAME }}
        password: ${{ secrets.DOCKER_HUB_ACCESS_TOKEN }}

    - name: Build and push frontend
      uses: docker/build-push-action@v5
      with:
        context: ./cc
        push: true
        tags: ${{ env.DOCKER_HUB_USERNAME }}/${{ env.IMAGE_FRONTEND }}:latest
```

---

Once you complete the Docker Hub setup, your CI/CD pipeline will automatically build and push images to your repositories! 🚀