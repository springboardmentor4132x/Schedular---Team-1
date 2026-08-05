from app.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    conn.execute(text("UPDATE alembic_version SET version_num='27fc9b5faefa'"))
    conn.commit()
