# Sugarcane Disease Analysis - Product Requirements Document

## Original Problem Statement
Build a sugarcane disease analysis website using a custom YOLO model (`best.pt`) alongside an AI vision model (GPT-5.1 Vision). Compare predictions internally and display only the final result to the user without confidence scores.

## Core Requirements
- Green/earthy color theme
- Dashboard to upload/capture images and predict diseases
- Results show: disease name, severity, treatment tips, recommended Syngenta products
- History page with past scans and thumbnails
- Disease Info page with symptoms/causes/preventions for all diseases
- Multi-language support: English, Hindi, Marathi
- Two login types: Admin (admin/ADT@123) and User (username/password registration)
- No confidence scores shown to end users
- Dual-model comparison: YOLO + GPT-5.1 Vision (internal, not shown to user)

## Tech Stack
- Frontend: React + TailwindCSS + Shadcn UI + Phosphor Icons + Framer Motion
- Backend: FastAPI + Motor (async MongoDB)
- Database: MongoDB
- AI Models: YOLO (best.pt, 15 classes) + GPT-5.1 Vision (via Emergent LLM Key)
- Storage: Emergent Object Storage

## What's Been Implemented (as of 2026-04-03)

### Completed
- Full-stack scaffolding (FastAPI + React + MongoDB)
- Admin and User authentication (JWT, cookies)
- Admin seed on startup
- Dashboard with drag-drop image upload
- Dual-model detection pipeline: YOLO (best.pt) + GPT-5.1 Vision
- Detection results: disease, severity, treatment, symptoms, causes, prevention, Syngenta products
- History page with thumbnails and search
- Disease Info library page (18 diseases)
- Admin panel with stats, users, detections
- Language toggle (EN, Hindi, Marathi) with i18n
- No confidence scores displayed anywhere
- AWS Deployment Guide

### P0 Bugs Fixed (2026-04-03)
- Fixed `claude_result is not defined` NameError in `/api/detect`
- Fixed YOLO `marshal data too short` by replacing corrupted best2.pt with user-provided best.pt + clearing __pycache__
- Moved logging config to top of server.py
- Removed confidence display from HistoryPage and AdminPage

## Pending/Upcoming Tasks
- **P1**: Highlight affected areas on uploaded images (YOLO bounding boxes overlay)
- **P2**: Backend code refactoring (extract routes into separate files)
- **P2**: Camera capture feature (currently upload-only)

## Key Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- PUT /api/profile
- POST /api/detect
- GET /api/history
- GET /api/files/{path}
- GET /api/diseases
- GET /api/admin/users
- GET /api/admin/detections
- GET /api/admin/stats

## Database Schema
- `users`: username, password_hash, role, name, mobile, created_at
- `detections`: id, user_id, username, image_path, disease, severity, treatment, syngenta_products, symptoms, causes, prevention, created_at

## YOLO Model Classes (best.pt - 15 classes)
Early Shoot Borer, Grassy Shoot Disease, Mites, Mosaic, Pokkah Boeng, Red Rot, Whiplash Smut, Woolly Aphids, Brown Rust, Brown Spot, Eye Spot, Internode Borer, Leaf Footed Bug, Pyrilla, Scale Insect
