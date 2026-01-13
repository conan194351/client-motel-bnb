# 🚀 Quick Start Guide

Get up and running in 5 minutes!

## ⚡ One-Command Setup

```bash
# Install dependencies, setup database, and import data
make setup-all
```

Then start the server:
```bash
make dev
```

That's it! API will be running at http://localhost:8000

---

## 📝 Step-by-Step Setup

### 1. Clone & Install

```bash
cd stay-hub
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp env.example .env
# Edit .env if needed (default values work with docker-compose)
```

### 3. Start Database

```bash
make db-up
# OR: docker-compose up -d
```

### 4. Setup Schema

```bash
make db-setup
# OR: ./setup_database.sh
```

Expected output:
```
📝 Executing: sql/01_schema.sql
   ✅ Success!
📝 Executing: sql/02_seed_data.sql
   ✅ Success!
```

### 5. Import Data

```bash
make import-data
# OR: python3 src/import_listings.py
```

Expected output:
```
✅ Imported 666 rooms total!
✅ Calculated 5328 attributes!
```

### 6. Start API

```bash
make dev
# OR: uvicorn src.api.main:app --reload
```

Open browser: http://localhost:8000/docs

---

## 🧪 Test Everything Works

In a new terminal:

```bash
python3 test_api.py
```

Expected output:
```
✅ Health check passed!
✅ Stats retrieved!
✅ Recommendations received!
🎉 All tests passed!
```

---

## 💡 Quick Examples

### Get Recommendations (cURL)

```bash
curl -X POST "http://localhost:8000/api/v1/dss/recommend" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "convenience_importance": 0.8,
      "comfort_importance": 0.9,
      "value_importance": 0.7
    },
    "filters": {
      "max_price": 150,
      "min_rating": 4.5
    },
    "limit": 5
  }'
```

### Get Recommendations (Python)

```python
import requests

response = requests.post(
    "http://localhost:8000/api/v1/dss/recommend",
    json={
        "preferences": {
            "convenience_importance": 0.8,
            "comfort_importance": 0.9,
            "value_importance": 0.7
        },
        "filters": {"max_price": 150, "min_rating": 4.5},
        "limit": 5
    }
)

results = response.json()
for result in results['ranked_results'][:3]:
    print(f"#{result['rank']}: {result['room']['name']}")
    print(f"  Score: {result['topsis_score']:.4f}")
    print(f"  {result['explanation']}\n")
```

---

## 🎯 Try Different Preferences

### Budget Traveler (Price-Focused)
```json
{
  "preferences": {
    "convenience_importance": 0.4,
    "comfort_importance": 0.3,
    "value_importance": 1.0
  }
}
```

### Luxury Seeker (Comfort-Focused)
```json
{
  "preferences": {
    "convenience_importance": 0.6,
    "comfort_importance": 1.0,
    "value_importance": 0.3
  }
}
```

### Business Traveler (Convenience-Focused)
```json
{
  "preferences": {
    "convenience_importance": 1.0,
    "comfort_importance": 0.7,
    "value_importance": 0.4
  }
}
```

---

## 🔧 Useful Commands

```bash
# View API documentation
open http://localhost:8000/docs

# Check database stats
curl http://localhost:8000/stats

# View influence diagram
curl http://localhost:8000/api/v1/influence-diagram

# View all criteria
curl http://localhost:8000/api/v1/criteria

# Database logs
docker-compose logs -f postgres

# Restart everything
make restart
```

---

## 🐛 Troubleshooting

### Database won't start
```bash
docker-compose down -v
docker-compose up -d
```

### Import fails
```bash
# Check if schema is setup
psql -h localhost -U stayhub_user -d stayhub -c "\dt"

# If no tables, run setup
make db-setup
```

### API won't start
```bash
# Check Python environment
which python3
pip list | grep fastapi

# Reinstall dependencies
pip install -r requirements.txt
```

---

## 📚 Next Steps

- Read the full [README.md](README.md)
- Explore the API documentation at `/docs`
- Customize the influence diagram in `sql/02_seed_data.sql`
- Add more criteria or modify weights

---

## 🎉 You're Ready!

Your BnB SmartChoice DSS is now running!

Try the interactive API docs: http://localhost:8000/docs

