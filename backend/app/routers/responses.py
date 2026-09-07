from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database

router = APIRouter(prefix="/api/forms", tags=["responses"])
get_db = database.get_db

@router.get("/{form_id}/responses", response_model=list[schemas.ResponseListItem])
def get_responses(form_id: int, db: Session = Depends(get_db)):
    return crud.get_responses(db, form_id)

@router.get("/{form_id}/responses/{rid}", response_model=schemas.ResponseWithAnswers)
def get_response(form_id: int, rid: int, db: Session = Depends(get_db)):
    db_resp = crud.get_response(db, rid)
    if not db_resp or db_resp.form_id != form_id:
        raise HTTPException(status_code=404, detail="Response not found")
    return db_resp

@router.get("/{form_id}/summary")
def get_form_summary(form_id: int, db: Session = Depends(get_db)):
    db_form = crud.get_form(db, form_id)
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    return crud.get_form_summary(db, form_id)
