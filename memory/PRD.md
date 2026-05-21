# SUGARCANE AI - Product Requirements Document

## Problem Statement
Build a sugarcane disease analysis website using a custom YOLO model (`best.pt`) alongside an AI vision model (GPT-5.1 Vision via Emergent LLM Key).

## Core Requirements
- **Two Roles**: Admin (`admin`/`ADT@123`) and User/Farmer (simple pseudo-login)
- **Multi-language**: English, Hindi, Marathi across entire UI and prediction results
- **Detection Pipeline**: Dual-model (YOLO primary at 40% threshold + GPT-5.1 Vision verifier/fallback)
- **Admin Approval Workflow**: Farmer uploads → Pending → Admin reviews/approves/rejects → Farmer sees result
- **Admin Panel**: Pending Reviews, Reviewed history (expandable), Disease Library (admin-only), ZIP download
- **Results**: Disease name, severity, treatment, chemical products/fertilizers for 26 diseases
- **No "Syngenta" branding**, no confidence scores shown to users
- **Innovative earthy UI design** with "SUGARCANE AI" branding

## Architecture
- **Frontend**: React + TailwindCSS + Shadcn UI + lucide-react + framer-motion + i18next
- **Backend**: FastAPI + MongoDB + Ultralytics YOLOv8 + Emergent Integrations (GPT-5.1 Vision)
- **Model**: `best.pt` (6.5MB YOLOv8 weights)

## What's Been Implemented
- Full dual-model detection pipeline (YOLO + GPT-5.1 Vision)
- Complete Admin Approval Workflow with approve/reject/correct/suggest
- 26 diseases with specific chemical treatments
- Comprehensive EN/HI/MR i18n (UI labels + backend disease dictionaries)
- Admin: Pending/Reviewed tabs, expandable reviewed items, stats, user list, ZIP download
- User: Dashboard with drag-drop upload, History with search/filter, expandable approved results
- Innovative earthy green UI theme (#1A3626 primary, #F5F5F0 background)
- "SUGARCANE AI" branding with sugarcane imagery on login/register
- Disease Library restricted to admin only
- Role-based navigation (admin sees Diseases + Admin Panel, users see Dashboard + History)
- Mobile-responsive layout with hamburger menu

## Key Endpoints
- `POST /api/detect` - Run YOLO + GPT-5.1, creates detection with status "pending"
- `GET /api/admin/pending` - Fetch unreviewed scans
- `POST /api/admin/review/{id}` - Admin approve/reject with corrections
- `GET /api/admin/download-images` - ZIP of all images
- `GET /api/history?lang=xx` - User's scan history with translations
- `GET /api/diseases?lang=xx` - Disease library data

## DB Schema
- `users`: `{username, role, name, mobile, created_at}`
- `detections`: `{id, image_id, image_url, user_id, yolo_prediction, ai_prediction, final_prediction, status, admin_suggestion, admin_corrected_disease, severity, created_at}`

## Backlog
- **P2**: Camera capture feature for mobile users
- **P2**: Bounding box overlays on images using YOLO coordinates
- **P2**: Backend refactoring (split `server.py` into modular routes)
