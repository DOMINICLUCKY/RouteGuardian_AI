from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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

# NEW: Function to read directly from your CSV!
def get_real_shipments_from_csv():
    shipments = []
    # Check if file exists to prevent crashes
    if not os.path.exists("logistics_data.csv"):
        return [{"id": "ERR-001", "route": "File Not Found", "eta": "N/A", "riskLevel": "Critical", "action": "Intervene"}]

    with open('logistics_data.csv', mode='r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            shipments.append({
                "id": row["TrackingID"],
                "route": row["Route"],
                "eta": row["ETA_Hours"],  # Or just use the string directly
                "riskLevel": row["RiskLevel"],
                "action": "Intervene"
            })
    
    # Pick 5 random rows to simulate a live updating feed
    return random.sample(shipments, 5) if len(shipments) >= 5 else shipments

@app.get("/api/shipments")
def get_shipment_stats():
    return {"total_active": 1248, "on_time_percent": 87, "high_risk_count": 5}

@app.get("/api/shipments/at-risk")
def get_at_risk_shipments():
    return get_real_shipments_from_csv()

class ChatMessage(BaseModel):
    message: str

@app.post("/api/chat")
def chat_with_ai(chat: ChatMessage):
    return {"reply": f"AI Engine received: '{chat.message}'. We are ready to wire up Gemini!"}