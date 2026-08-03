"""
Stage 04
Step 04

Purpose:
Neo4j-backed user storage — the first real data written to the graph
(POI data ingestion follows later, in Stage 07).
"""

import uuid
from datetime import datetime, timezone

from app.services.db import driver


class EmailAlreadyRegistered(Exception):
    pass


def create_user(email: str, password_hash: str, name: str) -> dict:
    user_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    query = """
    MERGE (u:User {email: $email})
    ON CREATE SET
        u.id = $id,
        u.password_hash = $password_hash,
        u.name = $name,
        u.created_at = $created_at
    RETURN u.id AS id, u.email AS email, u.name AS name, u.created_at AS created_at,
           (u.id = $id) AS wasCreated
    """
    with driver.session() as session:
        record = session.run(
            query,
            email=email,
            id=user_id,
            password_hash=password_hash,
            name=name,
            created_at=created_at,
        ).single()

    if not record["wasCreated"]:
        raise EmailAlreadyRegistered(email)

    return {
        "id": record["id"],
        "email": record["email"],
        "name": record["name"],
        "createdAt": record["created_at"],
    }


def get_user_by_email(email: str) -> dict | None:
    query = """
    MATCH (u:User {email: $email})
    RETURN u.id AS id, u.email AS email, u.name AS name,
           u.password_hash AS password_hash, u.created_at AS created_at
    """
    with driver.session() as session:
        record = session.run(query, email=email).single()

    return dict(record) if record else None


def get_user_by_id(user_id: str) -> dict | None:
    query = """
    MATCH (u:User {id: $id})
    RETURN u.id AS id, u.email AS email, u.name AS name, u.created_at AS createdAt
    """
    with driver.session() as session:
        record = session.run(query, id=user_id).single()

    return dict(record) if record else None
