"""
update 指令处理器
请求格式：
{
  "request_type": "update",
  "type": "Asset",
  "entity_id": 5,
  "field_values": {
    "sg_status_list": "ip"
  }
}
"""
import json
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.engine.create_handler import _is_link


async def handle_update(req: dict, db: AsyncSession, session_uuid: str | None = None, user_id: int | None = None) -> dict:
    entity_type = req.get("type", "")
    entity_id   = req.get("entity_id")
    field_values = req.get("field_values", {})

    if not entity_id:
        return {"error": {"code": "MISSING_ENTITY_ID", "message": "update 指令缺少 entity_id"}}

    # 拆分字段
    code = None
    attr_updates: dict = {}
    link_updates: dict = {}

    for key, value in field_values.items():
        if key == "code":
            code = str(value)
        elif key in ("project", "created_by", "updated_by"):
            pass  # 不允许通过 update 改这些元字段
        elif _is_link(value):
            link_updates[key] = value
        else:
            attr_updates[key] = value

    # 读取旧值（用于写 event_log）
    old_row = await db.execute(
        text("SELECT attributes, links FROM entities WHERE id = :id AND type = :type"),
        {"id": entity_id, "type": entity_type},
    )
    old = old_row.fetchone()
    if not old:
        return {"error": {"code": "NOT_FOUND", "message": f"实体 {entity_type}#{entity_id} 不存在"}}

    old_attrs = old[0] or {}
    old_links = old[1] or {}

    # 执行更新（JSONB || 合并）
    # 注意：asyncpg 不允许命名参数(:name)与 ::jsonb 类型转换混用
    # 改用 CAST(... AS jsonb) 写法，配合命名参数
    await db.execute(
        text("""
            UPDATE entities
            SET   attributes = attributes || CAST(:attr_updates AS jsonb),
                  links      = links      || CAST(:link_updates AS jsonb),
                  code       = COALESCE(:code, code),
                  updated_at = NOW(),
                  updated_by = COALESCE(:user_id, updated_by)
            WHERE id   = :entity_id
              AND type = :entity_type
        """),
        {
            "attr_updates": json.dumps(attr_updates),
            "link_updates": json.dumps(link_updates),
            "code":         code,
            "user_id":      user_id,
            "entity_id":    entity_id,
            "entity_type":  entity_type,
        },
    )

    # 写 event_log（每个变更字段一条记录）
    sid = session_uuid or str(uuid.uuid4())
    for key, new_val in {**attr_updates, **link_updates}.items():
        old_val = old_attrs.get(key) or old_links.get(key)
        if old_val != new_val:
            await db.execute(
                text("""
                    INSERT INTO event_logs
                        (session_uuid, event_type, entity_type, entity_id, meta)
                    VALUES
                        (:session_uuid, 'attribute_change', :entity_type, :entity_id, CAST(:meta AS jsonb))
                """),
                {
                    "session_uuid": sid,
                    "entity_type":  entity_type,
                    "entity_id":    entity_id,
                    "meta": json.dumps({
                        "attribute_name": key,
                        "old_value":      old_val,
                        "new_value":      new_val,
                    }),
                },
            )

    await db.commit()
    return {"updated_entity": {"id": entity_id, "type": entity_type}}
