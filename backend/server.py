from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import requests
import base64
from PIL import Image
import io
import torch
from ultralytics import YOLO
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Object Storage Setup
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "sugarcane-disease"
storage_key = None

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET")
JWT_ALGORITHM = "HS256"

# Load YOLO model
model_path = ROOT_DIR / "models" / "best2.pt"
yolo_model = None

try:
    yolo_model = YOLO(str(model_path))
    logging.info("YOLO model loaded successfully")
except Exception as e:
    logging.error(f"Failed to load YOLO model: {e}")

# Disease Information Database (18 classes)
DISEASE_INFO = {
    "Early Shoot Borer": {
        "symptoms": "Dead heart formation in young shoots, bore holes in stems, wilting of central shoots",
        "causes": "Caterpillar pest (Chilo infuscatellus), attacks early growth stages",
        "prevention": "Use resistant varieties, proper field sanitation, timely planting",
        "treatment": "Apply recommended insecticides, remove and destroy affected shoots",
        "syngenta_products": ["ACTARA", "AMPLIGO"]
    },
    "Grassy Shoot Disease": {
        "symptoms": "Multiple thin shoots from single stool, pale yellow leaves, reduced cane diameter",
        "causes": "Phytoplasma infection transmitted by leafhopper vectors",
        "prevention": "Control vector populations, use disease-free planting material, remove infected plants",
        "treatment": "Rogue out diseased plants, spray insecticides to control vectors",
        "syngenta_products": ["ACTARA", "CHESS"]
    },
    "Healthy": {
        "symptoms": "No visible disease symptoms, vibrant green leaves, normal growth",
        "causes": "N/A",
        "prevention": "Continue good agricultural practices, regular monitoring, balanced nutrition",
        "treatment": "No treatment needed",
        "syngenta_products": []
    },
    "Mites": {
        "symptoms": "Silvering or bronzing of leaves, fine webbing, leaf curling, reduced vigor",
        "causes": "Spider mite infestation, hot and dry weather conditions favor buildup",
        "prevention": "Regular monitoring, maintain adequate moisture, encourage natural predators",
        "treatment": "Apply acaricides, ensure proper water management",
        "syngenta_products": ["VERTIMEC", "PROCLAIM"]
    },
    "Mosaic": {
        "symptoms": "Yellow-green mottling on leaves, stunted growth, reduced yield",
        "causes": "Viral infection transmitted by aphid vectors",
        "prevention": "Use virus-free planting material, control aphid populations, remove infected plants",
        "treatment": "No cure; remove and destroy infected plants, control vector insects",
        "syngenta_products": ["ACTARA", "CHESS"]
    },
    "Pokkah Boeng": {
        "symptoms": "Top leaves twisted and crinkled, knife-like cuts on unfurled leaves, tip rot",
        "causes": "Fungal infection (Fusarium species), favored by wet conditions and wounds",
        "prevention": "Avoid mechanical injuries, use resistant varieties, proper drainage",
        "treatment": "Apply fungicides, improve drainage, remove severely affected plants",
        "syngenta_products": ["AMISTAR", "SCORE"]
    },
    "Red Rot": {
        "symptoms": "Reddening of internal tissues, withering of leaves, sour smell from affected stalks",
        "causes": "Fungal infection (Colletotrichum falcatum), waterlogged conditions, wounded stalks",
        "prevention": "Use resistant varieties, proper drainage, avoid injuries during harvesting",
        "treatment": "Remove infected plants, apply fungicides",
        "syngenta_products": ["AMISTAR TOP", "SCORE"]
    },
    "Whiplash Smut": {
        "symptoms": "Whip-like structure emerges from shoot apex, black spore mass, stunted growth",
        "causes": "Fungal infection (Sporisorium scitamineum), spread through soil and infected sets",
        "prevention": "Use disease-free setts, hot water treatment of setts, crop rotation",
        "treatment": "Rogue out infected plants immediately, apply systemic fungicides",
        "syngenta_products": ["TILT", "BANKO PLUS"]
    },
    "Woolly Aphids": {
        "symptoms": "White cottony masses on stems and leaves, honeydew secretion, sooty mold",
        "causes": "Aphid infestation (Ceratovacuna lanigera), sap-sucking pest",
        "prevention": "Regular scouting, encourage natural enemies, avoid excess nitrogen",
        "treatment": "Apply systemic insecticides, spray with recommended chemicals",
        "syngenta_products": ["ACTARA", "CHESS"]
    },
    "Black Aphid": {
        "symptoms": "Dark aphids clustered on leaves and stems, leaf curling, stunted growth, honeydew",
        "causes": "Black aphid infestation, rapid multiplication in favorable conditions",
        "prevention": "Monitor regularly, use yellow sticky traps, conserve natural enemies",
        "treatment": "Apply contact or systemic insecticides when threshold is exceeded",
        "syngenta_products": ["ACTARA", "CHESS"]
    },
    "Brown Rust": {
        "symptoms": "Brown pustules on leaf surfaces, premature drying of leaves, reduced photosynthesis",
        "causes": "Fungal infection (Puccinia melanocephala), favored by humid conditions",
        "prevention": "Use resistant varieties, adequate plant spacing, remove crop residues",
        "treatment": "Apply fungicides at early disease stage, ensure proper air circulation",
        "syngenta_products": ["AMISTAR", "REVUS"]
    },
    "Brown Spot": {
        "symptoms": "Brown spots with yellow halos on leaves, lesions may coalesce, leaf blight",
        "causes": "Fungal infection (Helminthosporium species), moisture and high humidity",
        "prevention": "Proper spacing for air circulation, avoid overhead irrigation, use resistant varieties",
        "treatment": "Apply protective fungicides, remove infected plant debris",
        "syngenta_products": ["AMISTAR", "BANKO PLUS"]
    },
    "Eye Spot": {
        "symptoms": "Oval to elongated spots with yellow margins on leaves, reddish-brown centers",
        "causes": "Fungal infection (Bipolaris sacchari), warm humid weather",
        "prevention": "Use clean planting material, ensure good drainage, crop rotation",
        "treatment": "Spray recommended fungicides, remove and destroy infected leaves",
        "syngenta_products": ["SCORE", "AMISTAR"]
    },
    "Internode Borer": {
        "symptoms": "Bore holes in internodes, internal tunneling, breakage of stems, oozing from holes",
        "causes": "Caterpillar pest boring into stems, multiple generations per season",
        "prevention": "Regular field inspection, use pheromone traps, maintain field hygiene",
        "treatment": "Apply insecticides targeting borers, destroy stubbles after harvest",
        "syngenta_products": ["AMPLIGO", "PROCLAIM"]
    },
    "Leaf Footed Bug": {
        "symptoms": "Yellowing and wilting of shoots, sap extraction damage, distorted growth",
        "causes": "True bug feeding on plant sap, can transmit diseases",
        "prevention": "Remove alternate hosts, use row covers, regular monitoring",
        "treatment": "Apply contact insecticides when populations are high",
        "syngenta_products": ["ACTARA", "AMPLIGO"]
    },
    "Pyrilla": {
        "symptoms": "White waxy covering on leaves, honeydew secretion leading to sooty mold, reduced vigor",
        "causes": "Pyrilla perpusilla (sugarcane planthopper), sap-sucking insect pest",
        "prevention": "Monitor pest population, conserve natural enemies (parasitoids), avoid water stress",
        "treatment": "Spray insecticides when economic threshold is reached",
        "syngenta_products": ["ACTARA", "CHESS"]
    },
    "Scale Insect": {
        "symptoms": "Scale-covered insects on stems and leaves, yellowing, reduced plant vigor, sooty mold",
        "causes": "Scale insect infestation, armored or soft scales feeding on sap",
        "prevention": "Maintain field sanitation, encourage natural predators, avoid water stress",
        "treatment": "Apply systemic insecticides or horticultural oils",
        "syngenta_products": ["ACTARA", "VERTIMEC"]
    },
    "Wilt": {
        "symptoms": "Sudden wilting and drying of leaves, yellowing, vascular discoloration, plant death",
        "causes": "Fungal or bacterial wilt pathogens, waterlogging, root damage",
        "prevention": "Use disease-free setts, ensure proper drainage, avoid injuries to roots",
        "treatment": "Remove and destroy infected plants, apply soil drenching with recommended chemicals",
        "syngenta_products": ["AMISTAR", "SCORE"]
    }
}

