# 📁 Project Structure

## Directory Tree

```
stay-hub/
│
├── 📄 docker-compose.yml          # PostgreSQL container configuration
├── 📄 env.example                 # Environment variables template
├── 📄 .gitignore                  # Git ignore rules
├── 📄 requirements.txt            # Python dependencies
├── 📄 Makefile                    # Convenient commands
│
├── 📖 README.md                   # Full documentation
├── 📖 QUICKSTART.md              # Quick start guide
├── 📖 PROJECT_STRUCTURE.md       # This file
│
├── 🔧 setup_database.sh          # Database setup script
├── 🧪 test_api.py                # API test script
├── 📊 listings.csv               # Raw Airbnb listings data
│
├── 📂 sql/                       # Database SQL files
│   ├── 01_schema.sql            # Complete database schema
│   └── 02_seed_data.sql         # Criteria & influence diagram seed data
│
├── 📂 src/                       # Main source code
│   ├── __init__.py
│   │
│   ├── 📜 import_listings.py    # CSV to PostgreSQL import script
│   │
│   ├── 📂 api/                  # FastAPI application
│   │   ├── __init__.py
│   │   ├── main.py              # Main FastAPI app with endpoints
│   │   ├── models.py            # Pydantic request/response models
│   │   └── database.py          # Database connection pool
│   │
│   ├── 📂 services/             # Business logic & algorithms
│   │   ├── __init__.py
│   │   ├── influence_engine.py  # Influence Diagram processor
│   │   └── topsis_engine.py     # TOPSIS algorithm implementation
│   │
│   └── 📂 utils/                # Utility functions (future use)
│       └── __init__.py
│
└── 📂 venv/                     # Python virtual environment (git ignored)
```

---

## 📄 File Descriptions

### Configuration Files

#### `docker-compose.yml`
- Defines PostgreSQL 18 container
- Volume mount: `/var/lib/postgresql` for data persistence
- Port: 5432
- Default credentials for development

#### `env.example`
- Template for environment variables
- Copy to `.env` and customize
- Contains database, API, and reference location settings

#### `requirements.txt`
- Python package dependencies
- Core: FastAPI, psycopg2, numpy, pandas
- Dev tools: pytest, httpx

#### `.gitignore`
- Ignores venv, __pycache__, .env, etc.
- Standard Python gitignore patterns

#### `Makefile`
- Convenient command shortcuts
- Commands: install, db-up, db-setup, import-data, run, dev, test, clean
- Use `make help` to see all commands

---

### Documentation Files

#### `README.md`
- **Main documentation** with complete information
- Architecture overview
- Full setup instructions
- API endpoint documentation
- TOPSIS algorithm explanation
- Configuration guide
- Troubleshooting section

#### `QUICKSTART.md`
- **Quick start guide** for immediate setup
- Step-by-step 5-minute setup
- Example API calls
- Common troubleshooting

#### `PROJECT_STRUCTURE.md` (This File)
- Directory structure
- File descriptions
- Module purposes

---

### SQL Files

#### `sql/01_schema.sql`
**Complete database schema including:**

1. **Tables:**
   - `rooms` - Property listings (alternatives)
   - `criteria` - Evaluation dimensions
   - `room_attributes` - Decision matrix values
   - `influence_nodes` - Diagram nodes (ROOT, INTERMEDIATE, LEAF)
   - `influence_edges` - Node relationships & weights
   - `user_preferences` - Session preferences
   - `recommendation_results` - Cached results

2. **Views:**
   - `v_rooms_complete` - Rooms with all attributes
   - `v_influence_tree` - Influence diagram tree view

3. **Functions & Triggers:**
   - `update_updated_at_column()` - Auto-update timestamp

4. **Indexes:**
   - Performance indexes on commonly queried columns

#### `sql/02_seed_data.sql`
**Initial data:**

1. **Criteria definitions (8 criteria):**
   - Cost criteria: PRICE, DISTANCE_CENTER
   - Benefit criteria: RATING_OVERALL, RATING_CLEANLINESS, RATING_LOCATION, RATING_VALUE, ACCOMMODATES, AMENITIES_COUNT

2. **Influence diagram structure:**
   - 1 ROOT node (Overall Satisfaction)
   - 3 INTERMEDIATE nodes (Convenience, Comfort, Value)
   - 7 LEAF nodes (mapped to criteria)
   - Weighted edges connecting nodes

