# CottonCare AI Comprehensive Technical and Architecture Report

Version: 2.0 (Detailed Edition)
Date: 2026-03-24
Repository root: Major-project

## Executive Summary

CottonCare AI is a multi-client disease intelligence platform for cotton crops. It combines deep learning image classification, explainable AI (XAI), and role-based workflows to support farmers, experts, and administrators.

The repository currently contains two backend tracks:
- A modular FastAPI backend under app/ with robust configuration, authentication, and SQLAlchemy models.
- An inference-first backend under services/ that contains live disease prediction and XAI endpoints.

The system is functionally rich and deployment-ready at infrastructure level (Docker, docker-compose, Kubernetes), but architecturally split. This report provides a full technical picture of what exists today, how the end-to-end flow works, where integration gaps are, and how to converge to a single production-grade architecture.

## 1. Business and Functional Scope

### 1.1 Core Problem Addressed

Cotton leaf disease diagnosis in the field is often delayed due to limited expert access. CottonCare AI addresses this by allowing image-driven diagnosis through mobile/web channels and delivering immediate treatment guidance.

### 1.2 Functional Objectives

- Perform image-based disease classification for cotton leaves.
- Quantify confidence and severity for practical prioritization.
- Provide explainable reasoning (heatmap, features, lesion analysis).
- Support treatment recommendations (chemical, organic, preventive).
- Record scan and prediction history.
- Enable expert verification workflow.
- Provide dashboard analytics for operations and quality monitoring.

### 1.3 User Roles

- Farmer: submits images, views predictions/treatments/history.
- Expert: reviews and verifies AI outcomes.
- Admin: user management, oversight, analytics.

## 2. Current System Topology

## 2.1 Logical Architecture (As-Is)

- Client tier:
  - React dashboard in web_dashboard/
  - Flutter app in flutter_app/
  - Native Android app in android_app/
- API tier:
  - Modular API in app/
  - Inference API in services/api_xai.py
- AI/ML tier:
  - TensorFlow model from cotton_model_final.keras
  - XAI modules (Grad-CAM, lesion detector, narrative explanation)
- Data tier:
  - SQLAlchemy models in app/models/__init__.py
  - Additional repository-style persistence in db_operations.py
- Platform tier:
  - Dockerfile + docker-compose.yml
  - Kubernetes manifests in kubernetes/

## 2.2 Physical Runtime Variants

Variant A: Modular backend runtime
- Process entrypoint: app.main:app
- Typical command: gunicorn app.main:app ...
- Used in Dockerfile and docker-compose backend command.

Variant B: Inference backend runtime
- Process entrypoint: services/api_xai.py (api_xai:app via run_server.py)
- Exposes disease prediction and XAI endpoints.

Important: These two variants do not expose identical routes and do not share one unified contract.

## 3. Repository Deep Dive

### 3.1 Root-Level Assets

- run_server.py
  - Pre-flight checks (dependencies, model file, XAI module availability).
  - Starts uvicorn with api_xai:app.

- config.py
  - Legacy/general config with SQLite default and upload/log directories.

- requirements.txt
  - Includes ML stack, FastAPI stack, database stack, testing and tooling.

- cotton_model_final.keras
  - Trained classifier used by services/model_service.py.

- db_operations.py
  - Repository methods for scan/prediction/report/verification/audit write/read.

### 3.2 Modular Backend (app/)

- app/main.py
  - Creates FastAPI app with lifespan startup/shutdown.
  - Initializes DB and verifies health on startup.
  - Adds CORS middleware.
  - Registers API router under settings.API_V1_STR.
  - Registers validation, HTTP, and generic exception handlers.

- app/core/config.py
  - Pydantic BaseSettings for environment variables.
  - Controls host, port, database URL, JWT settings, upload limits, CORS, logging.

- app/core/database.py
  - SQLAlchemy engine creation with pooling.
  - SessionLocal and get_db dependency.
  - init_db, drop_db, health_check utilities.

- app/core/security.py
  - Bcrypt password hashing and verification.
  - JWT create/decode for access and refresh tokens.
  - Password strength policy enforcement.

- app/api/v1/auth.py
  - Register/login/refresh/me/logout endpoints.
  - Token extraction via HTTPBearer.
  - Current-user resolver using JWT and DB lookup.

- app/models/__init__.py
  - Rich relational schema:
    - User
    - Prediction
    - Verification
    - Treatment
    - AuditLog
    - UserStatistics
    - SystemMetrics

- app/schemas.py
  - Pydantic request/response contracts for auth, prediction, verification, analytics, and errors.

### 3.3 Inference and XAI Services (services/)

