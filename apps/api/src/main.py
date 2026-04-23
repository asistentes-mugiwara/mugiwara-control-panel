from fastapi import FastAPI

app = FastAPI(title="Mugiwara Control Panel API")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
