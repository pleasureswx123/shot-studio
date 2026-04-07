-- ============================================================
-- ShotStudio 数据库初始化
-- ============================================================

-- UUID 支持
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. entities — 全实体统一存储表
--    Project / Asset / Shot / Task / Version / Note /
--    HumanUser / Sequence / Step / Playlist / ...
-- ============================================================
CREATE TABLE entities (
    id          SERIAL PRIMARY KEY,
    type        VARCHAR(50)  NOT NULL,
    code        TEXT,
    project_id  INTEGER      REFERENCES entities(id) ON DELETE SET NULL,

    -- 动态属性桶：sg_status / sg_fps / sg_cut_in / start_date ...
    attributes  JSONB        NOT NULL DEFAULT '{}',

    -- 关联桶：step / task_assignees / note_links ...
    -- 格式：{"step": {"id":13,"type":"Step","name":"Anim"}}
    links       JSONB        NOT NULL DEFAULT '{}',

    is_retired  BOOLEAN      NOT NULL DEFAULT FALSE,
    is_template BOOLEAN      NOT NULL DEFAULT FALSE,
    uuid        UUID         NOT NULL DEFAULT gen_random_uuid(),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by  INTEGER      REFERENCES entities(id) ON DELETE SET NULL,
    updated_by  INTEGER      REFERENCES entities(id) ON DELETE SET NULL
);

CREATE INDEX idx_entities_main   ON entities (type, project_id, is_retired);
CREATE INDEX idx_entities_attrs  ON entities USING GIN (attributes);
CREATE INDEX idx_entities_links  ON entities USING GIN (links);
CREATE INDEX idx_entities_code   ON entities (code);
CREATE INDEX idx_entities_uuid   ON entities (uuid);
CREATE INDEX idx_entities_type   ON entities (type);

-- ============================================================
-- 2. event_logs — 审计日志（Write-Read 联动核心）
-- ============================================================
CREATE TABLE event_logs (
    id           BIGSERIAL    PRIMARY KEY,
    session_uuid UUID         NOT NULL,
    event_type   VARCHAR(100),           -- 'attribute_change' | 'create' | 'delete'
    entity_type  VARCHAR(50)  NOT NULL,
    entity_id    INTEGER      NOT NULL,
    -- {attribute_name, old_value, new_value, field_data_type}
    meta         JSONB        NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_logs_lookup ON event_logs (session_uuid, id ASC);
CREATE INDEX idx_event_logs_entity ON event_logs (entity_type, entity_id);
CREATE INDEX idx_event_logs_time   ON event_logs (created_at);

-- ============================================================
-- 3. entity_relationships — 任务依赖 / 多对多关系
-- ============================================================
CREATE TABLE entity_relationships (
    id            SERIAL       PRIMARY KEY,
    from_id       INTEGER      NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    to_id         INTEGER      NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    relation_type VARCHAR(50)  NOT NULL,  -- 'dependency' | 'parent_child' | 'link'
    -- {dependency_type: 'FS'|'SS', offset_days: 0}
    metadata      JSONB        NOT NULL DEFAULT '{}',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rel_from   ON entity_relationships (from_id);
CREATE INDEX idx_rel_to     ON entity_relationships (to_id);
CREATE UNIQUE INDEX idx_rel_unique ON entity_relationships (from_id, to_id, relation_type);

-- ============================================================
-- 4. field_definitions — 动态字段定义
-- ============================================================
CREATE TABLE field_definitions (
    id           SERIAL       PRIMARY KEY,
    project_id   INTEGER      REFERENCES entities(id) ON DELETE CASCADE,
    entity_type  VARCHAR(50)  NOT NULL,
    name         VARCHAR(100) NOT NULL,          -- 内部 key，如 'material_type'
    display_name VARCHAR(255) NOT NULL,           -- UI 显示名，如 '材质类型'
    data_type    VARCHAR(50)  NOT NULL,           -- 'text'|'number'|'list'|'checkbox'|'entity_link'
    -- 下拉选项、校验规则、可见角色列表
    config       JSONB        NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_field_def_unique ON field_definitions (project_id, entity_type, name);

-- ============================================================
-- 5. page_configs — 用户视图配置（过滤器/列宽/列序/分组）
-- ============================================================
CREATE TABLE page_configs (
    id          SERIAL       PRIMARY KEY,
    user_id     INTEGER      REFERENCES entities(id) ON DELETE CASCADE,
    project_id  INTEGER      REFERENCES entities(id) ON DELETE CASCADE,
    page_key    VARCHAR(100) NOT NULL,    -- 如 'assets_grid' | 'shots_grid'
    config      JSONB        NOT NULL DEFAULT '{}',
    is_public   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_page_configs_lookup ON page_configs (user_id, project_id, page_key);

-- ============================================================
-- 6. auth_sessions — 用户认证会话
-- ============================================================
CREATE TABLE auth_sessions (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     INTEGER      NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    csrf_token  VARCHAR(100) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_sessions_token ON auth_sessions (csrf_token);
CREATE INDEX idx_auth_sessions_user  ON auth_sessions (user_id);

-- ============================================================
-- 初始数据：创建系统管理员用户
-- ============================================================
INSERT INTO entities (type, code, attributes)
VALUES (
    'HumanUser',
    'admin',
    '{"name": "Admin", "email": "admin@shotstudio.local", "login": "admin", "password_hash": "$2b$12$placeholder", "sg_status_list": "act"}'::jsonb
);
