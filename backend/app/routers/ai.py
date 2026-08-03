"""
Stage 08
Step 02

Purpose:
The chat endpoint behind the AI Query Interpreter. Public, like search —
this only ever touches the public POI graph, never user accounts or reports.
"""

import logging

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.ai_query import UnsafeQueryError, ask_question

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["ai"])


class AskRequest(BaseModel):
    # Stage 11: a max length matters here specifically — this string gets
    # embedded directly into the LLM prompt, so an unbounded length is a
    # real resource-exhaustion vector (huge prompt -> slow/expensive
    # generation), not just a cosmetic limit.
    question: str = Field(max_length=300)


@router.post("/ask")
def ask(body: AskRequest):
    question = body.question.strip()
    if not question:
        return {
            "question": "",
            "cypher": None,
            "answer": "Ask me something about Lagos — e.g. \"how many hospitals are there?\"",
            "resultCount": 0,
            "mapPoints": [],
        }

    try:
        return ask_question(question)
    except UnsafeQueryError as e:
        logger.warning("AI query rejected as unsafe: %s", e)
        return {
            "question": question,
            "cypher": None,
            "answer": "I couldn't turn that into a safe query — try rephrasing, e.g. \"how many schools are in Ikeja?\"",
            "resultCount": 0,
            "mapPoints": [],
        }
    except Exception:
        logger.exception("AI query failed")
        return {
            "question": question,
            "cypher": None,
            "answer": "Something went wrong answering that. Try rephrasing your question.",
            "resultCount": 0,
            "mapPoints": [],
        }
