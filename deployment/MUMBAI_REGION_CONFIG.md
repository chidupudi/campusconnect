# 🇮🇳 Mumbai Region Configuration

## **Regional Settings**

### **GCP Region/Zone**
- **Region:** `asia-south1` (Mumbai)
- **Zone:** `asia-south1-a`
- **Secondary Zones:** `asia-south1-b`, `asia-south1-c`

### **Benefits of Mumbai Region**
✅ **Lower Latency** - Optimal for Indian users
✅ **Data Residency** - Data stays within India
✅ **Cost Optimization** - Regional pricing benefits
✅ **Compliance** - Meets local regulations

## **Updated Configuration Files**

### **1. GitHub Actions Workflow**
```yaml
env:
  GKE_ZONE: asia-south1-a  # Mumbai zone
```

### **2. Jenkins Pipeline**
```groovy
GKE_ZONE = 'asia-south1-a'  // Mumbai zone
```

### **3. GKE Cluster Creation**
```bash
gcloud container clusters create campusconnect-cluster \
  --zone=asia-south1-a \
  --region=asia-south1 \
  --machine-type=e2-medium \
  --num-nodes=3
```

## **Network Considerations**

### **Egress Costs**
- **Within Mumbai:** Free
- **To other regions:** Charged
- **Internet egress:** Standard rates

### **Load Balancer**
- **Regional LoadBalancer:** Lower latency for Indian users
- **Global LoadBalancer:** Available if needed for worldwide access

## **Availability & SLA**

### **Multi-Zone Setup**
```bash
# For high availability across Mumbai zones
gcloud container clusters create campusconnect-cluster \
  --zone=asia-south1-a \
  --additional-zones=asia-south1-b,asia-south1-c \
  --num-nodes=1 \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=3
```

### **Regional Persistent Disks**
```yaml
# In your PVC configurations
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-storage
spec:
  storageClassName: ssd-regional
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

## **Performance Optimizations**

### **Node Locations**
```bash
# Spread nodes across zones for HA
--node-locations=asia-south1-a,asia-south1-b,asia-south1-c
```

### **Regional Load Balancer**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  annotations:
    cloud.google.com/neg: '{"ingress": true}'
    cloud.google.com/load-balancer-type: "External"
spec:
  type: LoadBalancer
  loadBalancerSourceRanges:
    - 0.0.0.0/0  # Or restrict to Indian IP ranges
```

## **Cost Estimation (Mumbai Region)**

### **GKE Cluster**
- **3 x e2-medium nodes:** ₹8,000-10,000/month
- **Regional LoadBalancer:** ₹1,500/month
- **Persistent Storage:** ₹500-1,000/month
- **Network Egress:** ₹200-500/month

**Total Estimated Cost:** ₹10,000-13,000/month

### **Cost Optimization Tips**
1. **Use Preemptible Nodes** (60-91% cost savings)
2. **Auto-scaling** based on traffic
3. **Schedule scaling** during off-hours
4. **Use committed use discounts**

## **Monitoring & Logging**

### **Regional Monitoring**
```bash
# Enable Cloud Monitoring for Mumbai region
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
```

### **Log Retention**
```yaml
# Configure log retention for compliance
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush         1
        Log_Level     info
        Daemon        off
        Parsers_File  parsers.conf
        HTTP_Server   On
        HTTP_Listen   0.0.0.0
        HTTP_Port     2020

    [INPUT]
        Name              tail
        Path              /var/log/containers/*.log
        Parser            docker
        Tag               kube.*
        Refresh_Interval  5

    [OUTPUT]
        Name  stackdriver
        Match *
        google_service_credentials /etc/service_account/service-account-key.json
        location asia-south1
```

## **Security Considerations**

### **Network Security**
```yaml
# Network policy for Mumbai-specific traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: mumbai-region-policy
  namespace: campusconnect
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: campusconnect
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: campusconnect
  - to: []
    ports:
    - protocol: TCP
      port: 443  # HTTPS
    - protocol: TCP
      port: 80   # HTTP
```

### **Data Residency**
- All data remains in Mumbai region
- Complies with Indian data protection requirements
- No cross-border data transfer

## **Disaster Recovery**

### **Backup Strategy**
```bash
# Create regional snapshots
gcloud compute disks snapshot DISK_NAME \
  --zone=asia-south1-a \
  --snapshot-names=campusconnect-backup-$(date +%Y%m%d)
```

### **Multi-Region Setup (Optional)**
For critical applications, consider:
- **Primary:** Mumbai (`asia-south1`)
- **Secondary:** Singapore (`asia-southeast1`)

## **Migration Commands**

### **From US to Mumbai**
```bash
# Export existing cluster config
kubectl get all --all-namespaces -o yaml > cluster-backup.yaml

# Create new cluster in Mumbai
gcloud container clusters create campusconnect-cluster \
  --zone=asia-south1-a \
  --machine-type=e2-medium \
  --num-nodes=3

# Apply configurations
kubectl apply -f cluster-backup.yaml
```

## **Quick Start Commands**

```bash
# Set default region
gcloud config set compute/zone asia-south1-a
gcloud config set compute/region asia-south1

# Create cluster
gcloud container clusters create campusconnect-cluster \
  --zone=asia-south1-a \
  --machine-type=e2-medium \
  --num-nodes=3 \
  --enable-ip-alias \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=5

# Get credentials
gcloud container clusters get-credentials campusconnect-cluster \
  --zone=asia-south1-a

# Deploy application
kubectl apply -f k8s/

# Get external IP
kubectl get services frontend-service -n campusconnect
```

## **Support & Resources**

- **GCP Mumbai Support:** 24/7 available
- **Documentation:** [Google Cloud India](https://cloud.google.com/india)
- **Pricing:** [Mumbai Region Pricing](https://cloud.google.com/compute/pricing#asia)
- **Status Page:** [GCP Asia South Status](https://status.cloud.google.com/)

---

🇮🇳 **Your CampusConnect application is now optimized for Indian users with Mumbai region deployment!**