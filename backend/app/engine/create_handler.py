"""
create 指令处理器
请求格式：
{
  "request_type": "create",
  "type": "Asset",
  "field_values": {
    "project":         {"type": "Project", "id": 2},
    "code":            "cat_rig_v2",
    "sg_asset_type":   "Character",
    "sg_status_list":  "wtg"
  },
  "columns": ["id", "code", "sg_status_list"]
}
"""
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


def _split_fields(field_values: dict) -> tuple[str | None, int | None, dict, dict]:
    """
    将 field_values 拆分为：code、project_id、attributes、links
    判断规则：值是含 'id'+'type' 键的 dict 或此类 dict 的 list → links；其余 → attributes
    """
    code = None
    project_id = None
    attributes: dict = {}
    links: dict = {}

    for key, value in field_values.items():
        if key == "code":
            code = str(value)
        elif key == "project":
            if isinstance(value, dict):
                project_id = int(value.get("id", 0)) or None
            elif isinstance(value, int):
                project_id = value
        elif _is_link(value):
            links[key] = value
        else:
            attributes[key] = value

    return code, project_id, attributes, links


def _is_link(value) -> bool:
    """判断字段值是否是实体引用（富对象或富对象列表）"""
    if isinstance(value, dict):
        return "id" in value and "type" in value
    if isinstance(value, list) and value:
        return isinstance(value[0], dict) and "id" in value[0]
    return False


async def handle_create(req: dict, db: AsyncSession, user_id: int | None = None) -> dict:
    entity_type = req.get("type", "")
    field_values = req.get("field_values", {})
    return_columns = req.get("columns", ["id", "code"])

    code, project_id, attributes, links = _split_fields(field_values)

    result = await db.execute(
        text("""
            INSERT INTO entities (type, code, project_id, attributes, links, created_by, updated_by)
            VALUES (:type, :code, :project_id, CAST(:attributes AS jsonb), CAST(:links AS jsonb),
                    :user_id, :user_id)
            RETURNING id, type, code, project_id, attributes, links,
                      created_at, updated_at
        """),
        {
            "type":       entity_type,
            "code":       code,
            "project_id": project_id,
            "attributes": json.dumps(attributes),
            "links":      json.dumps(links),
            "user_id":    user_id,
        },
    )
    await db.commit()
    row = result.fetchone()

    # 按 return_columns 构建返回对象
    entity = _row_to_dict(row)
    return_data = {col: entity.get(col) for col in return_columns}
    return_data["id"] = entity["id"]
    return_data["type"] = entity_type

    return {"new_entity": return_data}


def _row_to_dict(row) -> dict:
    attrs = row[4] or {}
    links = row[5] or {}
    created_at = row[6]
    updated_at = row[7]
    return {
        "id":         row[0],
        "type":       row[1],
        "code":       row[2],
        "project_id": row[3],
        "created_at": created_at.isoformat() if created_at else None,
        "updated_at": updated_at.isoformat() if updated_at else None,
        **attrs,
        **links,
    }
