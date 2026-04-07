"""
read 指令处理器：根据 request 配置查询 entities 表，
返回行列分离格式：{"columns": [...], "rows": [[...], ...]}
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.engine.filter_parser import parse_filters


async def handle_read(req: dict, db: AsyncSession) -> dict:
    entity_type = req.get("type", "")
    columns = req.get("columns", ["id", "code"])
    filters = req.get("filters", {})
    sorts = req.get("sorts", [{"column": "id", "direction": "asc"}])
    paging = req.get("paging", {"current_page": 1, "records_per_page": 50})
    read_parts = req.get("read", ["entities", "paging_info"])

    page = paging.get("current_page", 1)
    per_page = min(paging.get("records_per_page", 50), 500)
    offset = (page - 1) * per_page

    # 构建 WHERE 子句
    where_parts = [
        f"e.type = '{entity_type}'",
        "e.is_retired = FALSE",
    ]

    # 将过滤器解析为原始 SQL 片段并追加
    filter_clauses = parse_filters(filters, entity_type)
    where_parts.extend(filter_clauses)

    where_sql = " AND ".join(where_parts)

    # 构建 ORDER BY
    order_parts = []
    for s in sorts:
        col = s.get("column", "id")
        direction = s.get("direction", "asc").upper()
        if col in ("id", "code", "created_at", "updated_at", "type"):
            order_parts.append(f"e.{col} {direction}")
        else:
            order_parts.append(f"e.attributes->>{_q(col)} {direction}")
    order_sql = ", ".join(order_parts) if order_parts else "e.id ASC"

    # 总数查询
    count_sql = text(f"SELECT COUNT(*) FROM entities e WHERE {where_sql}")
    count_result = await db.execute(count_sql)
    total_count = count_result.scalar() or 0

    # 数据查询 — 先取所有固定列 + attributes + links，后在 Python 侧按 columns 提取
    data_sql = text(f"""
        SELECT e.id, e.type, e.code, e.project_id,
               e.attributes, e.links,
               e.is_retired, e.is_template, e.uuid,
               e.created_at, e.updated_at,
               e.created_by, e.updated_by
        FROM entities e
        WHERE {where_sql}
        ORDER BY {order_sql}
        LIMIT :limit OFFSET :offset
    """)
    result = await db.execute(data_sql, {"limit": per_page, "offset": offset})
    raw_rows = result.fetchall()

    # 按 columns 列表提取字段值
    rows = []
    for row in raw_rows:
        row_data = _extract_columns(row, columns)
        rows.append(row_data)

    result_obj = {}

    if "entities" in read_parts:
        result_obj["columns"] = columns
        result_obj["rows"] = rows

    if "paging_info" in read_parts:
        import math
        total_pages = math.ceil(total_count / per_page) if per_page > 0 else 1
        result_obj["paging_info"] = {
            "current_page": page,
            "records_per_page": per_page,
            "total_count": total_count,
            "total_pages": total_pages,
        }

    return result_obj


def _extract_columns(row, columns: list) -> list:
    """从数据库行中按 columns 列表顺序提取值"""
    FIXED = {
        "id": 0, "type": 1, "code": 2, "project_id": 3,
        "is_retired": 6, "is_template": 7, "uuid": 8,
        "created_at": 9, "updated_at": 10,
        "created_by": 11, "updated_by": 12,
    }
    attrs = row[4] or {}   # attributes JSONB
    links = row[5] or {}   # links JSONB

    result = []
    for col in columns:
        if col in FIXED:
            val = row[FIXED[col]]
            # 序列化特殊类型
            if hasattr(val, 'isoformat'):
                val = val.isoformat()
            elif hasattr(val, '__str__') and type(val).__name__ == 'UUID':
                val = str(val)
            result.append(val)
        elif col in links:
            result.append(links[col])
        elif col in attrs:
            result.append(attrs[col])
        else:
            result.append(None)

    return result


def _q(s: str) -> str:
    escaped = s.replace("'", "''")
    return f"'{escaped}'"
