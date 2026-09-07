import re
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import crud, schemas, database

router = APIRouter(prefix="/api/public/forms", tags=["public"])
get_db = database.get_db

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

@router.get("/{slug}", response_model=schemas.FormWithQuestions)
def get_public_form(slug: str, db: Session = Depends(get_db)):
    db_form = crud.get_form_by_slug(db, slug)
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found or not published")
    return db_form

@router.post("/{slug}/responses", status_code=status.HTTP_201_CREATED)
def submit_response(slug: str, response: schemas.ResponseCreate, db: Session = Depends(get_db)):
    db_form = crud.get_form_by_slug(db, slug)
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found or not published")
    
    # Build question lookup
    q_map = {q.id: q for q in db_form.questions}
    
    # Check required questions answered
    required_q_ids = {q.id for q in db_form.questions if q.is_required}
    answered_q_ids = {ans.question_id for ans in response.answers}
    missing = required_q_ids - answered_q_ids
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required questions: {missing}")

    # Validate each answer
    errors = []
    for ans in response.answers:
        q = q_map.get(ans.question_id)
        if not q:
            errors.append(f"Question {ans.question_id} not found in this form")
            continue
        
        value = ans.value
        if value is None or value == "":
            if q.is_required:
                errors.append(f"Question '{q.title}' is required")
            continue
        
        if q.type == 'email':
            if not isinstance(value, str) or not EMAIL_REGEX.match(value):
                errors.append(f"Invalid email format for '{q.title}'")
        
        elif q.type == 'number':
            try:
                float(value)
            except (ValueError, TypeError):
                errors.append(f"Invalid number for '{q.title}'")
        
        elif q.type == 'rating':
            try:
                rating = float(value)
                settings = json.loads(q.settings_json) if q.settings_json else {"steps": 5}
                max_rating = settings.get("steps", 5)
                if rating < 1 or rating > max_rating:
                    errors.append(f"Rating must be between 1 and {max_rating} for '{q.title}'")
            except (ValueError, TypeError):
                errors.append(f"Invalid rating for '{q.title}'")
        
        elif q.type in ['multiple_choice', 'dropdown']:
            settings = json.loads(q.settings_json) if q.settings_json else {"options": []}
            valid_options = settings.get("options", [])
            if valid_options and str(value) not in valid_options:
                errors.append(f"Invalid option '{value}' for '{q.title}'")
        
        elif q.type == 'yes_no':
            if value not in [True, False, 'yes', 'no', 'Yes', 'No']:
                errors.append(f"Invalid yes/no value for '{q.title}'")

    if errors:
        raise HTTPException(status_code=400, detail="; ".join(errors))

    return crud.create_response(db, db_form.id, response)
