# 🏠 BnB SmartChoice DSS Backend

Decision Support System for BnB/Airbnb recommendations using **Influence Diagram** + **TOPSIS** algorithm.

## 📋 Overview

This system solves the problem of overwhelming choices when searching for accommodations. It uses:

- **Influence Diagram**: Models relationships between user preferences and evaluation criteria
- **TOPSIS**: Multi-criteria decision-making algorithm to rank alternatives

### How It Works

1. User expresses vague preferences (e.g., "I want convenience but also good value")
2. System converts preferences to criterion weights via Influence Diagram
3. TOPSIS ranks rooms based on distance to "ideal" solution
4. Returns ranked recommendations with explanations

## 🏗️ Architecture

```
┌─────────────┐
│   User      │
│ Preferences │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Influence      │  Converts preferences to weights
│  Diagram Engine │  (convenience → location + distance)
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │ Weights│  {price: 0.25, rating: 0.30, ...}
    └────┬───┘
         │
         ▼
┌─────────────────┐
│  TOPSIS Engine  │  Ranks rooms by similarity to ideal
│                 │  - Normalize decision matrix
│                 │  - Calculate ideal best/worst
│                 │  - Compute similarity scores
└────────┬────────┘
         │
         ▼
   ┌──────────┐
   │ Rankings │  Top N recommendations
   └──────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- PostgreSQL 16+ (or use Docker)
- pip

### 1. Setup Environment

```bash
# Clone or navigate to project
cd stay-hub

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp env.example .env
# Edit .env with your database credentials
```

### 2. Start Database

```bash
# Using Docker Compose (recommended)
docker-compose up -d

# Check database is running
docker-compose ps
docker-compose logs postgres
```

### 3. Setup Database Schema

```bash
# Make script executable
chmod +x setup_database.sh

# Run setup script
./setup_database.sh
```

This will:
- Create all tables (rooms, criteria, influence nodes, etc.)
- Insert seed data (criteria definitions, influence diagram structure)

### 4. Import Listings Data

```bash
# Import from listings.csv
python3 src/import_listings.py
```

Expected output:
```
🚀 BnB SmartChoice DSS - Data Importer
📥 Importing rooms from ../listings.csv...
  ✓ Imported 100 rooms...
  ✓ Imported 200 rooms...
✅ Imported 666 rooms total!
🔢 Calculating room attributes...
✅ Calculated 5328 attributes!

📊 IMPORT STATISTICS
Total Rooms: 666
Available Rooms: 642
Price Range: $30.00 - $450.00 (avg: $125.50)
Average Rating: 4.65 (580 rooms with ratings)
```

### 5. Start API Server

```bash
# Development mode with auto-reload
uvicorn src.api.main:app --reload --port 8000

# Production mode
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

API will be available at:
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Stats**: http://localhost:8000/stats

## 📡 API Endpoints

### Main Recommendation Endpoint

**POST** `/api/v1/dss/recommend`

Get personalized room recommendations.

**Request Body:**
```json
{
  "preferences": {
    "convenience_importance": 0.8,
    "comfort_importance": 0.9,
    "value_importance": 0.6
  },
  "filters": {
    "min_price": 50,
    "max_price": 200,
    "min_rating": 4.0,
    "room_type": "Entire home/apt",
    "min_accommodates": 2,
    "instant_bookable": true
  },
  "limit": 10
}
```

**Response:**
```json
{
  "session_id": "uuid-here",
  "total_evaluated": 150,
  "computed_weights": {
    "PRICE": 0.25,
    "RATING_OVERALL": 0.30,
    "RATING_CLEANLINESS": 0.15,
    "RATING_LOCATION": 0.15,
    "DISTANCE_CENTER": 0.10,
    "AMENITIES_COUNT": 0.05
  },
  "weight_explanations": [...],
  "ranked_results": [
    {
      "rank": 1,
      "room": {
        "room_id": 102,
        "listing_id": 3820211,
        "name": "Restored Precinct in Center Sq.",
        "price": 86.00,
        "room_type": "Entire home/apt",
        "review_scores_rating": 4.75,
        ...
      },
      "topsis_score": 0.8756,
      "explanation": "Best overall match. Strong in: Overall Rating, Cleanliness Rating",
      "distance_to_ideal": 0.0234,
      "distance_to_worst": 0.1654
    },
    ...
  ],
  "processing_time_ms": 145.2
}
```

### Other Endpoints

- `GET /health` - Health check
- `GET /stats` - Database statistics
- `GET /api/v1/rooms/{room_id}` - Get room details
- `GET /api/v1/criteria` - List all evaluation criteria
- `GET /api/v1/influence-diagram` - View influence diagram structure

## 🗄️ Database Schema

### Key Tables

#### 1. `rooms`
Stores property listings (alternatives in TOPSIS)

#### 2. `criteria`
Evaluation dimensions (price, rating, distance, etc.)

#### 3. `room_attributes`
Decision matrix - values for each room-criterion pair

#### 4. `influence_nodes`
Nodes in the influence diagram (ROOT, INTERMEDIATE, LEAF)

#### 5. `influence_edges`
Relationships and weights between nodes

#### 6. `user_preferences`
Session-based user preference storage

#### 7. `recommendation_results`
Cached TOPSIS results

### Influence Diagram Structure

```
ROOT_SATISFACTION (Overall Satisfaction)
├─ CONVENIENCE (30%)
│  ├─ DISTANCE_CENTER (60%) → DISTANCE_CENTER criterion
│  └─ RATING_LOCATION (40%) → RATING_LOCATION criterion
│
├─ COMFORT (40%)
│  ├─ RATING_OVERALL (40%) → RATING_OVERALL criterion
│  ├─ RATING_CLEANLINESS (35%) → RATING_CLEANLINESS criterion
│  └─ AMENITIES_COUNT (25%) → AMENITIES_COUNT criterion
│
└─ VALUE (30%)
   ├─ PRICE (60%) → PRICE criterion
   └─ RATING_VALUE (40%) → RATING_VALUE criterion
```

