"""
Database Operations Module
Provides functions to store and retrieve data from the database
"""

from database import SessionLocal, Scan, Prediction, Report, Verification, User, AuditLog
from datetime import datetime
import json

class ScanRepository:
    """Repository for Scan operations"""
    
    @staticmethod
    def create_scan(scan_data: dict) -> dict:
        """Create a new scan record"""
        db = SessionLocal()
        try:
            scan = Scan(
                id=scan_data.get('scanId'),
                farmer_id=scan_data.get('farmerId'),
                farmer_name=scan_data.get('farmerName'),
                farmer_email=scan_data.get('farmerEmail'),
                image_path=scan_data.get('imagePath'),
                image_base64=scan_data.get('imageData'),
                status=scan_data.get('status', 'PENDING_PREDICTION'),
                location_lat=scan_data.get('location', {}).get('latitude'),
                location_lng=scan_data.get('location', {}).get('longitude'),
                location_accuracy=scan_data.get('location', {}).get('accuracy'),
                device_info=scan_data.get('deviceInfo'),
                scan_metadata=scan_data.get('metadata')
            )
            db.add(scan)
            db.commit()
            print(f"✅ Scan created: {scan.id}")
            return {'success': True, 'scanId': scan.id}
        except Exception as e:
            db.rollback()
            print(f"❌ Error creating scan: {e}")
            return {'success': False, 'error': str(e)}
        finally:
            db.close()
    
    @staticmethod
    def get_scan(scan_id: str) -> dict:
        """Retrieve a scan by ID"""
        db = SessionLocal()
        try:
            scan = db.query(Scan).filter(Scan.id == scan_id).first()
            if scan:
                return {
                    'success': True,
                    'scan': {
                        'id': scan.id,
                        'farmerId': scan.farmer_id,
                        'farmerName': scan.farmer_name,
                        'status': scan.status,
                        'createdAt': scan.created_at.isoformat(),
                        'updatedAt': scan.updated_at.isoformat()
                    }
                }
            return {'success': False, 'error': 'Scan not found'}
        except Exception as e:
            print(f"❌ Error retrieving scan: {e}")
            return {'success': False, 'error': str(e)}
        finally:
            db.close()
    
    @staticmethod
    def get_farmer_scans(farmer_id: str) -> dict:
        """Get all scans for a farmer"""
        db = SessionLocal()
        try:
            scans = db.query(Scan).filter(Scan.farmer_id == farmer_id).all()
            return {
                'success': True,
                'count': len(scans),
                'scans': [
                    {
                        'id': scan.id,
                        'status': scan.status,
                        'disease': scan.prediction.primary_disease if scan.prediction else None,
                        'createdAt': scan.created_at.isoformat()
                    }
                    for scan in scans
                ]
            }
        except Exception as e:
            print(f"❌ Error retrieving farmer scans: {e}")
            return {'success': False, 'error': str(e)}
        finally:
            db.close()
    
    @staticmethod
    def update_scan_status(scan_id: str, status: str) -> dict:
        """Update scan status"""
        db = SessionLocal()
        try:
            scan = db.query(Scan).filter(Scan.id == scan_id).first()
            if scan:
                scan.status = status
                scan.updated_at = datetime.now()
                db.commit()
                print(f"✅ Scan status updated: {scan_id} → {status}")
                return {'success': True, 'status': status}
            return {'success': False, 'error': 'Scan not found'}
        except Exception as e:
            db.rollback()
            print(f"❌ Error updating scan status: {e}")
            return {'success': False, 'error': str(e)}
        finally:
            db.close()


class PredictionRepository:
    """Repository for Prediction operations"""
    
    @staticmethod
    def create_prediction(prediction_data: dict) -> dict:
        """Create a new prediction record"""
        db = SessionLocal()
        try:
            prediction = Prediction(
                scan_id=prediction_data.get('scanId'),
                primary_disease=prediction_data.get('primaryDisease'),
                confidence=prediction_data.get('confidence'),
                severity=prediction_data.get('severity'),
                all_predictions=prediction_data.get('allPredictions'),
                model_version=prediction_data.get('modelVersion'),
                processing_time_ms=prediction_data.get('processingTime')
            )
            db.add(prediction)
            db.commit()
            print(f"✅ Prediction created for scan: {prediction.scan_id}")
            return {'success': True, 'predictionId': prediction.id}
        except Exception as e:
            db.rollback()
            print(f"❌ Error creating prediction: {e}")
            return {'success': False, 'error': str(e)}
        finally:
            db.close()
    
    @staticmethod
    def get_prediction(scan_id: str) -> dict:
        """Get prediction for a scan"""
        db = SessionLocal()
        try:
            prediction = db.query(Prediction).filter(Prediction.scan_id == scan_id).first()
            if prediction:
                return {
                    'success': True,
                    'prediction': {
                        'primaryDisease': prediction.primary_disease,
                        'confidence': prediction.confidence,
                        'severity': prediction.severity,
                        'allPredictions': prediction.all_predictions
                    }
                }
            return {'success': False, 'error': 'Prediction not found'}
        except Exception as e:
            print(f"❌ Error retrieving prediction: {e}")
            return {'success': False, 'error': str(e)}
        finally:
            db.close()


