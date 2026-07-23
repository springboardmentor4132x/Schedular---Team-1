"""Consistent public error responses without exposing internal failures."""
import logging
from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR

logger = logging.getLogger(__name__)


async def http_error_handler(_: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, str) else "Request failed."
    return JSONResponse(status_code=exc.status_code, content={"detail": detail, "code": f"http_{exc.status_code}"})


async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content=jsonable_encoder({"detail": "Validation failed.", "code": "validation_error", "field_errors": exc.errors()}))


async def unhandled_error_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled API error", exc_info=exc)
    return JSONResponse(status_code=HTTP_500_INTERNAL_SERVER_ERROR, content={"detail": "Internal server error.", "code": "internal_error"})
