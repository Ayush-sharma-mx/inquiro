from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import crud, schemas, database

router = APIRouter(tags=["questions"])
get_db = database.get_db

@router.post("/api/forms/{form_id}/questions", response_model=schemas.Question)
def add_question(form_id: int, question: schemas.QuestionCreate, db: Session = Depends(get_db)):
    db_form = crud.get_form(db, form_id)
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    return crud.create_question(db, form_id, question)

@router.patch("/api/questions/{qid}", response_model=schemas.Question)
def update_question(qid: int, question: schemas.QuestionUpdate, db: Session = Depends(get_db)):
    db_q = crud.update_question(db, qid, question)
    if not db_q:
        raise HTTPException(status_code=404, detail="Question not found")
    return db_q

@router.delete("/api/questions/{qid}", response_model=schemas.Question)
def delete_question(qid: int, db: Session = Depends(get_db)):
    db_q = crud.delete_question(db, qid)
    if not db_q:
        raise HTTPException(status_code=404, detail="Question not found")
    return db_q

@router.patch("/api/forms/{form_id}/questions/reorder")
def reorder_questions(form_id: int, req: schemas.ReorderQuestions, db: Session = Depends(get_db)):
    db_form = crud.get_form(db, form_id)
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    crud.reorder_questions(db, form_id, req.question_ids)
    return {"message": "Questions reordered"}
