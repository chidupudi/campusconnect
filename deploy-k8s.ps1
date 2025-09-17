param(
  [switch]$SkipImageBuild = $false
)

function Write-Status($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-Success($m){ Write-Host "[SUCCESS] $m" -ForegroundColor Green }
function Write-Warn($m){ Write-Host "[WARNING] $m" -ForegroundColor Yellow }
function Write-Err($m){ Write-Host "[ERROR] $m" -ForegroundColor Red }

Write-Host "🚀 Starting CampusConnect Kubernetes Deployment..." -ForegroundColor Blue

# --- helper: write text as UTF-8 (no BOM), required for kubectl --patch-file ---
function Write-Utf8NoBom {
  param([string]$Path, [string]$Text)
  $dir = Split-Path -Parent $Path
  if ($dir -and -not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }
  $enc = New-Object System.Text.UTF8Encoding($false)  # no BOM
  # Don't Resolve-Path here; file doesn't exist yet
  [System.IO.File]::WriteAllText($Path, $Text, $enc)
}


# ---- prereqs ----
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) { Write-Err "kubectl not found"; exit 1 }
try { docker info | Out-Null } catch { Write-Err "Docker is not running"; exit 1 }
try { kubectl cluster-info | Out-Null } catch { Write-Err "Cannot connect to Kubernetes cluster"; exit 1 }
Write-Success "✅ Prerequisites check passed"

# ---- build images ----
if (-not $SkipImageBuild) {
  Write-Status "Building Docker images..."
  Push-Location server
  docker build -t campusconnect-backend:latest .
  if ($LASTEXITCODE -ne 0) { Write-Err "Backend image build failed"; exit 1 }
  Write-Success "Backend image built"
  Pop-Location

  Push-Location cc
  docker build -t campusconnect-frontend:latest .
  if ($LASTEXITCODE -ne 0) { Write-Err "Frontend image build failed"; exit 1 }
  Write-Success "Frontend image built"
  Pop-Location

  Write-Success "✅ All Docker images built successfully"
} else {
  Write-Warn "Skipping Docker image build as requested"
}

# ---- constants ----
$NS = "campusconnect"
$PVC = "mongodb-pvc"
$MongoDep = "mongodb-deployment"
$BackendDep = "backend-deployment"
$FrontendDep = "frontend-deployment"
$BackendSvc = "backend-service"
$FrontendSvc = "frontend-service"

# folder to store patch files
$PatchDir = Join-Path $PSScriptRoot "patches"

function Get-DefaultSC {
  $sc = kubectl get sc -o json | ConvertFrom-Json
  $def = $sc.items | Where-Object { $_.metadata.annotations.'storageclass.kubernetes.io/is-default-class' -eq 'true' } | Select-Object -First 1
  if ($null -ne $def) { return $def.metadata.name }
  return ($sc.items[0].metadata.name)
}

function Ensure-PVC {
  $scName = Get-DefaultSC
  if (-not $scName) { Write-Err "No StorageClass found"; exit 1 }
  Write-Status "Using StorageClass: $scName"

  kubectl delete deploy $MongoDep -n $NS --ignore-not-found | Out-Null
  kubectl delete pvc $PVC -n $NS --ignore-not-found | Out-Null

  $pvcYaml = @"
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: $PVC
  namespace: $NS
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: $scName
  resources:
    requests:
      storage: 1Gi
"@
  $pvcYaml | kubectl apply -f - | Out-Null

  Write-Status "Waiting for PVC to be Bound..."
  $ok = $false
  foreach ($i in 1..30) {
    $phase = kubectl get pvc $PVC -n $NS -o jsonpath='{.status.phase}' 2>$null
    if ($phase -eq 'Bound') { $ok = $true; break }
    Start-Sleep -Seconds 2
  }
  if (-not $ok) { Write-Err "PVC did not become Bound"; kubectl describe pvc $PVC -n $NS; exit 1 }
  Write-Success "PVC is Bound"
}

function Patch-MongoProbes {
  Write-Status "Patching MongoDB probes to TCP socket (JSON patch)..."
  $json = @'
[
  {
    "op": "add",
    "path": "/spec/template/spec/containers/0/livenessProbe",
    "value": {
      "tcpSocket": { "port": 27017 },
      "initialDelaySeconds": 30,
      "periodSeconds": 10,
      "failureThreshold": 6
    }
  },
  {
    "op": "add",
    "path": "/spec/template/spec/containers/0/readinessProbe",
    "value": {
      "tcpSocket": { "port": 27017 },
      "initialDelaySeconds": 15,
      "periodSeconds": 5,
      "failureThreshold": 10
    }
  }
]
'@
  $file = Join-Path $PatchDir "mongo-probe.json"
  Write-Utf8NoBom -Path $file -Text $json
  kubectl patch deploy $MongoDep -n $NS --type=json --patch-file "$file" | Out-Null
}