## 🧮 TOPSIS Algorithm

### Steps

1. **Build Decision Matrix** (m alternatives × n criteria)
2. **Normalize Matrix**: `r_ij = x_ij / √(Σx_ij²)`
3. **Apply Weights**: `v_ij = w_j × r_ij`
4. **Determine Ideal Solutions**:
   - A⁺ (best): max for benefit criteria, min for cost criteria
   - A⁻ (worst): min for benefit criteria, max for cost criteria
5. **Calculate Distances**:
   - S⁺ = √(Σ(v_ij - A⁺_j)²)
   - S⁻ = √(Σ(v_ij - A⁻_j)²)
6. **Calculate Similarity Score**: `C_i = S⁻ / (S⁺ + S⁻)`
7. **Rank by C_i** (higher = better)

## 🔧 Configuration

### Environment Variables

```bash
# Database
DB_NAME=stayhub
DB_USER=stayhub_user
DB_PASSWORD=stayhub_password
DB_HOST=localhost
DB_PORT=5432

# API
API_HOST=0.0.0.0
API_PORT=8000

# Reference location for distance calculation
REFERENCE_LAT=42.6526  # Albany, NY
REFERENCE_LON=-73.7562

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

### Customizing Influence Diagram

Edit `sql/02_seed_data.sql` to modify:
- Criteria definitions
- Influence node structure
- Weight factors between nodes

Then re-run:
```bash
./setup_database.sh
```

### Adding New Criteria

1. Add to `criteria` table:
```sql
INSERT INTO criteria (code, name, is_benefit, default_weight, unit)
VALUES ('NEW_CRITERION', 'New Criterion Name', TRUE, 0.1, 'unit');
```

2. Add to influence diagram (if needed)

3. Update `import_listings.py` to calculate values for new criterion

4. Re-import data

## 📊 Testing

### Test Database Connection

```bash
python3 -c "from src.api.database import test_connection; print(test_connection())"
```

### Test Influence Engine

```bash
python3 src/services/influence_engine.py
```

### Test TOPSIS Engine

```bash
python3 src/services/topsis_engine.py
```

### API Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests (when test files are created)
pytest
```

## 📝 Example Usage

### Using Python Client

```python
import requests

# API endpoint
url = "http://localhost:8000/api/v1/dss/recommend"

# Request
payload = {
    "preferences": {
        "convenience_importance": 0.7,
        "comfort_importance": 0.8,
        "value_importance": 0.9
    },
    "filters": {
        "max_price": 150,
        "min_rating": 4.5
    },
    "limit": 5
}

# Get recommendations
response = requests.post(url, json=payload)
results = response.json()

# Print top 3
for result in results['ranked_results'][:3]:
    room = result['room']
    print(f"#{result['rank']}: {room['name']}")
    print(f"  Price: ${room['price']}")
    print(f"  Score: {result['topsis_score']:.4f}")
    print(f"  {result['explanation']}")
    print()
```

### Using cURL

```bash
curl -X POST "http://localhost:8000/api/v1/dss/recommend" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "convenience_importance": 0.8,
      "comfort_importance": 0.9,
      "value_importance": 0.6
    },
    "filters": {
      "max_price": 150
    },
    "limit": 5
  }'
```

## 🛠️ Development

### Project Structure

```
stay-hub/
├── docker-compose.yml          # PostgreSQL container
├── requirements.txt            # Python dependencies
├── env.example                 # Environment template
├── setup_database.sh          # Database setup script
├── listings.csv               # Raw data (Airbnb listings)
├── sql/
│   ├── 01_schema.sql          # Database schema
│   └── 02_seed_data.sql       # Seed data
├── src/
│   ├── import_listings.py     # CSV import script
│   ├── api/
│   │   ├── main.py            # FastAPI application
│   │   ├── models.py          # Pydantic models
│   │   └── database.py        # DB connection pool
│   └── services/
│       ├── influence_engine.py  # Influence Diagram logic
│       └── topsis_engine.py     # TOPSIS algorithm
└── README.md
```

### Adding Features

1. **New Endpoints**: Add to `src/api/main.py`
2. **New Algorithms**: Create in `src/services/`
3. **New Models**: Add to `src/api/models.py`

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres

# Restart container
docker-compose down
docker-compose up -d
```

### PostgreSQL 18+ Volume Issues

If you get "boundary issues" errors:
- Volume mount should be `/var/lib/postgresql` (not `/var/lib/postgresql/data`)
- Remove old volumes: `docker-compose down -v`

### Import Fails

- Check CSV file path in `import_listings.py`
- Verify database schema exists: `./setup_database.sh`
- Check for data format issues

### API Errors

- Check `.env` configuration
- Verify database connection
- Review logs in terminal running uvicorn

## 📚 References

- **TOPSIS**: Hwang, C.L. and Yoon, K., 1981. Multiple attribute decision making: methods and applications
- **Influence Diagrams**: Howard, R.A. and Matheson, J.E., 2005. Influence diagrams
- **FastAPI**: https://fastapi.tiangolo.com/
- **PostgreSQL**: https://www.postgresql.org/docs/

## 📄 License

This project is for educational and research purposes.

## 👥 Contributors

Built for the BnB SmartChoice DSS project.

---

**Questions?** Open an issue or check the API documentation at `/docs`

