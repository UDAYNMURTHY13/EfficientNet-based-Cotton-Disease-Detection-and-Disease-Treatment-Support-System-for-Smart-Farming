"""
Admin API endpoints — full system control
Requires role = 'admin'
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from datetime import datetime, timedelta
import uuid

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.core.security import hash_password as get_password_hash
from app.models.db_models import User, Analysis, ExpertReview, ExpertMessage
import os as _os


def _image_url(a: Analysis) -> str:
    """Derive the correct /uploads/ filename from image_path (handles legacy rows)."""
    if a.image_path:
        return _os.path.basename(a.image_path)
    return a.image_filename or ""

router = APIRouter(prefix="/admin", tags=["admin"])


# ─────────────────────────────────────────────
#  Role guard
# ─────────────────────────────────────────────

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


# ─────────────────────────────────────────────
#  Stats
# ─────────────────────────────────────────────

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """System-wide statistics"""
    total_users     = db.query(func.count(User.id)).scalar() or 0
    active_users    = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    total_farmers   = db.query(func.count(User.id)).filter(User.role == "farmer").scalar() or 0
    total_experts   = db.query(func.count(User.id)).filter(User.role == "expert").scalar() or 0
    total_analyses  = db.query(func.count(Analysis.id)).scalar() or 0
    pending_reviews = db.query(func.count(Analysis.id)).filter(
        ~Analysis.id.in_(db.query(ExpertReview.analysis_id))
    ).scalar() or 0

    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_analyses = db.query(func.count(Analysis.id)).filter(
        Analysis.analyzed_at >= week_ago
    ).scalar() or 0

    disease_dist = db.query(
        Analysis.disease_detected, func.count(Analysis.id).label("count")
    ).group_by(Analysis.disease_detected).all()

    severity_dist = db.query(
        Analysis.severity_level, func.count(Analysis.id).label("count")
    ).group_by(Analysis.severity_level).all()

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_farmers": total_farmers,
        "total_experts": total_experts,
        "total_analyses": total_analyses,
        "pending_expert_reviews": pending_reviews,
        "recent_analyses_7d": recent_analyses,
        "disease_distribution": [{"disease": d or "Unknown", "count": c} for d, c in disease_dist],
        "severity_distribution": [{"severity": s or "Unknown", "count": c} for s, c in severity_dist],
    }


# ─────────────────────────────────────────────
#  Users
# ─────────────────────────────────────────────

@router.get("/users")
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    role: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """List all users with optional filters"""
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    if is_active is not None:
        q = q.filter(User.is_active == is_active)
    if search:
        q = q.filter(
            User.email.ilike(f"%{search}%")
            | User.first_name.ilike(f"%{search}%")
            | User.phone.ilike(f"%{search}%")
        )

    total = q.count()
    users = q.order_by(desc(User.created_at)).offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "phone": u.phone,
                "role": u.role,
                "is_active": u.is_active,
                "district": u.district,
                "state": u.state,
                "profile_completion": u.profile_completion,
                "analyses_count": len(u.analyses),
                "created_at": str(u.created_at),
            }
            for u in users
        ],
    }


@router.get("/users/{user_id}")
def get_user(user_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """Get a single user's full details"""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": u.id, "email": u.email, "first_name": u.first_name, "last_name": u.last_name,
        "phone": u.phone, "role": u.role, "is_active": u.is_active,
        "district": u.district, "state": u.state, "village_town": u.village_town,
        "taluk_block": u.taluk_block, "pincode": u.pincode,
        "farm_name": u.farm_name, "total_land_acres": u.total_land_acres,
        "farming_experience_years": u.farming_experience_years,
        "cotton_variety": u.cotton_variety, "soil_type": u.soil_type,
        "irrigation_source": u.irrigation_source,
        "preferred_language": u.preferred_language,
        "notification_preference": u.notification_preference,
        "profile_completion": u.profile_completion,
        "created_at": str(u.created_at),
        "analyses_count": len(u.analyses),
    }


