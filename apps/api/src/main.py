from fastapi import FastAPI

from .modules.skills.router import router as skills_router

app = FastAPI(title='Mugiwara Control Panel API')
app.include_router(skills_router)


@app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}
