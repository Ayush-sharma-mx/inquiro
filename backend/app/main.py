from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models, seed
from .database import engine
from .routers import forms, questions, public, responses

@asynccontextmanager
async def lifespan(app: FastAPI):
    # create tables and seed
    models.Base.metadata.create_all(bind=engine)
    seed.seed()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forms.router)
app.include_router(questions.router)
app.include_router(public.router)
app.include_router(responses.router)

@app.get("/")
def root():
    return {"message": "Inquiro API"}
