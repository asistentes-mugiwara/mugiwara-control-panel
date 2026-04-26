from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .modules.skills.router import router as skills_router
from .modules.mugiwaras.router import router as mugiwaras_router
from .modules.memory.router import router as memory_router
from .modules.vault.router import router as vault_router
from .modules.healthcheck.router import router as healthcheck_router
from .modules.dashboard.router import router as dashboard_router
from .modules.usage.router import router as usage_router

SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'no-store',
}

app = FastAPI(title='Mugiwara Control Panel API')


def _apply_security_headers(response):
    for name, value in SECURITY_HEADERS.items():
        response.headers.setdefault(name, value)
    return response


@app.middleware('http')
async def private_control_plane_perimeter(request: Request, call_next):
    is_cors_preflight = (
        request.method == 'OPTIONS'
        and 'origin' in request.headers
        and 'access-control-request-method' in request.headers
    )
    if is_cors_preflight:
        return _apply_security_headers(
            JSONResponse(
                status_code=403,
                content={
                    'detail': {
                        'code': 'cors_not_supported',
                        'message': 'Cross-origin browser access is not supported.',
                    }
                },
            )
        )

    response = await call_next(request)
    return _apply_security_headers(response)


@app.exception_handler(RequestValidationError)
async def sanitized_request_validation_error(_request: Request, _exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={'detail': {'code': 'validation_error', 'message': 'Request validation failed.'}},
    )


app.include_router(skills_router)
app.include_router(mugiwaras_router)
app.include_router(memory_router)
app.include_router(vault_router)
app.include_router(healthcheck_router)
app.include_router(dashboard_router)
app.include_router(usage_router)


@app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}
