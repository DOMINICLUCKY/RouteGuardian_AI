import csv
import random

routes = ["NYC -> LAX", "MIA -> CHI", "SEA -> BOS", "DAL -> DEN", "PHX -> DET", "ATL -> SFO", "HOU -> MIA", "SFO -> SEA"]
weather = ["Clear", "Rain", "Heavy Snow", "Thunderstorm", "High Winds"]

with open('logistics_data.csv', 'w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(["TrackingID", "Route", "ETA_Hours", "Weather", "TrafficDelay_Mins", "RiskLevel"])
    
    for i in range(1000):
        w_condition = random.choice(weather)
        delay = random.randint(0, 120)
        
        # Simple logic to assign risk
        risk = "Low"
        if w_condition in ["Heavy Snow", "Thunderstorm"] or delay > 60:
            risk = "Critical"
        elif w_condition == "Rain" or delay > 30:
            risk = "Medium"
            
        writer.writerow([
            f"TRK-{random.randint(10000, 99999)}",
            random.choice(routes),
            f"{random.randint(2, 48)}h",
            w_condition,
            delay,
            risk
        ])
print("Generated logistics_data.csv with 1000 records!")