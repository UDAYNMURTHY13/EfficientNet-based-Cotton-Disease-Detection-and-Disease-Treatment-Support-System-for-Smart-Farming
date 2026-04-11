# CottonCare AI - Production Frontend & Backend Setup Guide

## 📋 Overview

This guide provides complete instructions for setting up the new production-ready CottonCare AI application with farmer authentication, image analysis, and disease detection.

## 🏗️ Architecture

```
CottonCare AI
├── Backend (Python/FastAPI)
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── analysis.py (NEW - Image upload & analysis)
│   │   │   └── auth.py (Authentication endpoints)
│   │   ├── core/
│   │   │   ├── auth.py (JWT & security)
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── models/
│   │   │   └── db_models.py (NEW - DB schemas)
│   │   └── schemas.py (Pydantic validation)
│   ├── services/
│   │   ├── disease_analysis_pipeline.py (4-stage analysis)
│   │   ├── model_service.py
│   │   ├── xai_explainer.py
│   │   └── xai_visualizations.py
│   └── run_server.py
│
└── Frontend (React)
    └── web_dashboard_new/
        ├── public/
        ├── src/
        │   ├── pages/
        │   │   ├── LoginPage.jsx (NEW)
        │   │   ├── SignupPage.jsx (NEW)
        │   │   ├── DashboardPage.jsx (NEW)
        │   │   ├── AnalyzePage.jsx (NEW - Core analysis UI)
        │   │   ├── HistoryPage.jsx (NEW)
        │   │   └── ProfilePage.jsx (NEW)
        │   ├── components/
        │   │   ├── PrivateRoute.jsx (NEW - Auth protection)
        │   │   ├── AnalysisResults.jsx (NEW - Results display)
        │   │   └── Camera.jsx (NEW - Real-time camera)
        │   ├── context/
        │   │   └── AuthContext.jsx (NEW - Auth state)
        │   ├── services/
        │   │   └── api.js (NEW - API client)
        │   ├── styles/
        │   │   ├── App.css (NEW)
        │   │   ├── auth.css (NEW)
        │   │   ├── analyze.css (NEW)
        │   │   ├── results.css (NEW)
        │   │   ├── dashboard.css (NEW)
        │   │   ├── history.css (NEW)
        │   │   ├── profile.css (NEW)
        │   │   └── camera.css (NEW)
        │   ├── App.jsx (NEW - Main router)
        │   └── index.jsx
        ├── package.json
        └── .env.example
```

## 🚀 Backend Setup

### 1. Install Dependencies

```bash
cd c:\Users\udayn\Documents\Major-project
pip install -r requirements.txt
```

### 2. Configure Database

Create `.env` file:
```
DATABASE_URL=sqlite:///./cotton_care.db
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
```

### 3. Initialize Database

```bash
python -c "from app.core.database import init_db; init_db()"
```

### 4. Start Backend Server

```bash
python run_server.py
```

Server will run on `http://localhost:8000`

### 5. API Endpoints

**Authentication:**
- `POST /auth/signup` - Register new farmer
- `POST /auth/login` - Login farmer
- `GET /auth/me` - Get current user
- `PUT /auth/profile` - Update profile

**Analysis:**
- `POST /analysis/analyze` - Upload image and analyze (requires auth)
- `GET /analysis/history` - Get analysis history (requires auth)
- `GET /analysis/history/{id}` - Get analysis details
- `DELETE /analysis/history/{id}` - Delete analysis
- `GET /analysis/stats` - Get user statistics

**Health:**
- `GET /health` - Health check
- `GET /info` - API info

## 💻 Frontend Setup (React)

### 1. Navigate to Frontend Directory

```bash
cd web_dashboard_new
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create .env File

```bash
REACT_APP_API_URL=http://localhost:8000
```

### 4. Start Development Server

```bash
npm start
```

Frontend runs on `http://localhost:3000`

### 5. Build for Production

```bash
npm run build
```

## 📱 Features

### 🔐 Authentication
- Farmer signup with email, phone, name, and farm details
- Secure JWT-based authentication
- Auto-logout on token expiration (30 days)
- Protected routes using PrivateRoute component

### 📸 Image Analysis
1. **Upload Mode**
   - Click or drag-drop image files
   - Support for JPG, PNG, WebP
   - Image preview before analysis

2. **Camera Mode**
   - Real-time camera capture
   - Switch between front/back camera
   - Instant photo capture

3. **Analysis Pipeline**
   - Stage 1: Disease detection (ML model)
   - Stage 2: Affected area analysis
   - Stage 3: Lesion detection & heatmap
   - Stage 4: Severity estimation

