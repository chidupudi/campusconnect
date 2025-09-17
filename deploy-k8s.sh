#!/bin/bash
# CampusConnect Kubernetes Deployment Script (self-healing)
set -euo pipefail

echo "🚀 Starting CampusConnect Kubernetes Deployment..."

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
print_status(){ echo -e "${BLUE}[INFO]${NC} $1"; }
print_success(){ echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning(){ echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error(){ echo -e "${RED}[ERROR]${NC} $1"; }

command -v kubectl >/dev/null || { print_error "kubectl not found"; exit 1; }
docker info >/dev/null 2>&1 || { print_error "Docker is not running"; exit 1; }
kubectl cluster-info >/dev/null 2>&1 || { print_error "Cannot connect to Kubernetes cluster"; exit 1; }
print_success "✅ Prerequisites check passed"

print_status "Building Docker images..."
pushd server >/dev/null; docker build -t campusconnect-backend:latest .; print_success "Backend image built"; popd >/dev/null
pushd cc >/dev/null; docker build -t campusconnect-frontend:latest .; print_success "Frontend image built"; popd >/dev/null
print_success "✅ All Docker images built successfully"

NS="campusconnect"
BACKEND_SVC="backend-service"
FRONTEND_SVC="frontend-service"
MONGO_DEP="mongodb-deployment"
PVC_NAME="mongodb-pvc"

default_sc(){ kubectl get sc -o jsonpath='{range .items[?(@.metadata.annotations.storageclass\.kubernetes\.io/is-default-class=="true")]}{.metadata.name}{"\n"}{end}'; }
any_sc(){ kubectl get sc -o jsonpath='{.items[0].metadata.name}'; }

ensure_pvc_bound(){
  local sc; sc="$(default_sc)"; [[ -z "$sc" ]] && sc="$(any_sc)"
  [[ -z "$sc" ]] && { print_error "No StorageClass found"; exit 1; }
  print_status "Using StorageClass: ${sc}"
  kubectl delete deploy "$MONGO_DEP" -n "$NS" --ignore-not-found
  kubectl delete pvc "$PVC_NAME" -n "$NS" --ignore-not-found
  cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ${PVC_NAME}
  namespace: ${NS}
spec:
  accessModes: [ "ReadWriteOnce" ]
  storageClassName: ${sc}
  resources:
    requests:
      storage: 1Gi
EOF
  print_status "Waiting for PVC to be Bound..."
  for i in {1..30}; do
    phase="$(kubectl get pvc "$PVC_NAME" -n "$NS" -o jsonpath='{.status.phase}' 2>/dev/null || true)"
    [[ "$phase" == "Bound" ]] && { print_success "PVC is Bound"; return; }
    sleep 2
  done
  print_error "PVC did not become Bound. Run: kubectl describe pvc ${PVC_NAME} -n ${NS}"; exit 1
}

patch_mongo_probes(){
  print_status "Patching MongoDB probes to TCP socket..."
  cat >/tmp/mongo-probe.json <<'JSON'
{
  "spec": {
    "template": {
      "spec": {
        "containers": [{
          "name": "mongodb",
          "readinessProbe": { "tcpSocket": { "port": 27017 }, "initialDelaySeconds": 15, "periodSeconds": 5, "failureThreshold": 10 },
          "livenessProbe":  { "tcpSocket": { "port": 27017 }, "initialDelaySeconds": 30, "periodSeconds": 10, "failureThreshold": 6 }
        }]
      }
    }
  }
}
JSON
  kubectl patch deploy "$MONGO_DEP" -n "$NS" --type=strategic -p "$(cat /tmp/mongo-probe.json)" || true
}

add_wait_initcontainer(){
  print_status "Adding initContainer wait-for-mongo to backend & frontend..."
  cat >/tmp/init-patch.json <<'JSON'
{"spec":{"template":{"spec":{"initContainers":[{"name":"wait-for-mongo","image":"busybox:1.36","command":["sh","-c","until nc -z mongodb-service 27017; do echo waiting for mongodb; sleep 2; done"]}]}}}}
JSON
  kubectl patch deploy backend-deployment -n "$NS" --type='strategic' -p "$(cat /tmp/init-patch.json)" || true
  kubectl patch deploy frontend-deployment -n "$NS" --type='strategic' -p "$(cat /tmp/init-patch.json)" || true
}

patch_services_nodeport(){
  print_status "Patching services to NodePort (no external LB needed)..."
  cat >/tmp/svc-backend.json <<'JSON'
{"spec":{"type":"NodePort","ports":[{"port":3800,"targetPort":3800,"nodePort":30800}]}}
JSON
  kubectl patch svc "$BACKEND_SVC" -n "$NS" --type=merge -p "$(cat /tmp/svc-backend.json)" || true
  cat >/tmp/svc-frontend.json <<'JSON'
{"spec":{"type":"NodePort","ports":[{"port":3500,"targetPort":3500,"nodePort":30500}]}}
JSON
  kubectl patch svc "$FRONTEND_SVC" -n "$NS" --type=merge -p "$(cat /tmp/svc-frontend.json)" || true
}

wait_ready_selector(){ local label="$1"; print_status "Waiting for pods ($label) to be Ready..."; kubectl wait --for=condition=ready pod -l "$label" -n "$NS" --timeout=300s; }

print_status "Deploying to Kubernetes..."
kubectl apply -f k8s/namespace.yaml; print_success "Namespace ensured"

print_status "Applying secrets/configmaps..."
kubectl apply -f k8s/mongodb-secret.yaml
kubectl apply -f k8s/mongodb-configmap.yaml
kubectl apply -f k8s/backend-secret.yaml
kubectl apply -f k8s/backend-configmap.yaml
kubectl apply -f k8s/frontend-configmap.yaml
print_success "Secrets/ConfigMaps applied"

ensure_pvc_bound

print_status "Deploying MongoDB..."
kubectl apply -f k8s/mongodb-deployment.yaml
kubectl apply -f k8s/mongodb-service.yaml
patch_mongo_probes
kubectl rollout restart deploy "$MONGO_DEP" -n "$NS" || true
wait_ready_selector "app=mongodb"; print_success "MongoDB is ready"

print_status "Deploying Backend & Frontend..."
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

add_wait_initcontainer
kubectl rollout restart deploy backend-deployment -n "$NS" || true
kubectl rollout restart deploy frontend-deployment -n "$NS" || true

patch_services_nodeport

wait_ready_selector "app=backend" || print_warning "Backend may still be warming up"
wait_ready_selector "app=frontend" || print_warning "Frontend may still be warming up"

print_status "Applying network policies..."
kubectl apply -f k8s/network-policy.yaml || print_warning "NetworkPolicy apply skipped/failed"

print_success "🎉 CampusConnect deployment completed!"

print_status "=== SERVICE ENDPOINTS ==="; kubectl get svc -n "$NS"
print_status "=== POD STATUS ==="; kubectl get pods -n "$NS"
print_status "=== DEPLOYMENT STATUS ==="; kubectl get deploy -n "$NS"

print_success "🌐 Access locally:"; echo "Frontend: http://localhost:30500"; echo "Backend : http://localhost:30800/api/health"

print_status "Logs commands:"; echo "MongoDB: kubectl logs -l app=mongodb -n $NS --tail=100"; echo "Backend: kubectl logs -l app=backend -n $NS --tail=100"; echo "Frontend: kubectl logs -l app=frontend -n $NS --tail=100"

print_success "🚀 Done."
