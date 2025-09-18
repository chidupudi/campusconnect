# CampusConnect - 3-Tier Application

A full-stack campus management system built with React, Node.js, and MongoDB Atlas.

## Architecture

### 3-Tier Architecture
- **Presentation Tier (Frontend)**: React.js application served by Nginx
- **Application Tier (Backend)**: Node.js/Express.js API server
- **Data Tier**: MongoDB Atlas (Cloud Database)

## Technologies Used

- **Frontend**: React.js, Material-UI, Nginx
- **Backend**: Node.js, Express.js, JWT Authentication
- **Database**: MongoDB Atlas (Cloud)
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Authentication**: JWT (JSON Web Tokens)

## Prerequisites

- Docker & Docker Compose
- Kubernetes cluster (minikube, Docker Desktop, etc.)
- kubectl CLI tool
- Node.js (for local development)

## Configuration

### MongoDB Atlas Setup
The application is configured to use MongoDB Atlas with the following connection string:
```
mongodb+srv://druthi:druthi%402004@devops-cc.w5sl0nw.mongodb.net/campusconnect?retryWrites=true&w=majority&appName=devops-cc
```

### Port Configuration
- **Frontend**: Port 3500 (Nginx)
- **Backend**: Port 5000 (Node.js)
- **Database**: MongoDB Atlas (Cloud)

## Deployment

### Local Development

1. **Backend Development**:
   ```bash
   cd server
   npm install
   npm run dev
   ```

2. **Frontend Development**:
   ```bash
   cd cc
   npm install
   npm start
   ```

3. **Test APIs**:
   ```bash
   cd server
   npm run test-apis
   ```

### Docker Deployment

1. **Build Images**:
   ```bash
   # Backend
   cd server
   docker build -t campusconnect-backend:latest .

   # Frontend
   cd ../cc
   docker build -t campusconnect-frontend:latest .
   ```

2. **Run with Docker Compose** (if available):
   ```bash
   docker-compose up -d
   ```

### Kubernetes Deployment

1. **Deploy using the automated script**:
   ```bash
   chmod +x deploy-k8s.sh
   ./deploy-k8s.sh
   ```

2. **Manual Deployment**:
   ```bash
   # Create namespace
   kubectl apply -f k8s/namespace.yaml

   # Deploy secrets and configmaps
   kubectl apply -f k8s/backend-secret.yaml
   kubectl apply -f k8s/backend-configmap.yaml
   kubectl apply -f k8s/frontend-configmap.yaml

   # Deploy backend
   kubectl apply -f k8s/backend-deployment.yaml
   kubectl apply -f k8s/backend-service.yaml

   # Deploy frontend
   kubectl apply -f k8s/frontend-deployment.yaml
   kubectl apply -f k8s/frontend-service.yaml

   # Apply network policies
   kubectl apply -f k8s/network-policy.yaml
   ```

3. **Access the Application**:
   ```bash
   # Port forwarding
   kubectl port-forward service/frontend-service 3500:3500 -n campusconnect
   kubectl port-forward service/backend-service 5000:5000 -n campusconnect
   ```

## API Endpoints

### Student Endpoints
- `POST /api/students/signup` - Student registration
- `POST /api/students/login` - Student login
- `GET /api/students/profile` - Get student profile
- `PUT /api/students/profile` - Update student profile

### Club Endpoints
- `GET /api/clubs` - Get all clubs
- `POST /api/clubs` - Create new club
- `GET /api/clubs/:id` - Get club details

### Admin Endpoints
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Admin dashboard

### Event Endpoints
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event

## Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://druthi:druthi%402004@devops-cc.w5sl0nw.mongodb.net/campusconnect?retryWrites=true&w=majority&appName=devops-cc
JWT_SECRET=your-secret-key
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_NODE_ENV=production
```

## Monitoring & Logging

### Check Logs
```bash
# Backend logs
kubectl logs -l app=backend -n campusconnect -f

# Frontend logs
kubectl logs -l app=frontend -n campusconnect -f
```

### Health Checks
```bash
# Backend health
curl http://localhost:5000/health

# Frontend health
curl http://localhost:3500/health
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Security headers in Nginx
- Non-root user in Docker containers
- Kubernetes network policies

## Database Schema

### Student Schema
```javascript
{
  name: String (required),
  email: String (required, unique),
  course: String (required),
  password: String (required, hashed)
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Verify MongoDB Atlas connection string
   - Check network connectivity
   - Ensure IP whitelist includes your deployment environment

2. **Port Conflicts**:
   - Frontend: Port 3500
   - Backend: Port 5000
   - Ensure these ports are available

3. **Kubernetes Issues**:
   - Check pod status: `kubectl get pods -n campusconnect`
   - Check service status: `kubectl get services -n campusconnect`
   - Check logs: `kubectl logs <pod-name> -n campusconnect`

### Cleanup
```bash
# Delete entire deployment
kubectl delete namespace campusconnect

# Remove Docker images
docker rmi campusconnect-backend:latest campusconnect-frontend:latest
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.