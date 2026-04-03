# AWS Deployment Guide - Sugarcane Disease Detection

This guide will help you deploy your application on AWS with GPU support for YOLO model.

## Architecture Overview

**Your App Uses:**
- YOLO model (best2.pt) - Requires GPU for fast inference
- Gemini Vision API - Cloud-based (no GPU needed)
- Both models run ALWAYS and results are compared
- Best prediction is shown to users

---

## Option 1: AWS EC2 with GPU (Recommended)

### Instance Type
- **Recommended**: `g4dn.xlarge` 
  - 1 NVIDIA T4 GPU
  - 4 vCPUs, 16 GB RAM
  - Cost: ~$0.526/hour (~$380/month)

### Step-by-Step Deployment

#### 1. Launch EC2 Instance

```bash
# Use AWS Console or CLI
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \  # Ubuntu 22.04 LTS
  --instance-type g4dn.xlarge \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxx \
  --subnet-id subnet-xxxxxx
```

#### 2. SSH into Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

#### 3. Install NVIDIA Drivers

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install NVIDIA drivers
sudo apt install -y ubuntu-drivers-common
sudo ubuntu-drivers autoinstall

# Reboot
sudo reboot

# After reboot, verify GPU
nvidia-smi  # Should show NVIDIA T4 GPU
```

#### 4. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt update
sudo apt install -y nvidia-container-toolkit
sudo systemctl restart docker
```

#### 5. Clone Your Code

```bash
# Clone your repository
git clone https://github.com/your-username/sugarcane-disease-app.git
cd sugarcane-disease-app

# Or upload files manually
scp -i your-key.pem -r /local/path/* ubuntu@your-ec2-ip:/home/ubuntu/app/
```

#### 6. Create Dockerfile

Create `/app/Dockerfile`:

```dockerfile
# Multi-stage build for optimization
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY frontend/ ./
RUN yarn build

# Backend with GPU support
FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04

# Install Python and system dependencies
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3-pip \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend
COPY backend/ ./backend/
RUN pip3 install --no-cache-dir -r backend/requirements.txt

# Copy frontend build
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Copy configs
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY nginx.conf /etc/nginx/nginx.conf

# Expose ports
EXPOSE 80 8001

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
```

#### 7. Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
      - MONGO_URL=mongodb://mongo:27017
      - DB_NAME=sugarcane_db
      - EMERGENT_LLM_KEY=${EMERGENT_LLM_KEY}
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "80:80"
      - "8001:8001"
    volumes:
      - ./backend/models:/app/backend/models
    depends_on:
      - mongo

  mongo:
    image: mongo:7.0
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongo-data:
```

#### 8. Deploy

```bash
# Set environment variables
export EMERGENT_LLM_KEY="your-key-here"
export JWT_SECRET="your-secret-here"

# Build and run
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

#### 9. Configure Domain (Optional)

```bash
# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

---

## Option 2: AWS ECS with GPU (Managed)

### Advantages
- Auto-scaling
- Load balancing
- Managed infrastructure

### Setup

1. **Create ECS Cluster with GPU**
```bash
aws ecs create-cluster --cluster-name sugarcane-gpu-cluster
```

2. **Create Task Definition** (task-definition.json)

```json
{
  "family": "sugarcane-app",
  "requiresCompatibilities": ["EC2"],
  "containerDefinitions": [
    {
      "name": "app",
      "image": "your-ecr-repo/sugarcane-app:latest",
      "memory": 8192,
      "cpu": 2048,
      "resourceRequirements": [
        {
          "type": "GPU",
          "value": "1"
        }
      ],
      "portMappings": [
        {
          "containerPort": 80,
          "hostPort": 80
        }
      ],
      "environment": [
        {"name": "EMERGENT_LLM_KEY", "value": "your-key"},
        {"name": "MONGO_URL", "value": "mongodb://your-mongo"},
        {"name": "JWT_SECRET", "value": "your-secret"}
      ]
    }
  ]
}
```

3. **Launch GPU-enabled Container Instances**

Use EC2 launch template with:
- Instance type: `g4dn.xlarge`
- AMI: ECS-optimized GPU AMI
- User data:
```bash
#!/bin/bash
echo ECS_CLUSTER=sugarcane-gpu-cluster >> /etc/ecs/ecs.config
echo ECS_ENABLE_GPU_SUPPORT=true >> /etc/ecs/ecs.config
```

---

## Option 3: AWS Lambda + EFS (Serverless - Complex)

**Pros**: Pay per request, no idle costs  
**Cons**: Cold starts, complex setup, no GPU (CPU inference only)

Only use if budget is very limited. YOLO will be slower without GPU.

---

## Cost Comparison

| Option | Monthly Cost | Best For |
|--------|-------------|----------|
| EC2 g4dn.xlarge (24/7) | ~$380 | Production, always-on |
| EC2 g4dn.xlarge (8hrs/day) | ~$130 | Development, testing |
| ECS Fargate + GPU | ~$400-600 | Auto-scaling needs |
| Lambda + EFS | ~$50-100 | Low traffic, budget-limited |

---

## Environment Variables Needed

Create `.env` file:

```bash
# Backend
MONGO_URL=mongodb://localhost:27017
DB_NAME=sugarcane_db
EMERGENT_LLM_KEY=sk-emergent-your-key-here
JWT_SECRET=your-random-secret-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ADT@123
CORS_ORIGINS=*

# Frontend
REACT_APP_BACKEND_URL=https://your-domain.com
```

---

## Post-Deployment Checklist

✅ GPU detected: `nvidia-smi` shows T4 GPU  
✅ YOLO model loads: Check logs for "YOLO model loaded"  
✅ Gemini API works: Test with sample image  
✅ Both models run: Logs show "Running BOTH models"  
✅ MongoDB connected: Database queries work  
✅ SSL configured: HTTPS working  
✅ Domain pointing to EC2 elastic IP  

---

## Monitoring

```bash
# View application logs
docker-compose logs -f app

# View GPU usage
watch -n 1 nvidia-smi

# Check resource usage
docker stats
```

---

## Scaling

**Horizontal Scaling (Multiple Instances)**:
- Use AWS Application Load Balancer
- Multiple EC2 instances behind ALB
- Shared MongoDB (use AWS DocumentDB or MongoDB Atlas)

**Vertical Scaling**:
- Upgrade to `g4dn.2xlarge` for more GPU power
- More concurrent requests

---

## Troubleshooting

**YOLO model not loading?**
- Check model file exists: `ls -lh /app/backend/models/best2.pt`
- Check GPU access: `nvidia-smi`

**Out of memory?**
- Increase instance size to g4dn.2xlarge
- Or reduce batch size in YOLO inference

**Slow predictions?**
- GPU not being used - check NVIDIA drivers
- Network latency to Gemini API

---

## Support

Questions? Check logs:
```bash
# Backend logs
docker-compose logs backend

# YOLO model loading
grep "YOLO" logs/backend.log

# Detection logs
grep "FINAL RESULT" logs/backend.log
```

---

## Next Steps

1. Choose deployment option (EC2 recommended)
2. Launch GPU instance
3. Install NVIDIA drivers
4. Deploy using Docker
5. Test with sample images
6. Monitor accuracy of dual-model predictions