@router.patch("/users/{user_id}")
def update_user(
    user_id: str,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Update user role or active status"""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if user_id == current_admin.id and data.get("role") and data["role"] != "admin":
        raise HTTPException(status_code=400, detail="Cannot demote your own admin account")

    allowed = {"role", "is_active", "first_name", "last_name", "phone"}
    for k, v in data.items():
        if k in allowed:
            setattr(u, k, v)
    db.commit()
    return {"message": "User updated", "id": user_id}


@router.delete("/users/{user_id}")
def deactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Soft-delete (deactivate) a user"""
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.is_active = False
    db.commit()
    return {"message": "User deactivated", "id": user_id}


# ─────────────────────────────────────────────
#  Create Expert Account (admin-only)
# ─────────────────────────────────────────────

@router.post("/create-expert", status_code=status.HTTP_201_CREATED)
def create_expert(data: dict = Body(...), db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """Create a new expert account"""
    required = ("email", "password", "first_name")
    for f in required:
        if not data.get(f):
            raise HTTPException(status_code=400, detail=f"'{f}' is required")

    if db.query(User).filter(User.email == data["email"]).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    expert = User(
        id=str(uuid.uuid4()),
        email=data["email"],
        password_hash=get_password_hash(data["password"]),
        first_name=data["first_name"],
        last_name=data.get("last_name"),
        phone=data.get("phone", ""),
        role="expert",
        is_active=True,
        profile_completion=30,
    )
    db.add(expert)
    db.commit()
    db.refresh(expert)
    return {"message": "Expert account created", "id": expert.id, "email": expert.email}


# ─────────────────────────────────────────────
#  Analyses
# ─────────────────────────────────────────────

@router.get("/analyses")
def list_analyses(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    disease: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """List all analyses across all users"""
    q = db.query(Analysis)
    if disease:
        q = q.filter(Analysis.disease_detected.ilike(f"%{disease}%"))
    if severity:
        q = q.filter(Analysis.severity_level.ilike(f"%{severity}%"))

    total = q.count()
    analyses = q.order_by(desc(Analysis.analyzed_at)).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for a in analyses:
        farmer = db.query(User).filter(User.id == a.user_id).first()
        review = a.expert_review
        result.append({
            "id": a.id,
            "image_filename": a.image_filename,
            "image_url": _image_url(a),
            "disease_detected": a.disease_detected,
            "confidence": a.confidence,
            "severity_level": a.severity_level,
            "severity_score": a.severity_score,
            "affected_area_percentage": a.affected_area_percentage,
            "location_name": a.location_name,
            "latitude": a.latitude,
            "longitude": a.longitude,
            "analyzed_at": str(a.analyzed_at),
            "farmer_name": farmer.first_name if farmer else "Unknown",
            "farmer_district": farmer.district if farmer else None,
            "reviewed": review is not None,
            "review_status": review.status if review else None,
        })

    return {"total": total, "page": page, "per_page": per_page, "analyses": result}


@router.get("/analyses/{analysis_id}")
def get_analysis_detail(
    analysis_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Full analysis detail — AI output + expert review — for admin view"""
    a = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Analysis not found")

    farmer = db.query(User).filter(User.id == a.user_id).first()
    review = a.expert_review
    expert = db.query(User).filter(User.id == review.expert_id).first() if review else None

    return {
        # ── AI output ──────────────────────────────────────────────────
        "id": a.id,
        "image_url": _image_url(a),
        "disease_detected": a.disease_detected,
        "confidence": a.confidence,
        "confidence_percentage": a.confidence_percentage,
        "affected_area_percentage": a.affected_area_percentage,
        "lesion_count": a.lesion_count,
        "severity_level": a.severity_level,
        "severity_score": a.severity_score,
        "reasoning": a.reasoning,
        "recommendation": a.recommendation,
        "indicators": a.indicators,
        "latitude": a.latitude,
        "longitude": a.longitude,
        "location_name": a.location_name,
        "analyzed_at": str(a.analyzed_at),
        # ── Farmer ─────────────────────────────────────────────────────
        "farmer": {
            "id": farmer.id if farmer else None,
            "name": f"{farmer.first_name or ''} {farmer.last_name or ''}".strip() if farmer else "Unknown",
            "email": farmer.email if farmer else None,
            "phone": farmer.phone if farmer else None,
            "district": farmer.district if farmer else None,
            "state": farmer.state if farmer else None,
            "village_town": farmer.village_town if farmer else None,
            "farm_name": farmer.farm_name if farmer else None,
            "total_land_acres": farmer.total_land_acres if farmer else None,
        },
        # ── Expert review ───────────────────────────────────────────────
        "expert_review": (
            {
                "id": review.id,
                "expert_name": f"{expert.first_name or ''} {expert.last_name or ''}".strip() if expert else "Unknown Expert",
                "expert_email": expert.email if expert else None,
                "status": review.status,
                "ai_correct": review.ai_correct,
                "confirmed_disease": review.confirmed_disease,
                "urgency_level": review.urgency_level,
                "expert_notes": review.expert_notes,
                "treatment_recommendation": review.treatment_recommendation,
                "follow_up_date": str(review.follow_up_date) if review.follow_up_date else None,
                "reviewed_at": str(review.reviewed_at),
            }
            if review else None
        ),
    }


@router.delete("/analyses/{analysis_id}")
def delete_analysis(analysis_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """Permanently delete an analysis"""
    a = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Analysis not found")
    db.delete(a)
    db.commit()
    return {"message": "Analysis deleted", "id": analysis_id}
# ─────────────────────────────────────────────
#  Disease Trends
# ─────────────────────────────────────────────

@router.get("/disease-trends")
def disease_trends(
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Disease frequency over the specified period"""
    since = datetime.utcnow() - timedelta(days=days)
    rows = db.query(
        Analysis.disease_detected,
        func.count(Analysis.id).label("count"),
        func.avg(Analysis.confidence).label("avg_conf"),
    ).filter(Analysis.analyzed_at >= since).group_by(Analysis.disease_detected).all()

    return {
        "period_days": days,
        "trends": [
            {
                "disease": r.disease_detected or "Unknown",
                "count": r.count,
                "avg_confidence_pct": round((r.avg_conf or 0) * 100, 1),
            }
            for r in sorted(rows, key=lambda x: x.count, reverse=True)
        ],
    }


# ─────────────────────────────────────────────
#  Expert reviews overview (read-only for admin)
# ─────────────────────────────────────────────

@router.get("/expert-reviews")
def list_expert_reviews(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    total = db.query(func.count(ExpertReview.id)).scalar() or 0
    reviews = (
        db.query(ExpertReview)
        .order_by(desc(ExpertReview.reviewed_at))
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "reviews": [
            {
                "id": r.id,
                "analysis_id": r.analysis_id,
                "expert_id": r.expert_id,
                "expert_name": (
                    db.query(User).filter(User.id == r.expert_id).first()
                    or type("U", (), {"first_name": "Unknown"})()
                ).first_name,
                "status": r.status,
                "ai_correct": r.ai_correct,
                "confirmed_disease": r.confirmed_disease,
                "urgency_level": r.urgency_level,
                "expert_notes": r.expert_notes,
                "treatment_recommendation": r.treatment_recommendation,
                "follow_up_date": str(r.follow_up_date) if r.follow_up_date else None,
                "reviewed_at": str(r.reviewed_at),
                # linked analysis fields
                "disease_detected": r.analysis.disease_detected if r.analysis else None,
                "image_url": _image_url(r.analysis) if r.analysis else None,
                "farmer_name": (
                    db.query(User).filter(User.id == r.analysis.user_id).first().first_name
                    if r.analysis and r.analysis.user_id else None
                ),
            }
            for r in reviews
        ],
    }