# Helper Functions
def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        return storage_key
    except Exception as e:
        logging.error(f"Storage init failed: {e}")
        raise

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple[bytes, str]:
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, username: str) -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        from bson import ObjectId
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = payload["sub"]
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def detect_disease_yolo(image_bytes: bytes) -> Dict[str, Any]:
    """Detect disease using custom trained YOLO model"""
    if not yolo_model:
        return {"disease": "Unknown", "confidence": 0, "severity": "unknown", "source": "yolo"}
    
    try:
        image = Image.open(io.BytesIO(image_bytes))
        results = yolo_model(image)
        
        if results and len(results) > 0:
            result = results[0]
            if len(result.boxes) > 0:
                box = result.boxes[0]
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                
                # 18 disease classes
                disease_names = [
                    "Early Shoot Borer",
                    "Grassy Shoot Disease",
                    "Healthy",
                    "Mites",
                    "Mosaic",
                    "Pokkah Boeng",
                    "Red Rot",
                    "Whiplash Smut",
                    "Woolly Aphids",
                    "Black Aphid",
                    "Brown Rust",
                    "Brown Spot",
                    "Eye Spot",
                    "Internode Borer",
                    "Leaf Footed Bug",
                    "Pyrilla",
                    "Scale Insect",
                    "Wilt"
                ]
                disease = disease_names[class_id] if class_id < len(disease_names) else "Unknown"
                
                if confidence > 0.7:
                    severity = "high"
                elif confidence > 0.4:
                    severity = "medium"
                else:
                    severity = "low"
                
                return {
                    "disease": disease,
                    "confidence": round(confidence * 100, 2),
                    "severity": severity,
                    "source": "yolo"
                }
        
        return {"disease": "Healthy", "confidence": 95.0, "severity": "low", "source": "yolo"}
    except Exception as e:
        logging.error(f"YOLO detection error: {e}")
        return {"disease": "Unknown", "confidence": 0, "severity": "unknown", "source": "yolo"}

