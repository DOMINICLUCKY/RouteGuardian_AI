from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import csv
import random
import os

app = FastAPI()

# Allow React to talk to Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔴 Your Gemini API Key
GEMINI_API_KEY = "AIzaSyAgbGM5p6CATo1vvl9vxn2wEZW8MioURus"
genai.configure(api_key=GEMINI_API_KEY)

# Function to read directly from your CSV
def get_real_shipments_from_csv():
    shipments = []
    if not os.path.exists("logistics_data.csv"):
        return [{"id": "ERR-001", "route": "File Not Found", "eta": "N/A", "riskLevel": "Critical", "action": "Intervene"}]

    with open('logistics_data.csv', mode='r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            shipments.append({
                "id": row["TrackingID"],
                "route": row["Route"],
                "eta": row["ETA_Hours"],
                "riskLevel": row["RiskLevel"],
                "action": "Intervene"
            })
    return random.sample(shipments, 5) if len(shipments) >= 5 else shipments

@app.get("/api/shipments")
def get_shipment_stats():
    return {"total_active": 1248, "on_time_percent": 87, "high_risk_count": 5}

@app.get("/api/shipments/at-risk")
def get_at_risk_shipments():
    return get_real_shipments_from_csv()

class ChatMessage(BaseModel):
    message: str

# 🧠 THE AI ENGINE HOOKUP
@app.post("/api/chat")
def chat_with_ai(chat: ChatMessage):
    try:
        # AUTO-DETECT: Find a working model dynamically based on your key
        working_model = "gemini-1.5-flash" # Default fallback
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                working_model = m.name
                break # Found a valid model, stop looking!
                
        # Connect to the detected model
        model = genai.GenerativeModel(working_model)
        system_prompt = f"You are RouteGuardian AI, an expert logistics and supply chain assistant. Be concise, professional, and helpful. Answer this query: {chat.message}"
        
        response = model.generate_content(system_prompt)
        return {"reply": response.text}
    except Exception as e:
        return {"reply": f"⚠️ AI Connection Error: {str(e)}"}