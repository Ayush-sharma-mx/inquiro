from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class CreatorBase(BaseModel):
    name: str
    email: EmailStr

class CreatorCreate(CreatorBase):
    pass

class Creator(CreatorBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class QuestionBase(BaseModel):
    type: str
    title: str = "Untitled Question"
    description: Optional[str] = None
    is_required: bool = False
    order_index: int = 0
    settings_json: Optional[str] = None

class QuestionCreate(QuestionBase):
    pass

class QuestionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_required: Optional[bool] = None
    settings_json: Optional[str] = None

class Question(QuestionBase):
    id: int
    form_id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class FormBase(BaseModel):
    title: str = "Untitled Form"
    theme_json: Optional[str] = None
    thank_you_message: str = "Thank you for your response!"

class FormCreate(BaseModel):
    title: Optional[str] = "Untitled Form"
    creator_id: Optional[int] = 1

class FormUpdate(BaseModel):
    title: Optional[str] = None
    theme_json: Optional[str] = None
    thank_you_message: Optional[str] = None

class Form(FormBase):
    id: int
    creator_id: int
    status: str
    share_slug: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class FormWithQuestions(Form):
    questions: List[Question] = []

class FormListItem(Form):
    response_count: int = 0

class AnswerBase(BaseModel):
    question_id: int
    value: Any

class AnswerCreate(BaseModel):
    question_id: int
    value: Any

class Answer(BaseModel):
    id: int
    response_id: int
    question_id: int
    value_text: Optional[str] = None
    value_number: Optional[float] = None
    value_json: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ResponseBase(BaseModel):
    started_at: Optional[datetime] = None
    completion_time_seconds: Optional[int] = None

class ResponseCreate(ResponseBase):
    answers: List[AnswerCreate]

class Response(ResponseBase):
    id: int
    form_id: int
    started_at: datetime
    submitted_at: Optional[datetime]
    is_complete: bool
    model_config = ConfigDict(from_attributes=True)

class ResponseWithAnswers(Response):
    answers: List[Answer] = []

class ResponseListItem(Response):
    answer_count: int = 0

class ReorderQuestions(BaseModel):
    question_ids: List[int]