### 📊 Results Display
- Disease name with confidence percentage
- Severity level (Healthy/Mild/Moderate/Severe/Critical)
- Affected area percentage
- Lesion count and locations
- XAI explanations (Grad-CAM, indicators)
- Treatment recommendations
- Detailed analysis reasoning

### 📋 Analysis History
- Paginated list of all analyses
- Filter by disease/severity
- View detailed results
- Delete old analyses

### 👤 User Profile
- View/edit farm information
- Monitor account details
- Logout functionality

## 🔄 Complete User Flow

### New Farmer Registration
1. Click "Sign up" on login page
2. Enter email, phone, name, farm details
3. Create password (8+ characters)
4. Account created, auto-logged in
5. Redirected to dashboard

### Analyze Cotton Leaf
1. Go to "Analyze" page
2. Choose upload or camera mode
3. Select/capture cotton leaf image
4. Click "Analyze Image"
5. Wait for 4-stage pipeline (usually <2 seconds)
6. View comprehensive analysis results
7. Save analysis to history

### View Analysis History
1. Go to "History" page
2. Browse all previous analyses
3. Sort by date
4. Click eye icon to view details
5. Delete analyses if needed

## 🗄️ Database Schema

### Users Table
```sql
id (Primary Key)
email (Unique)
phone (Unique)
password_hash
name
farm_name
location
role (farmer/admin)
is_active
created_at
updated_at
```

### Analyses Table
```sql
id (Primary Key)
user_id (Foreign Key)
image_filename
image_path
disease_detected
confidence
confidence_percentage
affected_area_percentage
lesion_count
lesion_details (JSON)
heatmap_data (JSON)
severity_level
severity_score
reasoning
recommendation
indicators (JSON)
inference_time
analyzed_at
created_at
```

## 🔒 Security Features

1. **Password Hashing** - Bcrypt encryption
2. **JWT Authentication** - Secure token-based auth
3. **CORS Protection** - Configured for secure cross-origin requests
4. **Input Validation** - Pydantic models for all inputs
5. **Protected Routes** - React PrivateRoute component
6. **Token Storage** - LocalStorage with auto-logout

## 🚢 Deployment Checklist

### Backend
- [ ] Change `SECRET_KEY` to strong random string
- [ ] Set `DATABASE_URL` to production database
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up error logging
- [ ] Enable rate limiting
- [ ] Configure backup strategy

### Frontend
- [ ] Update `REACT_APP_API_URL` to production URL
- [ ] Run `npm run build`
- [ ] Deploy to hosting (Vercel, Netlify, AWS, etc.)
- [ ] Configure environment variables
- [ ] Enable caching headers
- [ ] Set up CDN

## 📦 Dependencies

### Backend
- FastAPI - Web framework
- SQLAlchemy - ORM
- Pydantic - Data validation
- python-jose - JWT handling  
- passlib - Password hashing
- TensorFlow - ML model
- Pillow - Image processing
- OpenCV - Computer vision
- uvicorn - ASGI server

### Frontend
- React 18+ - UI library
- React Router - Navigation
- Fetch API - HTTP requests
- CSS3 - Styling

## 🐛 Troubleshooting

### Backend Issues
```bash
# Check Python version
python --version  # Requires 3.9+

# Verify TensorFlow installation
python -c "import tensorflow; print(tensorflow.__version__)"

# Check database connection
python -c "from app.core.database import health_check; health_check()"

# Clear cache and reinstall
pip cache purge
pip install --upgrade -r requirements.txt
```

### Frontend Issues
```bash
# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Check React version
npm list react

# Build issues
npm run build --verbose

# Clear cache
npm cache clean --force
```

### API Connection Issues
- Verify backend is running: `curl http://localhost:8000/health`
- Check CORS settings in `api_xai.py`
- Verify `REACT_APP_API_URL` environment variable
- Check browser console for detailed errors

## 📚 API Request Examples

### Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer@example.com","password":"password123"}'
```

### Upload Image
```bash
curl -X POST http://localhost:8000/analysis/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

### Get History
```bash
curl http://localhost:8000/analysis/history?page=1&page_size=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎨 UI/UX Features

- **Modern Design** - Gradient backgrounds, smooth animations
- **Responsive Layout** - Mobile, tablet, desktop support
- **Accessibility** - ARIA labels, semantic HTML
- **Dark Mode Ready** - CSS custom properties for theming
- **Loading States** - Spinner and progress indicators
- **Error Handling** - User-friendly error messages
- **Real-time Feedback** - Toast notifications
- **Optimistic UI** - Seamless user interactions

## 📞 Support

For issues or questions:
1. Check documentation
2. Review error messages
3. Check backend logs
4. Check browser console (DevTools)
5. Review terminal output

---

**Version:** 3.0  
**Last Updated:** April 2026  
**Status:** Production Ready