3. **Verification queries** to check data integrity

---

### Source Code

#### `src/import_listings.py`
**Purpose:** Import Airbnb listings from CSV to PostgreSQL

**Key functions:**
- `clean_price()`, `clean_boolean()`, `clean_numeric()` - Data cleaning
- `calculate_distance()` - Haversine formula for distance calculation
- `count_amenities()` - Parse amenities JSON
- `import_rooms()` - Batch insert rooms from CSV
- `calculate_and_insert_attributes()` - Populate decision matrix
- `print_statistics()` - Show import summary

**Usage:**
```bash
python3 src/import_listings.py
```

---

### API Module (`src/api/`)

#### `api/main.py`
**Main FastAPI application**

**Endpoints:**

1. **General:**
   - `GET /` - Root endpoint
   - `GET /health` - Health check
   - `GET /stats` - Database statistics

2. **Recommendations:**
   - `POST /api/v1/dss/recommend` - **Main endpoint**
     - Accepts user preferences & filters
     - Returns ranked recommendations with TOPSIS scores

3. **Data Access:**
   - `GET /api/v1/rooms/{room_id}` - Room details
   - `GET /api/v1/criteria` - All criteria
   - `GET /api/v1/influence-diagram` - Influence structure

**Startup/Shutdown:**
- Initializes database connection pool
- Tests database connection
- Closes connections on shutdown

#### `api/models.py`
**Pydantic models for type safety & validation**

**Request Models:**
- `UserPreferences` - User importance ratings (0-1)
- `Filters` - Hard constraints (price, rating, etc.)
- `RecommendationRequest` - Combined request

**Response Models:**
- `RoomSummary` - Room basic info
- `RecommendationResult` - Single ranked result
- `WeightExplanation` - Criterion weight explanation
- `RecommendationResponse` - Full response with rankings
- `HealthResponse`, `StatsResponse` - Utility responses

#### `api/database.py`
**Database connection management**

**Key classes:**
- `Database` - Connection pool manager (Singleton pattern)
- `get_db_connection()` - Context manager for safe connections
- `test_connection()` - Connection validation

**Features:**
- Connection pooling (min 1, max 10)
- Automatic connection return
- Environment-based configuration

---

### Services Module (`src/services/`)

#### `services/influence_engine.py`
**Influence Diagram processor**

**Key class: `InfluenceEngine`**

**Methods:**
- `get_influence_structure()` - Load diagram from DB
- `calculate_weights(user_preferences)` - Convert preferences to criterion weights
- `explain_weights()` - Generate human-readable explanations

**Algorithm:**
1. Load influence tree (nodes & edges)
2. Map user preferences to intermediate nodes
3. Propagate weights down the tree
4. Accumulate weights for each criterion
5. Normalize to sum = 1.0

**Example:**
```python
engine = InfluenceEngine(conn)
weights = engine.calculate_weights({
    'convenience_importance': 0.8,
    'comfort_importance': 0.9,
    'value_importance': 0.6
})
# Returns: {'PRICE': 0.25, 'RATING_OVERALL': 0.30, ...}
```

#### `services/topsis_engine.py`
**TOPSIS algorithm implementation**

**Key class: `TOPSISEngine`**

**Methods:**
- `get_decision_matrix()` - Retrieve data from DB
- `normalize_matrix()` - Vector normalization
- `apply_weights()` - Weight application
- `get_ideal_solutions()` - Calculate A+ and A-
- `calculate_distances()` - Euclidean distances
- `calculate_similarity_scores()` - C_i scores
- `rank_alternatives()` - Complete TOPSIS process
- `add_explanations()` - Generate explanations

**TOPSIS Steps:**
1. Build decision matrix (m × n)
2. Normalize: r_ij = x_ij / √(Σx_ij²)
3. Apply weights: v_ij = w_j × r_ij
4. Determine ideal: A⁺ (best), A⁻ (worst)
5. Calculate distances: S⁺, S⁻
6. Similarity score: C_i = S⁻ / (S⁺ + S⁻)
7. Rank by C_i descending

**Example:**
```python
engine = TOPSISEngine(conn)
results = engine.rank_alternatives(
    room_ids=[1, 2, 3, ...],
    criterion_weights={'PRICE': 0.25, ...}
)
# Returns: [{'rank': 1, 'room_id': 102, 'topsis_score': 0.875, ...}, ...]
```

