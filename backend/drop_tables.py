from app.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    conn.execute(text("DROP TABLE IF EXISTS audience_analytics CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS campaign_analytics CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS platform_analytics CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS post_analytics CASCADE"))
    conn.commit()
