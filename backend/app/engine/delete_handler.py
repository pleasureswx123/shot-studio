"""
delete 指令处理器（软删除：is_retired = TRUE）
请求格式：
{
  "request_type": "delete",
  "type": "Asset",
  "entity_id": 5
}
"""
import json
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


async def handle_delete(req: dict, db: AsyncSession, session_uuid: str | None = None) -> dict:
    entity_type = req.get("type", "")
    entity_id   = req.get("entity_id")

    if not entity_id:
        return {"error": {"code": "MISSING_ENTITY_ID", "message": "delete 指令缺少 entity_id"}}

    # 确认实体存在
    check = await db.execute(
        text("SELECT id FROM entities WHERE id = :id AND type = :type AND is_retired = FALSE"),
        {"id": entity_id, "type": entity_type},
    )
    if not check.fetchone():
        return {"error": {"code": "NOT_FOUND", "message": f"实体 {entity_type}#{entity_id} 不存在或已删除"}}

    # 软删除
    await db.execute(
        text("""
            UPDATE entities
            SET is_retired = TRUE,
                updated_at = NOW()
            WHERE id   = :id
              AND type = :type
        """),
        {"id": entity_id, "type": entity_type},
    )

    # 写 event_log
    sid = session_uuid or str(uuid.uuid4())
    await db.execute(
        text("""
            INSERT INTO event_logs
                (session_uuid, event_type, entity_type, entity_id, meta)
            VALUES
                (:session_uuid, 'retirement', :entity_type, :entity_id, :meta::jsonb)
        """),
        {
            "session_uuid": sid,
            "entity_type":  entity_type,
            "entity_id":    entity_id,
            "meta":         json.dumps({"action": "retire"}),
        },
    )

    await db.commit()
    return {"deleted_entity": {"id": entity_id, "type": entity_type}}
