# Privacy‑Preserved Sleep Apnea Detection 🛡️😴

A federated learning-powered framework for detecting sleep apnea using smartwatch data, designed to preserve user privacy by training models locally and aggregating insights without sharing raw sensitive data.

## 🚀 Project Overview

Smartwatch sensors (e.g., PPG, accelerometer) are used to collect physiological signals from users during sleep. Local models are trained on-device via federated learning (e.g., using Flower or TensorFlow Federated), with only model updates (not raw data) shared to a central server. This methodology ensures user privacy while enabling accurate detection of sleep apnea events.

## 🧠 Features

- **Federated Learning**: Collaborative model training across devices without centralized data storage.
- **Privacy by Design**: All preprocessing and training are kept local—only encrypted model gradients are aggregated.
- **Sleep Apnea Detection**: Binary classification (apnea vs. non-apnea) using smartwatch sensor data.
- **Extensible Platform**: Easy to adapt to different sensor types, models, and FL frameworks.

## 📂 Project Structure

```
Privacy-preserved-sleep-apnea-detection/
├── clients/                 
│   ├── client.py           # Local data processing + FL client logic
│   └── preprocess.py       # Signal filtering, windowing, feature extraction
├── server/
│   ├── server.py           # Federated aggregation & model orchestration
│   └── aggregator.py       # Secure aggregation logic
├── models/
│   └── model.py            # Neural network architecture
├── data/                   # Sample device datasets (synthetic or anonymized)
├── scripts/
│   └── simulate_fl.py      # Script to simulate multiple device clients
├── requirements.txt
└── README.md
```

## 🛠️ Setup & Installation

```bash
git clone https://github.com/RahulVishal/Privacy-preserved-sleep-apnea-detection.git
cd Privacy-preserved-sleep-apnea-detection
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Dependencies include:

- tensorflow or torch
- flower or tensorflow_federated
- Signal processing libraries (e.g., numpy, scipy, pandas)

## ⚙️ How to Run

- Preprocess device data
```python
python clients/preprocess.py --input data/device1.csv --output data/device1_preprocessed.npz
```
- Start the FL server
```python
python server/server.py --rounds 20 --num_clients 5
```
- Launch simulated clients (in separate terminals)
```python
python clients/client.py --data data/device1_preprocessed.npz
```
- Monitor Training
```python
Observe training logs on client side and aggregation metrics on server console.
```

## 🧪 Evaluation & Results

- Test the global model on held-out device data post-training.
- Metrics computed: accuracy, precision, recall, F1-score, and optionally, AUC.
- Evaluate privacy guarantees like differential privacy budgets or gradient clipping thresholds.

##🔧 Customization

-Swap in new models by editing `models/model.py`.
- Adapt preprocessing for different sensor inputs or sampling rates.
- Use secure aggregation protocols—e.g., add differential privacy or encrypted model updates.
- Integrate deployment to real devices using federated frameworks like Flower IoT, FedML, etc.
