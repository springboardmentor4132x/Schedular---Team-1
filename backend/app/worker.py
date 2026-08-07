"""Run scheduled publishing work outside HTTP requests.

Usage: python -m app.worker --once
       python -m app.worker --interval 30
"""

import argparse
import asyncio
import time

from app.database import SessionLocal
from app.services.publishing_service import process_pending_publications


async def run_once_async() -> list[dict]:
    db = SessionLocal()
    try:
        return await process_pending_publications(db)
    finally:
        db.close()


def run_once() -> list[dict]:
    return asyncio.run(run_once_async())


def main() -> None:
    parser = argparse.ArgumentParser(description="Run SocialPilot publishing work.")
    parser.add_argument(
        "--once", action="store_true", help="Process the queue once and exit."
    )
    parser.add_argument(
        "--interval", type=int, default=30, help="Polling interval in seconds."
    )
    args = parser.parse_args()
    if args.once:
        run_once()
        return
    while True:
        run_once()
        time.sleep(max(args.interval, 1))


if __name__ == "__main__":
    main()
