import jwt
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, field_validator

from src.auth.jwt import get_tenant_id
from src.config import settings

router = APIRouter()


class TokenRequest(BaseModel):
    tenant_id: int

    @field_validator("tenant_id")
    @classmethod
    def tenant_must_be_positive(cls, v: int) -> int:
        if v <= settings.reserved_tenant_id:
            raise ValueError(
                f"tenant_id must be greater than {settings.reserved_tenant_id}"
            )
        return v


class TokenResponse(BaseModel):
    token: str


def _require_admin(x_admin_secret: str = Header(alias="X-Admin-Secret")) -> None:
    if x_admin_secret != settings.admin_secret:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin secret",
        )


@router.post("/tokens", response_model=TokenResponse, dependencies=[Depends(_require_admin)])
async def generate_token(body: TokenRequest) -> TokenResponse:
    token = jwt.encode(
        {"tenant_id": body.tenant_id},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    return TokenResponse(token=token)


@router.get("/verify", status_code=status.HTTP_200_OK)
async def verify_token(tenant_id: int = Depends(get_tenant_id)) -> dict[str, int]:
    return {"tenant_id": tenant_id}
