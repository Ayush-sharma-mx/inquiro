from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Creator(Base):
    __tablename__ = "creators"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    created_at = Column(DateTime, default=utcnow)
    
    forms = relationship("Form", back_populates="creator")

class Form(Base):
    __tablename__ = "forms"
    id = Column(Integer, primary_key=True, autoincrement=True)
    creator_id = Column(Integer, ForeignKey("creators.id"), nullable=False)
    title = Column(String(500), nullable=False, default='Untitled Form')
    status = Column(String(20), nullable=False, default='draft')
    share_slug = Column(String(50), unique=True, nullable=True)
    theme_json = Column(Text, nullable=True)
    thank_you_message = Column(Text, default='Thank you for your response!')
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    published_at = Column(DateTime, nullable=True)
    
    creator = relationship("Creator", back_populates="forms")
    questions = relationship("Question", back_populates="form", cascade="all, delete-orphan", order_by="Question.order_index")
    responses = relationship("Response", back_populates="form", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    form_id = Column(Integer, ForeignKey("forms.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(20), nullable=False)
    title = Column(String(1000), nullable=False, default='Untitled Question')
    description = Column(Text, nullable=True)
    is_required = Column(Boolean, default=False)
    order_index = Column(Integer, nullable=False, default=0)
    settings_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    form = relationship("Form", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

class Response(Base):
    __tablename__ = "responses"
    id = Column(Integer, primary_key=True, autoincrement=True)
    form_id = Column(Integer, ForeignKey("forms.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime, default=utcnow)
    submitted_at = Column(DateTime, nullable=True)
    is_complete = Column(Boolean, default=False)
    completion_time_seconds = Column(Integer, nullable=True)

    form = relationship("Form", back_populates="responses")
    answers = relationship("Answer", back_populates="response", cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"
    id = Column(Integer, primary_key=True, autoincrement=True)
    response_id = Column(Integer, ForeignKey("responses.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    value_text = Column(Text, nullable=True)
    value_number = Column(Float, nullable=True)
    value_json = Column(Text, nullable=True)

    response = relationship("Response", back_populates="answers")
    question = relationship("Question", back_populates="answers")
