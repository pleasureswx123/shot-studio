"""
过滤器解析器：将 /crud/requests 的 filters 结构转换为 SQLAlchemy WHERE 子句。

filters 格式示例：
{
  "logical_operator": "and",
  "conditions": [
    {"path": "project", "relation": "is", "values": [{"type": "Project", "id": 153}]},
    {"path": "sg_status_list", "relation": "is", "values": ["Active"]}
  ]
}
"""
def parse_filters(filters: dict, entity_type: str) -> list[str]:
    """
    解析 filters 字典，返回原始 SQL 字符串片段列表。
    调用方负责将列表 AND/OR 拼入 WHERE 子句。
    """
    if not filters:
        return []

    logical_op = filters.get("logical_operator", "and")
    conditions_raw = filters.get("conditions", [])
    negate = filters.get("negate", False)

    clauses: list[str] = []
    for cond in conditions_raw:
        if "conditions" in cond:
            sub = parse_filters(cond, entity_type)
            if sub:
                clauses.append(_combine_sql(sub, cond.get("logical_operator", "and")))
        else:
            clause = _parse_single(cond)
            if clause is not None:
                clauses.append(clause)

    if not clauses:
        return []

    combined = _combine_sql(clauses, logical_op)
    if negate:
        combined = f"NOT ({combined})"

    return [combined]


def _combine_sql(clauses: list[str], logical_op: str) -> str:
    op = "OR" if logical_op == "or" else "AND"
    if len(clauses) == 1:
        return clauses[0]
    return f"({f' {op} '.join(clauses)})"


def _parse_single(cond: dict):
    """将单个 condition 转换为原始 SQL 字符串片段（供 read_handler 拼入 WHERE）"""
    path = cond.get("path", "")
    relation = cond.get("relation", "is")
    values = cond.get("values", [])

    if not values:
        return None

    value = values[0]

    # 系统固定列
    FIXED_COLUMNS = {"id", "type", "code", "project_id", "is_retired",
                     "is_template", "uuid", "created_at", "updated_at",
                     "created_by", "updated_by"}

    if path in FIXED_COLUMNS:
        col = f"e.{path}"
    elif path == "project":
        # 关联过滤：project.id = X
        if isinstance(value, dict):
            pid = int(value.get("id", 0))
            return f"e.project_id = {pid}"
        return None
    else:
        # JSONB 动态字段（attributes 或 links 均检查）
        col = f"(e.attributes->>{_quote(path)})"

    return _apply_relation(col, relation, value)


def _apply_relation(col: str, relation: str, value):
    """将 relation 转换为原始 SQL 字符串"""
    if relation in ("is", "eq"):
        v = _sql_val(value)
        return f"{col} = {v}"
    elif relation == "is_not":
        v = _sql_val(value)
        return f"{col} != {v}"
    elif relation == "in":
        return f"{col} = {_sql_val(value)}"
    elif relation == "contains":
        return f"{col} ILIKE {_sql_val('%' + str(value) + '%')}"
    elif relation == "not_contains":
        return f"{col} NOT ILIKE {_sql_val('%' + str(value) + '%')}"
    elif relation == "greater_than":
        return f"{col} > {_sql_val(value)}"
    elif relation == "less_than":
        return f"{col} < {_sql_val(value)}"
    elif relation == "ends_with":
        return f"{col} ILIKE {_sql_val('%' + str(value))}"
    elif relation == "starts_with":
        return f"{col} ILIKE {_sql_val(str(value) + '%')}"
    return None


def _sql_val(value) -> str:
    """将 Python 值转为 SQL 字面量字符串（仅用于 text()，初期简化处理）"""
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, dict):
        # 富引用对象：取 id
        if "id" in value:
            return str(value["id"])
        return "NULL"
    # 字符串 — 转义单引号
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"


def _quote(s: str) -> str:
    escaped = s.replace("'", "''")
    return f"'{escaped}'"