- services/api_xai.py
  - Primary endpoints for prediction and XAI.
  - Integrates model_service and severity_engine.
  - Attempts to include database integration router.
  - Also includes dashboard helper endpoints.

- services/model_service.py
  - Loads model at startup.
  - Image preprocessing:
    - resize to 380 x 380
    - EfficientNet preprocessing
  - Single and batch prediction methods.
  - Optional XAI generation and visualization packaging.

- services/xai_explainer.py
  - Grad-CAM generation pipeline.
  - FeatureDetector for disease indicators.
  - Lesion detection via HSV segmentation and contour processing.
  - ExplanationGenerator for narrative diagnosis rationale.

- services/xai_visualizations.py
  - Converts XAI outputs into visual artifacts.

- services/severity_engine.py
  - Confidence-threshold-based severity assignment per disease class.
  - Heuristic affected area estimation from color masks.

- services/treatment_db.py
  - Static treatment knowledge base for multiple diseases.

- services/api_db_integration.py
  - API facade over repository operations in db_operations.py.

### 3.4 Client Applications

Web dashboard (React):
- App routing in web_dashboard/src/App.jsx.
- Auth state in web_dashboard/src/context/AuthContext.jsx.
- API abstraction in web_dashboard/src/services/api.js.

Flutter app:
- API integration in flutter_app/lib/services/api_service.dart.
- Constants and disease lists in flutter_app/lib/utils/constants.dart.
- Screens for capture/results/history.

Native Android app:
- Single activity in android_app/app/src/main/java/MainActivity.java.
- Camera/gallery capture and multipart upload flow.

### 3.5 Infrastructure and DevOps

- Dockerfile
  - Multi-stage image build.
  - Runtime command set to gunicorn app.main:app.

- docker-compose.yml
  - Services:
    - postgres
    - redis
    - backend
  - Backend host port 8001 mapped to container 8000.

- kubernetes/deployment.yaml and service.yaml
  - API deployment with 3 replicas.
  - Service type LoadBalancer.

## 4. Technology Stack and Rationale

Backend and API:
- Python, FastAPI, Uvicorn, Gunicorn.
- Pydantic and pydantic-settings for strict contracts and config.

ML and CV:
- TensorFlow/Keras for classification model inference.
- NumPy for tensor operations.
- OpenCV and Pillow for image processing.

Data and security:
- SQLAlchemy ORM.
- PostgreSQL driver psycopg2-binary.
- JWT via pyjwt.
- Password security via passlib[bcrypt].

Frontend:
- React 18 ecosystem for dashboard.
- Axios for API connectivity.

Mobile:
- Flutter with Dio, image_picker, local persistence packages.
- Native Android Java sample using OkHttp.

Operations:
- Docker, docker-compose, Kubernetes.

## 5. Data Model and Information Architecture

### 5.1 Core Entities

User:
- Identity, role, auth metadata, farm context, activity timestamps.

Prediction:
- Image metadata and storage path.
- Predicted disease and confidence.
- Full class probability distribution.
- Severity score/level and affected area.
- XAI payload and visualization reference.
- Verification status.

Verification:
- Expert decision and feedback.
- Optional corrections and confidence adjustment.

Treatment:
- Disease details and treatment catalogs.

AuditLog:
- Action and resource traces for governance and debugging.

Statistics entities:
- UserStatistics and SystemMetrics for aggregate analytics.

### 5.2 Data Lifecycle

- Ingest: image upload from clients.
- Process: preprocessing, inference, explanation.
- Persist: scan/prediction/report/verifications (when integrated path enabled).
- Review: expert workflow updates trust state.
- Analyze: dashboard and operational metrics.

## 6. End-to-End Operational Flow

## 6.1 Primary Clinical Flow (Image to Decision)

1. User captures or selects leaf image in client application.
2. Client sends multipart request to prediction endpoint.
3. API validates MIME type and parses image bytes.
4. Image converted to RGB and normalized for model input.
5. Model inference computes class probabilities.
6. Top disease class and confidence extracted.
7. Severity engine maps confidence to severity level.
8. Optional XAI path executes:
   - Grad-CAM heatmap generation.
   - Lesion segmentation and feature extraction.
   - Explanation synthesis.
   - Visualization assembly.
9. API builds diagnosis payload.
10. Client renders result, confidence, severity, and guidance.

## 6.2 Persistence and Traceability Flow

1. Scan metadata saved through database integration route.
2. Prediction result persisted and scan status updated.
3. Report persisted with treatment and action information.
4. Verification record created and queued.
5. Expert updates status with feedback.
6. Audit events recorded for each action.

## 6.3 Expert Verification Flow

