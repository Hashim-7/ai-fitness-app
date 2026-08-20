from fastapi import FastAPI

from routers.analyze import router as analyze_router


app = FastAPI(
    title="AI Fitness Service",
)


app.include_router(analyze_router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
    }