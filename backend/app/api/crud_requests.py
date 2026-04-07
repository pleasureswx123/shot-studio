"""
POST /crud/requests — ShotStudio 的核心数据总线端点。

请求格式（application/x-www-form-urlencoded）：
  requests      = JSON 数组字符串，包含一个或多个指令
  csrf_token    = 安全令牌
  session_uuid  = 会话唯一标识（可选）
  batch_transaction = 是否开启批量事务（默认 false）

响应格式：
  {"results": [{"columns": [...], "rows": [[...], ...]}, ...]}
"""
import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Form, Header, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.engine.read_handler import handle_read
from app.engine.create_handler import handle_create
from app.engine.update_handler import handle_update
from app.engine.delete_handler import handle_delete

logger = logging.getLogger(__name__)

router = APIRouter()


async def _resolve_user_id(session_uuid: Optional[str], db: AsyncSession) -> Optional[int]:
    """从 session_uuid 查询当前登录用户 ID，无效则返回 None"""
    if not session_uuid:
        return None
    try:
        result = await db.execute(
            text("""
                SELECT user_id FROM auth_sessions
                WHERE id = CAST(:sid AS uuid) AND expires_at > NOW()
                LIMIT 1
            """),
            {"sid": session_uuid},
        )
        row = result.first()
        return row[0] if row else None
    except Exception:
        return None


@router.post("/crud/requests")
async def crud_requests(
    requests: str = Form(..., description="JSON 数组，包含一个或多个指令对象"),
    csrf_token: str = Form(..., description="CSRF 安全令牌"),
    session_uuid: Optional[str] = Form(None, description="会话唯一标识"),
    batch_transaction: bool = Form(False, description="是否批量事务"),
    bkgd: bool = Form(False),
    db: AsyncSession = Depends(get_db),
):
    # 解析指令数组
    try:
        request_list = json.loads(requests)
        if not isinstance(request_list, list):
            request_list = [request_list]
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"requests 解析失败: {e}")

    # 解析当前用户
    user_id = await _resolve_user_id(session_uuid, db)

    results = []
    for idx, req in enumerate(request_list):
        try:
            result = await _dispatch(req, db, session_uuid, user_id)
            results.append(result)
        except Exception as e:
            logger.exception(f"指令 [{idx}] 执行失败: {req}")
            results.append({
                "error": {
                    "code": "INSTRUCTION_ERROR",
                    "message": str(e),
                    "request_index": idx,
                }
            })

    return {"results": results}


async def _dispatch(req: dict, db: AsyncSession, session_uuid: Optional[str], user_id: Optional[int]) -> dict:
    """根据 request_type 路由到对应处理器"""
    request_type = req.get("request_type")

    if request_type == "read":
        return await handle_read(req, db)

    elif request_type == "create":
        return await handle_create(req, db, user_id)

    elif request_type == "update":
        return await handle_update(req, db, session_uuid, user_id)

    elif request_type == "delete":
        return await handle_delete(req, db, session_uuid)

    elif request_type in ("summarize", "group_summarize"):
        # TODO: Phase 2 实现
        return {"error": {"code": "NOT_IMPLEMENTED", "message": f"{request_type} 指令尚未实现"}}

    else:
        return {
            "error": {
                "code": "UNKNOWN_REQUEST_TYPE",
                "message": f"未知的 request_type: {request_type}",
            }
        }