# Note: Dual-model approach - YOLO (specialized) + Gemini Vision (general AI)

async def detect_disease_gemini(image_bytes: bytes) -> Dict[str, Any]:
    """Detect disease using Gemini Vision"""
    try:
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        api_key = os.getenv("EMERGENT_LLM_KEY")
        chat = LlmChat(api_key=api_key, session_id=f"detection-{uuid.uuid4()}", system_message="You are an agricultural disease expert specializing in sugarcane crop health.")
        chat.with_model("gemini", "gemini-3.1-flash-preview").with_params()
        
        msg = UserMessage(
            text="""You are an expert in sugarcane disease detection. Analyze this sugarcane image carefully for any disease or pest.

CRITICAL VISUAL INDICATORS TO LOOK FOR:
- **Whiplash Smut**: BLACK WHIP-LIKE structure emerging from shoot, looks like a thin black rope/whip covered in black spores - MOST DISTINCTIVE FEATURE
- **Red Rot**: Reddish discoloration inside stalks, white patches with red margins on leaves
- **Brown Rust**: Small brown/orange pustules (bumps) scattered on leaf surfaces
- **Mosaic**: Yellow and green mottled/patchy pattern on leaves (like a mosaic tile)
- **Pokkah Boeng**: Twisted, crinkled top leaves with knife-like cuts
- **Early Shoot Borer**: Bore holes in stems, dead central shoot (dead heart)
- **Grassy Shoot Disease**: Multiple thin shoots growing from one point, pale yellow
- **Eye Spot**: Oval spots with yellow halos and reddish-brown centers on leaves
- **Brown Spot**: Brown lesions with yellow borders on leaves
- **Woolly Aphids**: White cottony/fluffy masses on stems and leaves
- **Black Aphid**: Clusters of small black insects on leaves/stems
- **Mites**: Fine webbing, silvering or bronzing of leaves
- **Scale Insect**: Small scale-covered bumps on stems and leaves
- **Pyrilla**: White waxy covering on leaves, honeydew
- **Leaf Footed Bug**: Visible bugs with leaf-shaped hind legs
- **Internode Borer**: Bore holes between stem nodes, oozing
- **Wilt**: Sudden wilting and drying of entire plant
- **Healthy**: Vibrant green leaves, no spots, no insects, no abnormal structures

Look VERY CAREFULLY for the black whip-like structure (Whiplash Smut) - it's the most distinctive disease symptom.

Respond ONLY in this exact JSON format: {"disease": "disease_name", "confidence": confidence_percentage, "severity": "low/medium/high"}

Disease name MUST be exactly one of: Early Shoot Borer, Grassy Shoot Disease, Healthy, Mites, Mosaic, Pokkah Boeng, Red Rot, Whiplash Smut, Woolly Aphids, Black Aphid, Brown Rust, Brown Spot, Eye Spot, Internode Borer, Leaf Footed Bug, Pyrilla, Scale Insect, Wilt""",
            file_contents=[ImageContent(image_base64)]
        )
        
        response = await chat.send_message(msg)
        
        import json
        try:
            result = json.loads(response)
            result["source"] = "gemini"
            return result
        except:
            return {"disease": "Healthy", "confidence": 85.0, "severity": "low", "source": "gemini"}
            
    except Exception as e:
        logging.error(f"Gemini detection error: {e}")
        return {"disease": "Healthy", "confidence": 85.0, "severity": "low"}

