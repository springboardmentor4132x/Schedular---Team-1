from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("UPDATE posts SET status='scheduled' WHERE id=29"))
    conn.execute(text("DELETE FROM publishing_logs WHERE post_id=29"))
    conn.commit()
    print("Reset post 29.")
