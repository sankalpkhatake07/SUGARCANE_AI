# Sugarcane Disease Analysis - Product Requirements Document

## Original Problem Statement
Build a sugarcane disease analysis website using a custom YOLO model (`best.pt`) alongside an AI vision model (GPT-5.1 Vision). Compare predictions internally and display only the final result to the user without confidence scores. Admin approval workflow required before farmers see results.

## Core Requirements
- Green/earthy color theme
- Dashboard to upload/capture images and predict diseases
- Admin approval workflow: farmer uploads -> AI detects -> admin reviews/approves/rejects -> farmer sees results
- Results show: disease name, severity, treatment tips, recommended Syngenta products, admin suggestions
- History page with status badges (Pending/Approved/Rejected)
- Disease Info page with symptoms/causes/preventions
- Multi-language support: English, Hindi, Marathi
- Two login types: Admin (admin/ADT@123) and User (username/password)
- No confidence scores shown to end users
- Admin can download all uploaded images as ZIP

## Tech Stack
- Frontend: React + TailwindCSS + Shadcn UI + Phosphor Icons + Framer Motion
- Backend: FastAPI + Motor (async MongoDB)
- Database: MongoDB
- AI Models: YOLO (best.pt, 15 classes) + GPT-5.1 Vision (via Emergent LLM Key)
- Storage: Emergent Object Storage

## What's Been Implemented

### Completed
- Full-stack scaffolding (FastAPI + React + MongoDB)
- Admin and User authentication (JWT, cookies)
- Dashboard with drag-drop image upload
- Dual-model detection pipeline: YOLO (primary) + GPT-5.1 Vision (verifier)
- **Admin Approval Workflow**:
  - Farmer uploads -> saved as "pending"
  - Dashboard shows "Submitted for Review" message
  - Admin sees pending scans in "Pending Reviews" tab
  - Admin can approve (with disease correction + severity + suggestion) or reject (with note)
  - Farmer sees results only after admin approval
  - History shows Pending/Approved/Rejected status badges
  - Expandable history items for approved scans (symptoms, treatment, prevention, admin suggestion)
- Admin-only ZIP download of all uploaded images
- Language toggle (EN, Hindi, Marathi)
- Disease Info library (18 diseases)
- No confidence scores displayed

## Detection Flow
1. Farmer uploads image -> AI runs dual detection (YOLO + GPT-5.1)
2. Result saved as `status: "pending"` with `ai_disease` and `ai_severity`
3. Farmer sees "Submitted for Review" (no disease details)
4. Admin reviews in "Pending Reviews" tab - sees AI prediction, image, farmer name
5. Admin approves/corrects/adds suggestion OR rejects with note
6. Farmer sees full results only after approval

## Key Endpoints
- POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
- PUT /api/profile
- POST /api/detect (saves as pending)
- GET /api/history (farmer's scans with status)
- GET /api/files/{path}
- GET /api/diseases
- GET /api/admin/users, GET /api/admin/detections, GET /api/admin/stats
- GET /api/admin/pending (pending scans for review)
- POST /api/admin/review/{id} (approve/reject with corrections)
- GET /api/admin/download-images (ZIP download)

## Database Schema - detections collection
id, user_id, username, image_path, ai_disease, ai_severity, disease, severity, treatment, syngenta_products, symptoms, causes, prevention, status (pending/approved/rejected), admin_suggestion, reviewed_by, reviewed_at, created_at

## Pending/Upcoming Tasks
- P1: Highlight affected areas on images (YOLO bounding boxes on frontend)
- P2: Camera capture feature
- P2: Backend refactoring
