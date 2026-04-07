"""
认证路由：/auth/login  /auth/logout  /auth/me
会话存储在 auth_sessions 表；session UUID 通过响应体返回给前端。
"""
import bcrypt
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Auth"])

SESSION_TTL_HOURS = 24 * 7  # 7 天有效期


# ──────────────────────────────────────────────
# 请求 / 响应模型
# ──────────────────────────────────────────────
class LoginRequest(BaseModel):
    login: str          # 用户名或邮箱
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    login: str


class LoginResponse(BaseModel):
    session_id: str
    user: UserOut


# ──────────────────────────────────────────────
# 内部工具
# ──────────────────────────────────────────────
async def _get_user_by_login(login: str, db: AsyncSession):
    """按 login 或 email 查找激活的 HumanUser"""
    result = await db.execute(
        text("""
            SELECT id,
                   attributes->>'name'          AS name,
                   attributes->>'email'         AS email,
                   attributes->>'login'         AS login,
                   attributes->>'password_hash' AS password_hash
            FROM entities
            WHERE type = 'HumanUser'
              AND is_retired = FALSE
              AND (
                  attributes->>'login' = :login
               OR attributes->>'email' = :login
              )
            LIMIT 1
        """),
        {"login": login},
    )
    return result.mappings().first()


async def get_current_user(
    x_session_id: Optional[str] = Header(None, alias="X-Session-Id"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """FastAPI 依赖：验证 session，返回 user 字典；失败则抛 401"""
    if not x_session_id:
        raise HTTPException(status_code=401, detail="未提供会话 ID")

    result = await db.execute(
        text("""
            SELECT s.user_id,
                   e.attributes->>'name'  AS name,
                   e.attributes->>'email' AS email,
                   e.attributes->>'login' AS login
            FROM auth_sessions s
            JOIN entities e ON e.id = s.user_id
            WHERE s.id = CAST(:sid AS uuid)
              AND s.expires_at > NOW()
        """),
        {"sid": x_session_id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=401, detail="会话已过期或无效")

    return dict(row)


# ──────────────────────────────────────────────
# 端点
# ──────────────────────────────────────────────
@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await _get_user_by_login(body.login, db)
    if not user:
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    pw_hash = user["password_hash"] or ""
    if not pw_hash or not bcrypt.checkpw(body.password.encode(), pw_hash.encode()):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    expires_at = datetime.now(timezone.utc) + timedelta(hours=SESSION_TTL_HOURS)

    result = await db.execute(
        text("""
            INSERT INTO auth_sessions (user_id, csrf_token, expires_at)
            VALUES (:uid, gen_random_uuid()::text, :exp)
            RETURNING id::text AS session_id
        """),
        {"uid": user["id"], "exp": expires_at},
    )
    session_id = result.scalar()
    await db.commit()

    logger.info("用户 %s 登录成功，session=%s", user["login"], session_id)
    return LoginResponse(
        session_id=session_id,
        user=UserOut(
            id=user["id"],
            name=user["name"] or user["login"],
            email=user["email"] or "",
            login=user["login"] or "",
        ),
    )


@router.post("/logout")
async def logout(
    x_session_id: Optional[str] = Header(None, alias="X-Session-Id"),
    db: AsyncSession = Depends(get_db),
):
    if x_session_id:
        await db.execute(
            text("DELETE FROM auth_sessions WHERE id = CAST(:sid AS uuid)"),
            {"sid": x_session_id},
        )
        await db.commit()
    return {"ok": True}


@router.get("/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    return UserOut(
        id=current_user["user_id"],
        name=current_user["name"] or "",
        email=current_user["email"] or "",
        login=current_user["login"] or "",
    )
