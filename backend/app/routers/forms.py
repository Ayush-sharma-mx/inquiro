from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import crud, schemas, database

router = APIRouter(prefix="/api/forms", tags=["forms"])
get_db = database.get_db

@router.get("", response_model=list[schemas.FormListItem])
def list_forms(db: Session = Depends(get_db)):
    return crud.get_forms(db)

@router.post("", response_model=schemas.Form)
def create_form(form: schemas.FormCreate, db: Session = Depends(get_db)):
    if not form.creator_id:
        form.creator_id = 1
    return crud.create_form(db, form)

@router.get("/{id}", response_model=schemas.FormWithQuestions)
def get_form(id: int, db: Session = Depends(get_db)):
    db_form = crud.get_form(db, id)
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    return db_form

@router.patch("/{id}", response_model=schemas.Form)
def update_form(id: int, form: schemas.FormUpdate, db: Session = Depends(get_db)):
    db_form = crud.update_form(db, id, form)
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    return db_form

@router.delete("/{id}", response_model=schemas.Form)
def delete_form(id: int, db: Session = Depends(get_db)):
    db_form = crud.delete_form(db, id)
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    return db_form

@router.post("/{id}/duplicate", response_model=schemas.Form)
def duplicate_form(id: int, db: Session = Depends(get_db)):
    db_form = crud.duplicate_form(db, id)
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    return db_form

@router.post("/{id}/publish", response_model=schemas.Form)
def publish_form(id: int, db: Session = Depends(get_db)):
    db_form = crud.publish_form(db, id)
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    return db_form

@router.post("/{id}/unpublish", response_model=schemas.Form)
def unpublish_form(id: int, db: Session = Depends(get_db)):
    db_form = crud.unpublish_form(db, id)
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    return db_form
