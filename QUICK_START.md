# 🚀 Quick Start Guide - Database & API Testing

This guide walks through setting up and testing the new farmer profile and GPS features.

## Prerequisites
- Python 3.13+ with venv activated
- All packages installed: `pip install -r requirements.txt`
- Database configured in `.env` (SQLite or PostgreSQL)

---

## 1️⃣ Initialize Database

Run this to create all tables from SQLAlchemy models:

```bash
python init_db.py
```

**Expected Output:**
```
Database Initialization - CottonCare AI
Database URL: sqlite:///./cottoncare_dev.db
Creating all tables from models...
✅ Database initialized successfully!

Tables created:
  • users
      - id: VARCHAR
      - email: VARCHAR
      - password_hash: VARCHAR
      - first_name: VARCHAR
      ... (25+ user fields)
  
  • analyses
      - id: VARCHAR
      - user_id: VARCHAR
      - disease_detected: VARCHAR
      - latitude: FLOAT
      - longitude: FLOAT
      ... (GPS + disease fields)

✨ Ready to use! Start the server with: python run_server.py
```

---

## 2️⃣ Start API Server

```bash
python run_server.py
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

Server will be available at: **http://localhost:8000**

API Docs: **http://localhost:8000/docs** (Swagger UI)

---

## 3️⃣ Run API Tests

In a new terminal (with venv activated):

```bash
python test_api.py
```

**Test Coverage:**
- ✅ Health check
- ✅ Quick signup (5 fields)
- ✅ Login & token generation
- ✅ Get current user
- ✅ Complete profile (farm details)
- ✅ Image analysis with GPS data
- ✅ Get analysis history

---

## 📚 API Endpoints

### Authentication
```
POST   /auth/register           Quick signup (5 fields)
POST   /auth/login              Get access token
POST   /auth/profile/complete   Update full profile
GET    /auth/me                 Get current user info
POST   /auth/logout             Logout
```

### Analysis
```
POST   /analysis/analyze        Upload image + GPS data
GET    /analysis/history        Get past analyses
GET    /analysis/history/{id}   Get specific analysis
```

### Query Parameters for Analysis
```
POST /analysis/analyze?latitude=15.45&longitude=75.74&location_accuracy=25&environment_conditions=Sunny
```

---

## 🧪 Manual Testing Examples

### 1. Quick Signup
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "MyPassword123!",
    "full_name": "John Farmer",
    "phone": "9876543210",
    "location": "Dharwad, Karnataka"
  }'
```

### 2. Login
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "MyPassword123!"
  }'
```

### 3. Complete Profile
```bash
curl -X POST "http://localhost:8000/auth/profile/complete" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Farmer",
    "village_town": "Dharwad",
    "district": "Dharwad",
    "state": "Karnataka",
    "soil_type": "black",
    "irrigation_source": "borewell",
    "cotton_variety": "Bt",
    "farming_experience_years": 12
  }'
```

### 4. Analyze Image with GPS
```bash
curl -X POST "http://localhost:8000/analysis/analyze?latitude=15.45&longitude=75.74&location_accuracy=25&environment_conditions=Sunny" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/cotton_leaf.jpg"
```

---

## 🐛 Troubleshooting

### "Cannot connect to API"
- Make sure server is running: `python run_server.py`
- Check it's on http://localhost:8000
- Verify firewall allows port 8000

### "Database initialization failed"
- Check SQLite DB file location: `cottoncare_dev.db`
- Or set `DATABASE_URL` in `.env` for PostgreSQL
- Delete old `.db` file and retry

### "Module not found: PIL"
- Install: `pip install pillow`
- Required for test_api.py to create test images

### "Auth token expired"
- Tokens last 15 minutes by default
- Run login again to get new token
- Or check `ACCESS_TOKEN_EXPIRE_MINUTES` in config

---

## 📊 Database Schema

### Users Table (New Fields)
```sql
-- Personal
id, email, password_hash, role, is_active
first_name, last_name, phone, age, date_of_birth
preferred_language

-- Location (GPS Optional)
village_town, taluk_block, district, state, pincode
latitude, longitude

-- Farm
farm_name, total_land_acres, num_cotton_fields
soil_type, irrigation_source

-- Cultivation
cotton_variety, sowing_date, current_season

-- Experience
farming_experience_years, past_disease_history
pesticide_usage_habits

-- Preferences
notification_preference, profile_completion (0-100%)
created_at, updated_at
```

### Analyses Table (New GPS Fields)
```sql
id, user_id, image_filename, image_path
latitude, longitude, location_accuracy (meters)
environment_conditions
disease_detected, confidence, confidence_percentage
affected_area_percentage
lesion_count, lesion_details, heatmap_data
severity_level, severity_score
inference_time
analyzed_at
```

---

## ✅ Verification Checklist

- [ ] Database initialized without errors
- [ ] Server starts on http://localhost:8000
- [ ] All 8 API tests pass successfully
- [ ] Quick signup works (user_id returned)
- [ ] Profile completion works (completion % updated)
- [ ] Analysis with GPS data stored correctly
- [ ] Frontend signup page accessible at /signup
- [ ] AnalyzePage accessible at /analyze with camera & upload

---

## 🔗 Related Documentation

- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Full project setup
- [README.md](README.md) - Project overview
- [PROJECT_ARCHITECTURE_AND_FLOW.md](PROJECT_ARCHITECTURE_AND_FLOW.md) - System architecture

---

## 📞 Next Steps

1. ✅ **Current**: Initialize DB + test API
2. ⏳ **Next**: Test Frontend signup page
3. ⏳ **Next**: Test AnalyzePage GPS capture
4. ⏳ **Next**: Add regional language support
5. ⏳ **Next**: Deploy to production
