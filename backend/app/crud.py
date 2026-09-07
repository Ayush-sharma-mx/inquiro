from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas
import uuid
import json

def get_forms(db: Session):
    forms = db.query(models.Form).all()
    result = []
    for f in forms:
        rc = db.query(models.Response).filter(models.Response.form_id == f.id).count()
        item = schemas.FormListItem.model_validate(f)
        item.response_count = rc
        result.append(item)
    return result

def create_form(db: Session, form: schemas.FormCreate):
    db_form = models.Form(title=form.title, creator_id=form.creator_id)
    db.add(db_form)
    db.commit()
    db.refresh(db_form)
    return db_form

def get_form(db: Session, form_id: int):
    return db.query(models.Form).filter(models.Form.id == form_id).first()

def get_form_by_slug(db: Session, slug: str):
    return db.query(models.Form).filter(models.Form.share_slug == slug, models.Form.status == 'published').first()

def update_form(db: Session, form_id: int, form: schemas.FormUpdate):
    db_form = get_form(db, form_id)
    if db_form:
        if form.title is not None:
            db_form.title = form.title
        if form.theme_json is not None:
            db_form.theme_json = form.theme_json
        if form.thank_you_message is not None:
            db_form.thank_you_message = form.thank_you_message
        db.commit()
        db.refresh(db_form)
    return db_form

def delete_form(db: Session, form_id: int):
    db_form = get_form(db, form_id)
    if db_form:
        db.delete(db_form)
        db.commit()
    return db_form

def duplicate_form(db: Session, form_id: int):
    db_form = get_form(db, form_id)
    if not db_form:
        return None
    new_form = models.Form(
        creator_id=db_form.creator_id,
        title=f"Copy of {db_form.title}",
        status="draft",
        theme_json=db_form.theme_json,
        thank_you_message=db_form.thank_you_message
    )
    db.add(new_form)
    db.flush() # get new_form.id

    for q in db_form.questions:
        new_q = models.Question(
            form_id=new_form.id,
            type=q.type,
            title=q.title,
            description=q.description,
            is_required=q.is_required,
            order_index=q.order_index,
            settings_json=q.settings_json
        )
        db.add(new_q)
    db.commit()
    db.refresh(new_form)
    return new_form

def publish_form(db: Session, form_id: int):
    db_form = get_form(db, form_id)
    if db_form:
        db_form.status = "published"
        if not db_form.share_slug:
            db_form.share_slug = uuid.uuid4().hex[:8]
        db_form.published_at = models.utcnow()
        db.commit()
        db.refresh(db_form)
    return db_form

def unpublish_form(db: Session, form_id: int):
    db_form = get_form(db, form_id)
    if db_form:
        db_form.status = "draft"
        db_form.published_at = None
        db.commit()
        db.refresh(db_form)
    return db_form

def create_question(db: Session, form_id: int, question: schemas.QuestionCreate):
    max_order = db.query(func.max(models.Question.order_index)).filter(models.Question.form_id == form_id).scalar()
    order_index = (max_order + 1) if max_order is not None else 0
    db_q = models.Question(
        form_id=form_id,
        type=question.type,
        title=question.title,
        description=question.description,
        is_required=question.is_required,
        order_index=order_index,
        settings_json=question.settings_json
    )
    db.add(db_q)
    db.commit()
    db.refresh(db_q)
    return db_q

def update_question(db: Session, qid: int, question: schemas.QuestionUpdate):
    db_q = db.query(models.Question).filter(models.Question.id == qid).first()
    if db_q:
        if question.title is not None:
            db_q.title = question.title
        if question.description is not None:
            db_q.description = question.description
        if question.is_required is not None:
            db_q.is_required = question.is_required
        if question.settings_json is not None:
            db_q.settings_json = question.settings_json
        db.commit()
        db.refresh(db_q)
    return db_q