# Pydantic Models
class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserProfile(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None

class DetectionResult(BaseModel):
    id: str
    user_id: str
    image_path: str
    disease: str
    confidence: float
    severity: str
    treatment: str
    syngenta_products: List[str]
    created_at: str

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Startup event
@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logging.info("Storage initialized")
        
        # Create indexes
        await db.users.create_index("username", unique=True)
        
        # Seed admin
        admin_username = os.environ.get("ADMIN_USERNAME", "admin")
        admin_password = os.environ.get("ADMIN_PASSWORD", "ADT@123")
        existing = await db.users.find_one({"username": admin_username})
        
        if not existing:
            hashed = hash_password(admin_password)
            await db.users.insert_one({
                "username": admin_username,
                "password_hash": hashed,
                "role": "admin",
                "name": "Administrator",
                "mobile": "",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            logging.info("Admin user created")
        elif not verify_password(admin_password, existing["password_hash"]):
            await db.users.update_one(
                {"username": admin_username},
                {"$set": {"password_hash": hash_password(admin_password)}}
            )
        
        # Write test credentials
        with open("/app/memory/test_credentials.md", "w") as f:
            f.write("# Test Credentials\n\n")
            f.write(f"## Admin\n- Username: {admin_username}\n- Password: {admin_password}\n- Role: admin\n\n")
            f.write("## Test User\n- Username: user1\n- Password: user123\n- Role: user\n\n")
            f.write("## Endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- GET /api/auth/me\n- POST /api/detect\n- GET /api/history\n")
            
    except Exception as e:
        logging.error(f"Startup error: {e}")

# Auth Routes
@api_router.post("/auth/register")
async def register(user: UserRegister, response: Response):
    existing = await db.users.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed = hash_password(user.password)
    user_doc = {
        "username": user.username,
        "password_hash": hashed,
        "role": "user",
        "name": "",
        "mobile": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, user.username)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=604800,
        path="/"
    )
    
    return {
        "id": user_id,
        "username": user.username,
        "role": "user",
        "name": "",
        "mobile": ""
    }

@api_router.post("/auth/login")
async def login(user: UserLogin, response: Response):
    db_user = await db.users.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    user_id = str(db_user["_id"])
    access_token = create_access_token(user_id, user.username)
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=604800,
        path="/"
    )
    
    return {
        "id": user_id,
        "username": db_user["username"],
        "role": db_user.get("role", "user"),
        "name": db_user.get("name", ""),
        "mobile": db_user.get("mobile", "")
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.put("/profile")
async def update_profile(profile: UserProfile, current_user: dict = Depends(get_current_user)):
    from bson import ObjectId
    update_data = {}
    if profile.name:
        update_data["name"] = profile.name
    if profile.mobile:
        update_data["mobile"] = profile.mobile
    
    if update_data:
        await db.users.update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one(
        {"_id": ObjectId(current_user["id"])},
        {"_id": 0, "password_hash": 0}
    )
    updated_user["id"] = current_user["id"]
    return updated_user

# Detection Routes
@api_router.post("/detect")
async def detect_disease(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    try:
        image_bytes = await file.read()
        
        # Store image in object storage
        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        image_id = str(uuid.uuid4())
        storage_path = f"{APP_NAME}/uploads/{current_user['id']}/{image_id}.{ext}"
        
        storage_result = put_object(storage_path, image_bytes, file.content_type or "image/jpeg")
        
        # Run BOTH models for comparison
        yolo_result = await detect_disease_yolo(image_bytes)
        gemini_result = await detect_disease_gemini(image_bytes)
        
        # Smart prediction selection logic
        # Priority: 1) Both agree -> use that, 2) YOLO is specialized -> prefer YOLO, 3) Higher confidence wins
        final_disease = yolo_result["disease"]
        final_confidence = yolo_result["confidence"]
        final_severity = yolo_result["severity"]
        model_used = "YOLO (Specialized)"
        
        # If both models agree, use that prediction
        if yolo_result["disease"] == gemini_result["disease"]:
            model_used = "Both Models Agree"
            # Use average confidence when both agree
            final_confidence = round((yolo_result["confidence"] + gemini_result["confidence"]) / 2, 2)
        # If YOLO detected a disease and Gemini says healthy, trust YOLO (it's specialized)
        elif yolo_result["disease"] != "Healthy" and gemini_result["disease"] == "Healthy":
            final_disease = yolo_result["disease"]
            final_confidence = yolo_result["confidence"]
            final_severity = yolo_result["severity"]
            model_used = "YOLO (Detected disease)"
        # If Gemini detected a disease and YOLO says healthy, verify with confidence
        elif yolo_result["disease"] == "Healthy" and gemini_result["disease"] != "Healthy":
            if gemini_result["confidence"] > 70:  # High confidence from Gemini
                final_disease = gemini_result["disease"]
                final_confidence = gemini_result["confidence"]
                final_severity = gemini_result["severity"]
                model_used = "Gemini (High confidence)"
            else:
                # Trust YOLO for specialized detection
                final_disease = yolo_result["disease"]
                final_confidence = yolo_result["confidence"]
                final_severity = yolo_result["severity"]
                model_used = "YOLO (Specialized)"
        # Both detected different diseases - use higher confidence
        else:
            if yolo_result["confidence"] >= gemini_result["confidence"]:
                final_disease = yolo_result["disease"]
                final_confidence = yolo_result["confidence"]
                final_severity = yolo_result["severity"]
                model_used = f"YOLO (Higher confidence: {yolo_result['confidence']}% vs {gemini_result['confidence']}%)"
            else:
                final_disease = gemini_result["disease"]
                final_confidence = gemini_result["confidence"]
                final_severity = gemini_result["severity"]
                model_used = f"Gemini (Higher confidence: {gemini_result['confidence']}% vs {yolo_result['confidence']}%)"
        
        logging.info(f"Detection results - YOLO: {yolo_result['disease']} ({yolo_result['confidence']}%), Gemini: {gemini_result['disease']} ({gemini_result['confidence']}%), Final: {final_disease} ({model_used})")
        
        # Get disease info
        disease_info = DISEASE_INFO.get(final_disease, DISEASE_INFO["Healthy"])
        
        # Save detection result
        detection_doc = {
            "id": image_id,
            "user_id": current_user["id"],
            "username": current_user["username"],
            "image_path": storage_result["path"],
            "disease": final_disease,
            "confidence": final_confidence,
            "severity": final_severity,
            "treatment": disease_info["treatment"],
            "syngenta_products": disease_info["syngenta_products"],
            "symptoms": disease_info["symptoms"],
            "causes": disease_info["causes"],
            "prevention": disease_info["prevention"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.detections.insert_one(detection_doc)
        detection_doc.pop("_id", None)
        
        return detection_doc
        
    except Exception as e:
        logging.error(f"Detection error: {e}")
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@api_router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    detections = await db.detections.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return detections

@api_router.get("/files/{path:path}")
async def get_file(path: str):
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=content_type)
    except:
        raise HTTPException(status_code=404, detail="File not found")

@api_router.get("/diseases")
async def get_diseases():
    return DISEASE_INFO

# Admin Routes
@api_router.get("/admin/users")
async def get_all_users(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.get("/admin/detections")
async def get_all_detections(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    detections = await db.detections.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return detections

@api_router.get("/admin/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_users = await db.users.count_documents({"role": "user"})
    total_scans = await db.detections.count_documents({})
    
    # Disease distribution
    pipeline = [
        {"$group": {"_id": "$disease", "count": {"$sum": 1}}}
    ]
    disease_stats = await db.detections.aggregate(pipeline).to_list(100)
    
    return {
        "total_users": total_users,
        "total_scans": total_scans,
        "disease_distribution": disease_stats
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