1. Expert authenticates via role-based dashboard.
2. Pending cases loaded.
3. Expert compares image, AI diagnosis, and explanation.
4. Expert submits approve/reject/needs_review decision.
5. System updates verification state.
6. Outcome can feed quality analytics and model governance.

## 6.4 Exception and Failure Paths

- Invalid file format:
  - Request rejected with 400-class error.

- Model or XAI initialization failure:
  - Service may continue in degraded mode (prediction-only or unavailable).

- DB unavailable:
  - health_check fails; startup may abort in modular backend path.

- Client-side auth token expiration:
  - API returns 401; web client clears token and redirects to login.

## 7. API Contract Inventory

## 7.1 Auth API (app/api/v1/auth.py)

Base: /api/v1/auth
- POST /register
- POST /login
- POST /refresh
- GET /me
- POST /logout

## 7.2 Inference and XAI API (services/api_xai.py)

- GET /health
- GET /info
- POST /predict
- POST /predict/xai
- POST /batch
- GET /explanation/{diagnosis_id}
- POST /analyze/heatmap
- POST /analyze/lesions
- POST /analyze/features
- GET /treatment/{disease}

## 7.3 Database Integration API (services/api_db_integration.py)

Base: /api/db
- POST /scan/save
- GET /scan/{scan_id}
- GET /scans/farmer/{farmer_id}
- PUT /scan/{scan_id}/status
- POST /prediction/save
- GET /prediction/{scan_id}
- POST /report/save
- GET /report/{report_id}
- GET /verifications/pending
- PUT /verification/{verification_id}
- GET /health

## 8. Security Architecture

Authentication:
- JWT access and refresh token model.

Authorization:
- Role semantics present (farmer, expert, admin).
- Selected routes protected via current-user dependency.

Credential handling:
- Passwords hashed using bcrypt (passlib context).

Input protection:
- Pydantic schema validation and FastAPI validation handlers.

Operational security:
- CORS middleware present.
- Potential to integrate HTTPS, rate limits, WAF, and token revocation.

## 9. Observability and Reliability

Current controls:
- Logging configured in startup and service modules.
- Health endpoints in backend services.
- Docker healthcheck configured.

Recommended production controls:
- Structured JSON logs with correlation IDs.
- Request tracing and latency metrics.
- Error monitoring integration (Sentry dependency is present).
- Model inference timing dashboards.
- DB pool, queue, and timeout monitoring.

## 10. Deployment Architecture and Environments

## 10.1 Local Development

- Python virtual environment in venv.
- Run via run_server.py for XAI service path.
- Run via uvicorn/gunicorn for modular backend.

## 10.2 Containerized Development and Production

- docker-compose stacks postgres, redis, backend.
- backend exposes 8001 externally.
- model and uploads mounted as volumes.

## 10.3 Kubernetes Deployment

- API deployment with 3 replicas.
- resource requests/limits configured.
- liveness/readiness probes defined.
- service type LoadBalancer.

## 11. Frontend and Mobile Integration View

## 11.1 React Dashboard Integration

- Uses axios instance with auth interceptor.
- Calls multiple API groups including dashboard/cases/users/analytics.
- Uses protected routes for role-based views.

## 11.2 Flutter Integration

- Calls health and prediction endpoints (including /predict/xai).
- Uses configurable base URL in api_service.dart.
- Has local constants and disease catalog that should match backend model outputs.

## 11.3 Native Android Integration

- Uses multipart upload through OkHttp.
- Endpoint and response structure assumptions must be aligned with backend contract.

## 12. Architecture Gaps and Technical Debt (Critical)

1. Dual backend fragmentation:
- app/ and services/ expose overlapping but different APIs.
- No single canonical backend contract.

2. Route mismatch across clients:
- Web/mobile route assumptions do not fully align with implemented modular API routers.

3. Database integration ambiguity:
- db_operations.py imports a database module from root path that is not present as a standalone file in repository structure.

4. Duplicate endpoint declarations:
- services/api_xai.py contains repeated health/info route definitions.

5. Missing module references:
- services/__init__.py references ml_prediction_service which does not exist.

6. Incomplete treatment integration:
- treatment endpoint currently returns placeholder response instead of serving treatment_db content directly.

7. Port and path drift:
- Kubernetes and Android samples mention port 5000 while most active configs use 8000/8001.

8. Contract drift in disease labels:
- Flutter constants include disease names not present in the current model class list.

## 13. Risks and Impact Analysis

Operational risks:
- Integration errors when clients call non-existent routes.
- Data integrity and observability gaps in split persistence paths.

Security risks:
- Potential for inconsistent auth enforcement across split APIs.
- Lack of centralized token revocation/blacklisting.