class ReportRepository:
    """Repository for Report operations"""
    
    @staticmethod
    def create_report(report_data: dict) -> dict:
        """Create a new report record"""
        db = SessionLocal()
        try:
            report = Report(
                id=report_data.get('reportId'),
                scan_id=report_data.get('scanId'),
                primary_disease=report_data.get('primaryDisease'),
                severity=report_data.get('severity'),
                confidence=report_data.get('confidence'),
                disease_description=report_data.get('diseaseDescription'),
                causes=report_data.get('causes'),
                symptoms=report_data.get('symptoms'),
                treatment_recommendations=report_data.get('treatments'),
                immediate_actions=report_data.get('actions'),
                preventive_measures=report_data.get('measures'),
                status='PENDING_VERIFICATION'
            )
            db.add(report)
            db.commit()
            print(f"✅ Report created: {report.id}")
            return {'success': True, 'reportId': report.id}
        except Exception as e:
            db.rollback()
            print(f"❌ Error creating report: {e}")
            return {'success': False, 'error': str(e)}
        finally:
            db.close()
    
    @staticmethod
    def get_report(report_id: str) -> dict:
        """Get a report by ID"""
        db = SessionLocal()
        try:
            report = db.query(Report).filter(Report.id == report_id).first()
            if report:
                return {
                    'success': True,
                    'report': {
                        'id': report.id,
                        'disease': report.primary_disease,
                        'severity': report.severity,
                        'confidence': report.confidence,
                        'treatments': report.treatment_recommendations,
                        'actions': report.immediate_actions,
                        'measures': report.preventive_measures
                    }
                }
            return {'success': False, 'error': 'Report not found'}
        except Exception as e:
            print(f"❌ Error retrieving report: {e}")
            return {'success': False, 'error': str(e)}
        finally:
            db.close()


class VerificationRepository:
    """Repository for Verification operations"""
    
    @staticmethod
    def create_verification(verification_data: dict) -> dict:
        """Create a new verification record"""
        db = SessionLocal()
        try:
            verification = Verification(
                id=verification_data.get('verificationId'),
                scan_id=verification_data.get('scanId'),
                report_id=verification_data.get('reportId'),
                status='PENDING'
            )
            db.add(verification)
            db.commit()
            print(f"✅ Verification created: {verification.id}")
            return {'success': True, 'verificationId': verification.id}
        except Exception as e:
            db.rollback()
            print(f"❌ Error creating verification: {e}")
            return {'success': False, 'error': str(e)}
        finally:
            db.close()
    
    @staticmethod
    def get_pending_verifications() -> dict:
        """Get all pending verifications"""
        db = SessionLocal()
        try:
            verifications = db.query(Verification).filter(
                Verification.status == 'PENDING'
            ).all()
            return {
                'success': True,
                'count': len(verifications),
                'verifications': [
                    {
                        'id': v.id,
                        'scanId': v.scan_id,
                        'status': v.status,
                        'createdAt': v.created_at.isoformat()
                    }
                    for v in verifications
                ]
            }
        except Exception as e:
            print(f"❌ Error retrieving verifications: {e}")
            return {'success': False, 'error': str(e)}
        finally:
            db.close()
    
    @staticmethod
    def update_verification(verification_id: str, status: str, feedback: str = None) -> dict:
        """Update verification status"""
        db = SessionLocal()
        try:
            verification = db.query(Verification).filter(
                Verification.id == verification_id
            ).first()
            if verification:
                verification.status = status
                if feedback:
                    verification.expert_feedback = feedback
                verification.verified_at = datetime.now()
                db.commit()
                print(f"✅ Verification updated: {verification_id} → {status}")
                return {'success': True, 'status': status}
            return {'success': False, 'error': 'Verification not found'}
        except Exception as e:
            db.rollback()
            print(f"❌ Error updating verification: {e}")
            return {'success': False, 'error': str(e)}
        finally:
            db.close()


class AuditRepository:
    """Repository for Audit Log operations"""
    
    @staticmethod
    def log_action(entity_type: str, entity_id: str, action: str, user_id: str = None, 
                   old_value: dict = None, new_value: dict = None) -> dict:
        """Log an action to audit trail"""
        db = SessionLocal()
        try:
            audit_log = AuditLog(
                entity_type=entity_type,
                entity_id=entity_id,
                action=action,
                user_id=user_id,
                old_value=old_value,
                new_value=new_value,
                status='SUCCESS'
            )
            db.add(audit_log)
            db.commit()
            return {'success': True}
        except Exception as e:
            db.rollback()
            print(f"❌ Error logging action: {e}")
            return {'success': False, 'error': str(e)}
        finally:
            db.close()
