from fastapi import FastAPI

from .modules.skills.router import router as skills_router
from .modules.mugiwaras.router import router as mugiwaras_router
from .modules.memory.router import router as memory_router
from .modules.vault.router import router as vault_router

app = FastAPI(title='Mugiwara Control Panel API')
app.include_router(skills_router)
app.include_router(mugiwaras_router)
app.include_router(memory_router)
app.include_router(vault_router)


@app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}