function Add-WaitInitContainers {
  Write-Status "Adding initContainer wait-for-mongo to backend & frontend..."
  $json = @'
{"spec":{"template":{"spec":{"initContainers":[{"name":"wait-for-mongo","image":"busybox:1.36","command":["sh","-c","until nc -z mongodb-service 27017; do echo waiting for mongodb; sleep 2; done"]}]}}}}
'@
  $file = Join-Path $PatchDir "init-wait.json"
  Write-Utf8NoBom -Path $file -Text $json
  kubectl patch deploy $BackendDep -n $NS --type=strategic --patch-file "$file" | Out-Null
  kubectl patch deploy $FrontendDep -n $NS --type=strategic --patch-file "$file" | Out-Null
}

function Patch-Services {
  Write-Status "Patching services to NodePort..."
  $backend = @'
{"spec":{"type":"NodePort","ports":[{"port":3800,"targetPort":3800,"nodePort":30800}]}}
'@
  $frontend = @'
{"spec":{"type":"NodePort","ports":[{"port":3500,"targetPort":3500,"nodePort":30500}]}}
'@
  $bfile = Join-Path $PatchDir "svc-backend.json"
  $ffile = Join-Path $PatchDir "svc-frontend.json"
  Write-Utf8NoBom -Path $bfile -Text $backend
  Write-Utf8NoBom -Path $ffile -Text $frontend
  kubectl patch svc $BackendSvc -n $NS --type=merge --patch-file "$bfile" | Out-Null
  kubectl patch svc $FrontendSvc -n $NS --type=merge --patch-file "$ffile" | Out-Null
}

function Wait-Ready($label){
  Write-Status "Waiting for pods ($label) to be Ready..."
  kubectl wait --for=condition=ready pod -l $label -n $NS --timeout=300s
  if ($LASTEXITCODE -ne 0) { Write-Warn "$label may still be starting" }
}

# ---- deploy sequence ----
Write-Status "Deploying to Kubernetes..."
kubectl apply -f k8s/namespace.yaml | Out-Null
Write-Success "Namespace ensured"

Write-Status "Applying secrets/configmaps..."
kubectl apply -f k8s/mongodb-secret.yaml | Out-Null
kubectl apply -f k8s/mongodb-configmap.yaml | Out-Null
kubectl apply -f k8s/backend-secret.yaml | Out-Null
kubectl apply -f k8s/backend-configmap.yaml | Out-Null
kubectl apply -f k8s/frontend-configmap.yaml | Out-Null
Write-Success "Secrets/ConfigMaps applied"

Ensure-PVC

Write-Status "Deploying MongoDB..."
kubectl apply -f k8s/mongodb-deployment.yaml | Out-Null
kubectl apply -f k8s/mongodb-service.yaml | Out-Null
Patch-MongoProbes
kubectl rollout restart deploy $MongoDep -n $NS | Out-Null
Wait-Ready "app=mongodb"

Write-Status "Deploying Backend & Frontend..."
kubectl apply -f k8s/backend-deployment.yaml | Out-Null
kubectl apply -f k8s/backend-service.yaml | Out-Null
kubectl apply -f k8s/frontend-deployment.yaml | Out-Null
kubectl apply -f k8s/frontend-service.yaml | Out-Null

Add-WaitInitContainers
kubectl rollout restart deploy $BackendDep -n $NS | Out-Null
kubectl rollout restart deploy $FrontendDep -n $NS | Out-Null

Patch-Services

Wait-Ready "app=backend"
Wait-Ready "app=frontend"

Write-Status "Applying network policies..."
kubectl apply -f k8s/network-policy.yaml | Out-Null

Write-Success "🎉 CampusConnect deployment completed!"

Write-Status "=== SERVICE ENDPOINTS ==="
kubectl get svc -n $NS
Write-Status "=== POD STATUS ==="
kubectl get pods -n $NS
Write-Status "=== DEPLOYMENT STATUS ==="
kubectl get deploy -n $NS

Write-Success "🌐 Access locally:"
Write-Host "Frontend: http://localhost:30500" -ForegroundColor Green
Write-Host "Backend : http://localhost:30800/api/health" -ForegroundColor Green

Write-Status "Log tails:"
Write-Host "MongoDB: kubectl logs -l app=mongodb -n $NS --tail=100" -ForegroundColor Cyan
Write-Host "Backend: kubectl logs -l app=backend -n $NS --tail=100" -ForegroundColor Cyan
Write-Host "Frontend: kubectl logs -l app=frontend -n $NS --tail=100" -ForegroundColor Cyan

Write-Success "🚀 Done."