def delete_question(db: Session, qid: int):
    db_q = db.query(models.Question).filter(models.Question.id == qid).first()
    if db_q:
        form_id = db_q.form_id
        db.delete(db_q)
        # reindex remaining
        remaining = db.query(models.Question).filter(models.Question.form_id == form_id).order_by(models.Question.order_index).all()
        for idx, q in enumerate(remaining):
            q.order_index = idx
        db.commit()
    return db_q

def reorder_questions(db: Session, form_id: int, question_ids: list[int]):
    questions = db.query(models.Question).filter(models.Question.form_id == form_id).all()
    q_map = {q.id: q for q in questions}
    for idx, qid in enumerate(question_ids):
        if qid in q_map:
            q_map[qid].order_index = idx
    db.commit()

def create_response(db: Session, form_id: int, response: schemas.ResponseCreate):
    db_resp = models.Response(
        form_id=form_id,
        started_at=response.started_at or models.utcnow(),
        submitted_at=models.utcnow(),
        is_complete=True,
        completion_time_seconds=response.completion_time_seconds
    )
    db.add(db_resp)
    db.flush()
    for ans in response.answers:
        val_text = None
        val_num = None
        val_json = None
        
        q = db.query(models.Question).filter(models.Question.id == ans.question_id).first()
        if not q:
            continue
        
        t = q.type
        if t in ['short_text', 'long_text', 'email', 'dropdown', 'multiple_choice']:
            val_text = str(ans.value) if ans.value is not None else None
        elif t in ['number', 'rating']:
            try:
                val_num = float(ans.value)
            except (ValueError, TypeError):
                pass
        elif t == 'yes_no':
            val_text = 'yes' if ans.value else 'no'
        else:
            val_json = json.dumps(ans.value) if ans.value is not None else None
            
        db_ans = models.Answer(
            response_id=db_resp.id,
            question_id=ans.question_id,
            value_text=val_text,
            value_number=val_num,
            value_json=val_json
        )
        db.add(db_ans)
    db.commit()
    db.refresh(db_resp)
    return db_resp

def get_responses(db: Session, form_id: int):
    resps = db.query(models.Response).filter(models.Response.form_id == form_id).all()
    result = []
    for r in resps:
        ac = db.query(models.Answer).filter(models.Answer.response_id == r.id).count()
        item = schemas.ResponseListItem.model_validate(r)
        item.answer_count = ac
        result.append(item)
    return result

def get_response(db: Session, rid: int):
    return db.query(models.Response).filter(models.Response.id == rid).first()

def get_form_summary(db: Session, form_id: int):
    questions = db.query(models.Question).filter(models.Question.form_id == form_id).all()
    summary = {}
    for q in questions:
        answers = db.query(models.Answer).filter(models.Answer.question_id == q.id).all()
        q_stat = {"type": q.type, "title": q.title, "response_count": len(answers)}
        
        if q.type in ['short_text', 'long_text', 'email']:
            pass
        elif q.type in ['multiple_choice', 'dropdown']:
            counts = {}
            for a in answers:
                if a.value_text:
                    counts[a.value_text] = counts.get(a.value_text, 0) + 1
            q_stat["option_counts"] = counts
        elif q.type == 'number':
            nums = [a.value_number for a in answers if a.value_number is not None]
            if nums:
                q_stat["min"] = min(nums)
                q_stat["max"] = max(nums)
                q_stat["avg"] = sum(nums) / len(nums)
            else:
                q_stat["min"] = q_stat["max"] = q_stat["avg"] = None
        elif q.type == 'rating':
            nums = [a.value_number for a in answers if a.value_number is not None]
            if nums:
                q_stat["avg"] = sum(nums) / len(nums)
                dist = {}
                for n in nums:
                    dist[n] = dist.get(n, 0) + 1
                q_stat["distribution"] = dist
            else:
                q_stat["avg"] = None
                q_stat["distribution"] = {}
        elif q.type == 'yes_no':
            yes_count = sum(1 for a in answers if a.value_text == 'yes')
            no_count = sum(1 for a in answers if a.value_text == 'no')
            q_stat["yes_count"] = yes_count
            q_stat["no_count"] = no_count
            
        summary[q.id] = q_stat
    return summary
