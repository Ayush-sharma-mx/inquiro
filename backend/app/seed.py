from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base
from . import models, schemas
import json
import uuid

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    if db.query(models.Creator).count() > 0:
        db.close()
        return

    creator = models.Creator(name="Demo User", email="demo@example.com")
    db.add(creator)
    db.commit()
    db.refresh(creator)

    # Form A
    form_a = models.Form(
        creator_id=creator.id,
        title='Customer Feedback Survey',
        status='published',
        share_slug='customer-feedback',
        published_at=models.utcnow()
    )
    db.add(form_a)
    db.flush()

    types = ['short_text', 'long_text', 'multiple_choice', 'dropdown', 'email', 'number', 'yes_no', 'rating']
    questions_a = []
    for i, t in enumerate(types):
        settings = None
        if t in ['multiple_choice', 'dropdown']:
            settings = json.dumps({"options": ["Option 1", "Option 2", "Option 3"]})
        elif t == 'rating':
            settings = json.dumps({"steps": 5})
        q = models.Question(form_id=form_a.id, type=t, title=f"Sample {t}", order_index=i, settings_json=settings)
        db.add(q)
        questions_a.append(q)
    db.commit()

    # Form A responses
    for i in range(5):
        resp = models.Response(form_id=form_a.id, started_at=models.utcnow(), submitted_at=models.utcnow(), is_complete=True)
        db.add(resp)
        db.flush()
        for q in questions_a:
            ans = models.Answer(response_id=resp.id, question_id=q.id)
            if q.type in ['short_text', 'long_text']:
                ans.value_text = f"Text {i}"
            elif q.type == 'email':
                ans.value_text = f"user{i}@example.com"
            elif q.type in ['multiple_choice', 'dropdown']:
                ans.value_text = "Option 1"
            elif q.type == 'number':
                ans.value_number = i + 1.0
            elif q.type == 'rating':
                ans.value_number = i % 5 + 1.0
            elif q.type == 'yes_no':
                ans.value_text = 'yes' if i % 2 == 0 else 'no'
            db.add(ans)
    db.commit()

    # Form B
    form_b = models.Form(
        creator_id=creator.id,
        title='Event Registration',
        status='published',
        share_slug='event-registration',
        published_at=models.utcnow()
    )
    db.add(form_b)
    db.flush()

    types_b = ['short_text', 'email', 'dropdown', 'multiple_choice', 'yes_no']
    questions_b = []
    for i, t in enumerate(types_b):
        settings = None
        if t in ['multiple_choice', 'dropdown']:
            settings = json.dumps({"options": ["Choice A", "Choice B"]})
        q = models.Question(form_id=form_b.id, type=t, title=f"Reg {t}", order_index=i, settings_json=settings)
        db.add(q)
        questions_b.append(q)
    db.commit()
    
    # Form B responses
    for i in range(3):
        resp = models.Response(form_id=form_b.id, started_at=models.utcnow(), submitted_at=models.utcnow(), is_complete=True)
        db.add(resp)
        db.flush()
        for q in questions_b:
            ans = models.Answer(response_id=resp.id, question_id=q.id)
            if q.type in ['short_text']:
                ans.value_text = f"Reg Name {i}"
            elif q.type == 'email':
                ans.value_text = f"reg{i}@example.com"
            elif q.type in ['multiple_choice', 'dropdown']:
                ans.value_text = "Choice A"
            elif q.type == 'yes_no':
                ans.value_text = 'yes'
            db.add(ans)
    db.commit()

    # Form C
    form_c = models.Form(
        creator_id=creator.id,
        title='Product Research Draft',
        status='draft'
    )
    db.add(form_c)
    db.flush()
    types_c = ['short_text', 'rating', 'long_text']
    for i, t in enumerate(types_c):
        q = models.Question(form_id=form_c.id, type=t, title=f"Draft {t}", order_index=i)
        db.add(q)
    db.commit()
    
    db.close()

if __name__ == "__main__":
    seed()