---

### Utilities Module (`src/utils/`)
Currently empty, reserved for future utility functions.

Potential uses:
- Data validation helpers
- Math utilities
- Logging configuration
- Cache management

---

## 🔄 Data Flow

```
1. User Request
   ↓
2. FastAPI Endpoint (api/main.py)
   ↓
3. Influence Engine (services/influence_engine.py)
   - Convert preferences to weights
   ↓
4. Database Query
   - Filter rooms by constraints
   ↓
5. TOPSIS Engine (services/topsis_engine.py)
   - Rank alternatives
   ↓
6. Response Formatting
   - Add room details
   - Generate explanations
   ↓
7. JSON Response to User
```

---

## 🗄️ Database Architecture

```
┌─────────────────────────────────────────────┐
│           INFLUENCE DIAGRAM                 │
│  ┌──────────────┐      ┌──────────────┐   │
│  │ influence_   │──────│ influence_   │   │
│  │ nodes        │      │ edges        │   │
│  └──────────────┘      └──────────────┘   │
│         │                      │            │
│         └──────────────────────┴───────┐   │
│                                        │   │
└────────────────────────────────────────┼───┘
                                         │
         ┌───────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│           DECISION MATRIX                   │
│  ┌──────────┐   ┌──────────┐   ┌────────┐ │
│  │ criteria │───│  rooms   │───│ room_  │ │
│  │          │   │          │   │ attrib.│ │
│  └──────────┘   └──────────┘   └────────┘ │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│          USER SESSIONS & RESULTS            │
│  ┌──────────┐   ┌──────────────────────┐   │
│  │  user_   │───│ recommendation_      │   │
│  │  prefs   │   │ results              │   │
│  └──────────┘   └──────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 🧪 Testing

### `test_api.py`
**Comprehensive API test suite**

**Tests:**
1. Health check (`/health`)
2. Statistics (`/stats`)
3. Criteria listing (`/api/v1/criteria`)
4. Influence diagram (`/api/v1/influence-diagram`)
5. **Recommendations** (`/api/v1/dss/recommend`) - Main test
   - Multiple preference scenarios
   - Filter combinations
   - Performance measurement

**Usage:**
```bash
# Start API first
make dev

# In another terminal
python3 test_api.py
```

---

## 🔧 Scripts

### `setup_database.sh`
**Bash script to initialize database**

**Steps:**
1. Load environment variables from `.env`
2. Test database connection
3. Execute `01_schema.sql`
4. Execute `02_seed_data.sql`
5. Verify setup success

**Usage:**
```bash
chmod +x setup_database.sh
./setup_database.sh
```

---

## 📊 Data Files

### `listings.csv`
**Source data: Airbnb listings**

**Key columns used:**
- `id`, `name`, `description`
- `latitude`, `longitude`
- `price`, `room_type`, `accommodates`
- `review_scores_*` (rating, cleanliness, location, value)
- `amenities` (JSON array)
- `host_is_superhost`, `instant_bookable`

**Format:** CSV with header row, ~666 listings

---

## 🚀 Deployment Considerations

### Production Checklist

- [ ] Change database password in `.env`
- [ ] Set `DEBUG=false`
- [ ] Configure proper CORS origins
- [ ] Use production WSGI server (e.g., Gunicorn)
- [ ] Set up database backups
- [ ] Enable SSL/TLS
- [ ] Set up monitoring/logging
- [ ] Use environment-specific configs

### Docker Production

Consider creating `docker-compose.prod.yml`:
- Include both database and API containers
- Use secrets for credentials
- Set resource limits
- Enable health checks
- Use proper networks

---

## 📝 Notes

### Code Style
- Follow PEP 8 for Python
- Use type hints where appropriate
- Document complex functions
- Keep functions focused and small

### Git Workflow
- `.gitignore` excludes venv, .env, __pycache__
- Commit SQL schema changes separately
- Use meaningful commit messages

### Future Enhancements
- [ ] Add caching (Redis)
- [ ] Implement user sessions
- [ ] Add authentication/authorization
- [ ] Create frontend dashboard
- [ ] Add more criteria (e.g., cancellation policy)
- [ ] Implement A/B testing for influence weights
- [ ] Add recommendation explanations with visualizations
- [ ] Support multiple cities with different reference points
- [ ] Implement feedback loop to improve weights

---

**Last Updated:** January 2026