Model governance risks:
- No explicit model versioning endpoint in public API.
- Limited closed-loop feedback integration from expert verification back to model lifecycle.

Maintainability risks:
- Duplicate logic and inconsistent domain ownership.
- Harder onboarding and higher defect probability.

## 14. Recommended Target Architecture

Target principle: one backend, one contract, one persistence model.

### 14.1 Convergence Plan

Phase 1: API unification
- Move inference routers into app/api/v1.
- Keep app.main as only process entrypoint.

Phase 2: service layer consolidation
- Relocate model_service, xai_explainer, severity_engine into app/services.
- Keep clear domain boundaries:
  - inference service
  - explanation service
  - treatment service
  - verification service

Phase 3: persistence alignment
- Use app/core/database.py + app/models as single source.
- Refactor db_operations to use same SQLAlchemy session and entities.

Phase 4: client contract hardening
- Publish OpenAPI spec as canonical contract.
- Update web/flutter/android clients to match.

Phase 5: reliability and security hardening
- Add rate limits, request IDs, centralized logging, and token lifecycle controls.
- Add integration tests across main user journeys.

## 15. Implementation Blueprint (Detailed)

## 15.1 API Restructuring Blueprint

- Create new routers:
  - app/api/v1/predictions.py
  - app/api/v1/xai.py
  - app/api/v1/treatments.py
  - app/api/v1/verifications.py
  - app/api/v1/dashboard.py

- Include in app/api/v1/__init__.py and keep one prefix policy.

## 15.2 Data and Domain Blueprint

- Map existing services Prediction payload to app.schemas PredictionResponse.
- Normalize severity enum casing.
- Add model_version and inference_metadata fields where missing.

## 15.3 Deployment Blueprint

- Align all health probes to /health on unified backend.
- Standardize container port and service port mapping.
- Keep one process command across Docker and Kubernetes.

## 15.4 Testing Blueprint

- Unit tests:
  - preprocessing
  - severity thresholds
  - token encode/decode
  - schema validation

- Integration tests:
  - predict endpoint with mock image
  - auth + protected route access
  - save/report/verify pipeline

- Contract tests:
  - dashboard client expected payloads
  - flutter parsing compatibility

## 16. Performance Characteristics and Capacity Considerations

Inference latency contributors:
- image decode and preprocessing
- model forward pass
- optional XAI generation
- visualization encoding overhead

Scalability levers:
- scale replicas (Kubernetes deployment)
- split prediction and XAI into separate workers
- async queue for heavy visualizations
- cache repeated lookups (treatment metadata, static disease info)

Database performance levers:
- index verification queue and prediction timestamps
- optimize query patterns for dashboard aggregates
- use read replicas for analytics in future scale scenarios

## 17. Compliance, Traceability, and Auditability

Current strengths:
- audit log entity exists in schema.
- verification actions modeled explicitly.

Recommended enhancements:
- immutable event IDs and request correlation.
- audit retention policy and secure archival.
- role-based action policy matrix documented and enforced at router level.

## 18. End-to-End Sequence Narratives

## 18.1 Farmer Scan Sequence

1. Farmer captures image.
2. Client uploads image.
3. API validates and preprocesses.
4. Model predicts disease and confidence.
5. Severity computed.
6. XAI optionally generated.
7. Result returned and displayed.
8. Optional persistence and report creation.

## 18.2 Expert Verification Sequence

1. Expert logs in.
2. Pending case loaded.
3. Expert reviews diagnosis plus explanations.
4. Expert submits decision and comments.
5. Verification and audit updated.
6. Case status reflected in dashboard.

## 18.3 Admin Analytics Sequence

1. Dashboard queries aggregate endpoints.
2. Backend collects counts, distributions, trends.
3. UI renders KPIs and operational views.

## 19. Final Architecture Assessment

The project already demonstrates strong technical capability:
- robust ML inference foundation
- explainability pipeline
- multi-client presence
- deployment scaffolding for production environments

The main architectural challenge is consolidation. Once backend and contract unification are completed, CottonCare AI can evolve into a highly maintainable, auditable, and scalable production platform suitable for real agricultural operations.

## 20. Actionable Next Steps

Immediate (1 to 2 weeks):
- freeze canonical route set.
- remove duplicate route definitions.
- align ports and health paths.
- fix missing module references.

Near-term (2 to 6 weeks):
- migrate inference endpoints into app/ router architecture.
- unify persistence and schema usage.
- align all client API services.

Mid-term (6 to 12 weeks):
- implement integration and contract test pipelines.
- add observability dashboards.
- add model lifecycle and feedback loop governance.

---

Prepared as a complete technical and architectural report for engineering, product, and deployment stakeholders.
