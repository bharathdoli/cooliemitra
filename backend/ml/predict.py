# server/ml/predict.py
import json
import sys
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler

def preprocess_worker_data(worker_data):
    print(f"Processing worker data: {worker_data.get('_id')}")
    sessions = worker_data.get('workHistory', [])
    if not sessions:
        print("No work history, defaulting to 3 hours")
        return [3.0, 1, 0, 1]  # Default: 3 hours, 1 session, 0 breaks, 1 day
    
    try:
        durations = []
        breaks = []
        for session in sessions:
            if session.get('endTime'):
                duration = (pd.to_datetime(session['endTime'], utc=True) - 
                           pd.to_datetime(session['startTime'], utc=True)).total_seconds() / 3600
                durations.append(duration)
                breaks.append(len(session.get('breaks', [])))
        
        if not durations:
            print("No valid sessions, defaulting to 3 hours")
            return [3.0, len(sessions), 0, 1]
        
        avg_duration = np.mean(durations)
        # Aggressive scaling for short sessions
        scaled_duration = max(3.0, avg_duration * 5000 if avg_duration < 0.1 else avg_duration)
        num_sessions = len(sessions)
        avg_breaks = np.mean(breaks) if breaks else 0
        last_session = pd.to_datetime(sessions[-1]['startTime'], utc=True)
        recency = max(1, (pd.Timestamp.now(tz='UTC') - last_session).days)
        
        print(f"Raw avg_duration={avg_duration:.6f}, scaled_duration={scaled_duration:.2f}, num_sessions={num_sessions}, avg_breaks={avg_breaks:.2f}, recency={recency}")
        return [scaled_duration, num_sessions, avg_breaks, recency]
    except Exception as e:
        print(f"Error in preprocessing: {e}")
        return [3.0, len(sessions), 0, 1]

def train_model():
    try:
        training_data = [
            {'avg_duration': 4.5, 'num_sessions': 10, 'avg_breaks': 1.2, 'recency': 2},
            {'avg_duration': 3.0, 'num_sessions': 5, 'avg_breaks': 0.5, 'recency': 5},
            {'avg_duration': 5.0, 'num_sessions': 15, 'avg_breaks': 1.5, 'recency': 1},
            {'avg_duration': 2.5, 'num_sessions': 3, 'avg_breaks': 0.0, 'recency': 10}
        ]
        X = [[d['avg_duration'], d['num_sessions'], d['avg_breaks'], d['recency']] for d in training_data]
        y = [4.7, 3.2, 5.1, 2.8]
        
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        model = LinearRegression()
        model.fit(X_scaled, y)
        return model, scaler
    except Exception as e:
        print(f"Error training model: {e}")
        raise

def main():
    try:
        worker_data = json.loads(sys.argv[1])
        print(f"Received worker data: {worker_data.get('_id')}")
    except Exception as e:
        print(f"Error parsing input: {e}")
        print(3.0)
        return
    
    try:
        features = preprocess_worker_data(worker_data)
        model, scaler = train_model()
        features_scaled = scaler.transform([features])
        raw_prediction = model.predict(features_scaled)[0]
        print(f"Raw prediction: {raw_prediction:.2f}")
        
        # Cap between 3 and 10 hours
        final_prediction = min(max(3.0, raw_prediction), 10.0)
        print(f"Final prediction: {final_prediction:.2f} hours")
        print(final_prediction)
    except Exception as e:
        print(f"Prediction error: {e}")
        print(3.0)

if __name__ == "__main__":
    main()