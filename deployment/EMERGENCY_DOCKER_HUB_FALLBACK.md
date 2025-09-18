# 🚨 Emergency Docker Hub Fallback

If you need to get your pipeline working immediately while fixing Artifact Registry, here's a quick fallback to Docker Hub:

## **Quick Switch to Docker Hub**

### **1. Revert GitHub Actions Workflow**

Replace the build-and-push section in `.github/workflows/ci-cd.yml`:

```yaml
  build-and-push:
    name: Build and Push to Docker Hub
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Login to Docker Hub
      uses: docker/login-action@v3
      with:
        username: ${{ secrets.DOCKER_HUB_USERNAME }}
        password: ${{ secrets.DOCKER_HUB_ACCESS_TOKEN }}

    - name: Build and push backend image
      uses: docker/build-push-action@v5
      with:
        context: ./server
        file: ./server/Dockerfile
        push: true
        tags: ${{ secrets.DOCKER_HUB_USERNAME }}/campusconnect-backend:latest

    - name: Build and push frontend image
      uses: docker/build-push-action@v5
      with:
        context: ./cc
        file: ./cc/Dockerfile
        push: true
        tags: ${{ secrets.DOCKER_HUB_USERNAME }}/campusconnect-frontend:latest
```

### **2. Add Docker Hub Secrets**

Add these to GitHub → Settings → Secrets:
- `DOCKER_HUB_USERNAME`: your Docker Hub username
- `DOCKER_HUB_ACCESS_TOKEN`: your Docker Hub access token

### **3. Update Deployment Section**

```yaml
    - name: Deploy to GKE
      run: |-
        # Replace image names in deployment files
        cd k8s
        sed -i "s|IMAGE_BACKEND|${{ secrets.DOCKER_HUB_USERNAME }}/campusconnect-backend:latest|g" backend-deployment.yaml
        sed -i "s|IMAGE_FRONTEND|${{ secrets.DOCKER_HUB_USERNAME }}/campusconnect-frontend:latest|g" frontend-deployment.yaml

        # Apply manifests
        kubectl apply -f namespace.yaml
        kubectl apply -f mongodb-secret.yaml
        kubectl apply -f mongodb-deployment.yaml
        kubectl apply -f mongodb-service.yaml
        kubectl apply -f backend-configmap.yaml
        kubectl apply -f backend-deployment.yaml
        kubectl apply -f backend-service.yaml
        kubectl apply -f frontend-configmap.yaml
        kubectl apply -f frontend-deployment.yaml
        kubectl apply -f frontend-service.yaml
```

This will get your pipeline working immediately with Docker Hub while you fix the Artifact Registry issue.