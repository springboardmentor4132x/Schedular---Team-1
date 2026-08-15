from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("DELETE FROM social_accounts WHERE status='disconnected'"))
    conn.commit()
    print("Cleaned up disconnected social accounts.")
