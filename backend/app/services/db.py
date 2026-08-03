"""
Stage 04
Step 02

Purpose:
Singleton Neo4j driver + a startup helper that ensures the constraints this
app relies on exist (unique user emails).
"""

from neo4j import GraphDatabase

from app.config import NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))


def ensure_constraints() -> None:
    with driver.session() as session:
        session.run(
            "CREATE CONSTRAINT user_email_unique IF NOT EXISTS "
            "FOR (u:User) REQUIRE u.email IS UNIQUE"
        )
