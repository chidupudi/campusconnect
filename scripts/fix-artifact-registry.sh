#!/bin/bash

# Fix Artifact Registry API and Permissions Script
# Run this script to fix the GitHub Actions pipeline issue

set -e

echo "🔧 Fixing Artifact Registry API and Permissions..."

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No project set. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📋 Project ID: $PROJECT_ID"

# Enable required APIs
echo "🚀 Enabling required APIs..."
gcloud services enable artifactregistry.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Wait for APIs to be ready
echo "⏳ Waiting for APIs to propagate..."
sleep 15

# Create service account if it doesn't exist
SERVICE_ACCOUNT="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"
echo "👤 Checking service account: $SERVICE_ACCOUNT"

gcloud iam service-accounts describe $SERVICE_ACCOUNT || {
    echo "🔨 Creating service account..."
    gcloud iam service-accounts create github-actions \
        --description="GitHub Actions Service Account" \
        --display-name="GitHub Actions"
}

# Add required roles
echo "🔐 Adding IAM roles..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/container.developer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/serviceusage.serviceUsageAdmin"

# Create Artifact Registry repository
echo "🏗️ Creating Artifact Registry repository..."
gcloud artifacts repositories create campusconnect-repo \
    --repository-format=docker \
    --location=asia-south1 \
    --description="CampusConnect application images" || echo "Repository already exists"

# Configure Docker authentication
echo "🐳 Configuring Docker authentication..."
gcloud auth configure-docker asia-south1-docker.pkg.dev

# Test the setup
echo "🧪 Testing setup..."
gcloud artifacts repositories list --location=asia-south1

echo ""
echo "✅ Setup complete! Your pipeline should now work."
echo ""
echo "📋 Next steps:"
echo "1. Commit and push your changes"
echo "2. Monitor GitHub Actions for successful pipeline"
echo ""
echo "🔗 Repository URL: asia-south1-docker.pkg.dev/$PROJECT_ID/campusconnect-repo"