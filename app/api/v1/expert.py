"""
Expert API endpoints — review queue, verdicts, messaging
Requires role = 'expert' or 'admin'
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import Optional
from datetime import datetime
import uuid

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.db_models import User, Analysis, ExpertReview, ExpertMessage
import os as _os


def _image_url(a: Analysis) -> str:
    if a.image_path:
        return _os.path.basename(a.image_path)
    return a.image_filename or ""

router = APIRouter(prefix="/expert", tags=["expert"])


# ─────────────────────────────────────────────
#  Role guard
# ─────────────────────────────────────────────

def require_expert(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("expert", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Expert access required")
    return current_user


# ─────────────────────────────────────────────
#  Expert stats
# ─────────────────────────────────────────────

@router.get("/stats")
def get_expert_stats(db: Session = Depends(get_db), current_expert: User = Depends(require_expert)):
    total_reviewed = (
        db.query(func.count(ExpertReview.id))
        .filter(ExpertReview.expert_id == current_expert.id)
        .scalar() or 0
    )
    pending_queue = (
        db.query(func.count(Analysis.id))
        .filter(~Analysis.id.in_(db.query(ExpertReview.analysis_id)))
        .scalar() or 0
    )
    critical_flagged = (
        db.query(func.count(ExpertReview.id))
        .filter(
            and_(
                ExpertReview.expert_id == current_expert.id,
                ExpertReview.status == "critical",
            )
        )
        .scalar() or 0
    )
    messages_sent = (
        db.query(func.count(ExpertMessage.id))
        .filter(ExpertMessage.from_expert_id == current_expert.id)
        .scalar() or 0
    )

    return {
        "total_reviewed": total_reviewed,
        "pending_queue": pending_queue,
        "critical_flagged": critical_flagged,
        "messages_sent": messages_sent,
    }


# ─────────────────────────────────────────────
#  Review Queue — unreviewed analyses
# ─────────────────────────────────────────────

@router.get("/queue")
def get_review_queue(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    severity: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_expert),
):
    """Return analyses that have NOT yet been reviewed by any expert"""
    reviewed_ids = db.query(ExpertReview.analysis_id)
    q = db.query(Analysis).filter(~Analysis.id.in_(reviewed_ids))
    if severity:
        q = q.filter(Analysis.severity_level.ilike(f"%{severity}%"))

    total = q.count()
    analyses = q.order_by(desc(Analysis.analyzed_at)).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for a in analyses:
        farmer = db.query(User).filter(User.id == a.user_id).first()
        result.append({
            "id": a.id,
            "disease_detected": a.disease_detected,
            "confidence": a.confidence,
            "severity_level": a.severity_level,
            "severity_score": a.severity_score,
            "affected_area_percentage": a.affected_area_percentage,
            "location_name": a.location_name,
            "latitude": a.latitude,
            "longitude": a.longitude,
            "analyzed_at": str(a.analyzed_at),
            "image_filename": a.image_filename,
            "image_url": _image_url(a),
            "farmer": {
                "phone": farmer.phone if farmer else None,
                "district": farmer.district if farmer else None,
                "state": farmer.state if farmer else None,
            },
        })

    return {"total": total, "page": page, "per_page": per_page, "queue": result}


# ─────────────────────────────────────────────
#  All analyses (expert view — with review status)
# ─────────────────────────────────────────────

@router.get("/analyses")
def list_all_analyses(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    reviewed: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_expert),
):
    reviewed_ids = db.query(ExpertReview.analysis_id)
    q = db.query(Analysis)
    if reviewed is True:
        q = q.filter(Analysis.id.in_(reviewed_ids))
    elif reviewed is False:
        q = q.filter(~Analysis.id.in_(reviewed_ids))

    total = q.count()
    analyses = q.order_by(desc(Analysis.analyzed_at)).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for a in analyses:
        farmer = db.query(User).filter(User.id == a.user_id).first()
        review = a.expert_review
        result.append({
            "id": a.id,
            "disease_detected": a.disease_detected,
            "confidence": a.confidence,
            "severity_level": a.severity_level,
            "location_name": a.location_name,
            "analyzed_at": str(a.analyzed_at),
            "image_filename": a.image_filename,
            "image_url": _image_url(a),
            "farmer_name": farmer.first_name if farmer else "Unknown",
            "farmer_district": farmer.district if farmer else None,
            "reviewed": review is not None,
            "review_status": review.status if review else None,
        })

    return {"total": total, "page": page, "per_page": per_page, "analyses": result}


# ─────────────────────────────────────────────
#  Analysis detail (for review panel)
# ─────────────────────────────────────────────

@router.get("/analyses/{analysis_id}")
def get_analysis_detail(
    analysis_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_expert),
):
    """Full analysis detail including farmer info and any existing expert review"""
    a = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Analysis not found")

    farmer = db.query(User).filter(User.id == a.user_id).first()
    review = a.expert_review

    return {
        "id": a.id,
        "image_filename": a.image_filename,
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
        "farmer": {
            "id": farmer.id if farmer else None,
            "name": farmer.first_name if farmer else "Unknown",
            "email": farmer.email if farmer else None,
            "phone": farmer.phone if farmer else None,
            "district": farmer.district if farmer else None,
            "state": farmer.state if farmer else None,
            "village_town": farmer.village_town if farmer else None,
            "farm_name": farmer.farm_name if farmer else None,
            "total_land_acres": farmer.total_land_acres if farmer else None,
        },
        "expert_review": (
            {
                "id": review.id,
                "status": review.status,
                "ai_correct": review.ai_correct,
                "confirmed_disease": review.confirmed_disease,
                "urgency_level": review.urgency_level,
                "expert_notes": review.expert_notes,
                "treatment_recommendation": review.treatment_recommendation,
                "follow_up_date": str(review.follow_up_date) if review.follow_up_date else None,
                "reviewed_at": str(review.reviewed_at),
            }
            if review
            else None
        ),
    }


# ─────────────────────────────────────────────
#  Submit / update review
# ─────────────────────────────────────────────

@router.post("/analyses/{analysis_id}/review")
def submit_review(
    analysis_id: str,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_expert: User = Depends(require_expert),
):
    """Create or update the expert review for an analysis"""
    a = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Analysis not found")

    existing = a.expert_review

    if existing:
        # Update in place
        for field in ("status", "ai_correct", "confirmed_disease", "urgency_level",
                      "expert_notes", "treatment_recommendation"):
            if field in data:
                setattr(existing, field, data[field])
        if data.get("follow_up_date"):
            existing.follow_up_date = datetime.fromisoformat(data["follow_up_date"])
        existing.reviewed_at = datetime.utcnow()
        db.commit()
        return {"message": "Review updated", "id": existing.id}
    else:
        review = ExpertReview(
            id=str(uuid.uuid4()),
            analysis_id=analysis_id,
            expert_id=current_expert.id,
            status=data.get("status", "approved"),
            ai_correct=data.get("ai_correct"),
            confirmed_disease=data.get("confirmed_disease"),
            urgency_level=data.get("urgency_level", "routine"),
            expert_notes=data.get("expert_notes"),
            treatment_recommendation=data.get("treatment_recommendation"),
            follow_up_date=(
                datetime.fromisoformat(data["follow_up_date"]) if data.get("follow_up_date") else None
            ),
        )
        db.add(review)
        db.commit()
        db.refresh(review)
        return {"message": "Review submitted", "id": review.id}


# ─────────────────────────────────────────────
#  Expert's own reviews
# ─────────────────────────────────────────────

@router.get("/my-reviews")
def get_my_reviews(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_expert: User = Depends(require_expert),
):
    total = (
        db.query(func.count(ExpertReview.id))
        .filter(ExpertReview.expert_id == current_expert.id)
        .scalar() or 0
    )
    reviews = (
        db.query(ExpertReview)
        .filter(ExpertReview.expert_id == current_expert.id)
        .order_by(desc(ExpertReview.reviewed_at))
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    result = []
    for r in reviews:
        a = db.query(Analysis).filter(Analysis.id == r.analysis_id).first()
        result.append({
            "review_id": r.id,
            "analysis_id": r.analysis_id,
            "disease_detected": a.disease_detected if a else None,
            "location_name": a.location_name if a else None,
            "status": r.status,
            "ai_correct": r.ai_correct,
            "confirmed_disease": r.confirmed_disease,
            "urgency_level": r.urgency_level,
            "reviewed_at": str(r.reviewed_at),
        })

    return {"total": total, "page": page, "per_page": per_page, "reviews": result}


# ─────────────────────────────────────────────
#  Messaging
# ─────────────────────────────────────────────

@router.post("/messages")
def send_message(
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_expert: User = Depends(require_expert),
):
    """Send a message to a farmer"""
    if not data.get("to_farmer_id") or not data.get("message"):
        raise HTTPException(status_code=400, detail="to_farmer_id and message are required")

    farmer = db.query(User).filter(User.id == data["to_farmer_id"]).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    msg = ExpertMessage(
        id=str(uuid.uuid4()),
        from_expert_id=current_expert.id,
        to_farmer_id=data["to_farmer_id"],
        analysis_id=data.get("analysis_id"),
        subject=data.get("subject", "Disease Treatment Advice"),
        message=data["message"],
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"message": "Message sent", "id": msg.id}


@router.get("/messages")
def get_sent_messages(
    db: Session = Depends(get_db),
    current_expert: User = Depends(require_expert),
):
    """Get all messages sent by this expert"""
    msgs = (
        db.query(ExpertMessage)
        .filter(ExpertMessage.from_expert_id == current_expert.id)
        .order_by(desc(ExpertMessage.created_at))
        .all()
    )
    result = []
    for m in msgs:
        farmer = db.query(User).filter(User.id == m.to_farmer_id).first()
        result.append({
            "id": m.id,
            "to_farmer_id": m.to_farmer_id,
            "farmer_name": farmer.first_name if farmer else "Unknown",
            "farmer_phone": farmer.phone if farmer else None,
            "analysis_id": m.analysis_id,
            "subject": m.subject,
            "message": m.message,
            "is_read": m.is_read,
            "created_at": str(m.created_at),
        })
    return result


# ─────────────────────────────────────────────
#  Farmer — read their own received messages (accessible with any valid token)
# ─────────────────────────────────────────────

@router.get("/my-messages")
def get_my_farmer_messages(
    analysis_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Farmers call this to see messages received from experts. Optionally filter by analysis_id."""
    q = db.query(ExpertMessage).filter(ExpertMessage.to_farmer_id == current_user.id)
    if analysis_id:
        q = q.filter(ExpertMessage.analysis_id == analysis_id)
    msgs = q.order_by(desc(ExpertMessage.created_at)).all()
    # Mark all as read
    for m in msgs:
        if not m.is_read:
            m.is_read = True
    db.commit()

    result = []
    for m in msgs:
        expert = db.query(User).filter(User.id == m.from_expert_id).first()
        result.append({
            "id": m.id,
            "from_expert": expert.first_name if expert else "Expert",
            "analysis_id": m.analysis_id,
            "subject": m.subject,
            "message": m.message,
            "created_at": str(m.created_at),
        })
    return result
