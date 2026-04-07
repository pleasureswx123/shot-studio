-- 更新 admin 用户为真实密码哈希
UPDATE entities
SET attributes = attributes || jsonb_build_object(
    'password_hash', '$2b$12$.S4oPPmHXSp6q4syHheEY.AA425XIZxGovgFDc3AVrMP61y8NyDEC',
    'name', 'Admin',
    'email', 'admin@shotstudio.local',
    'login', 'admin'
)
WHERE type = 'HumanUser' AND code = 'admin';

-- 新增两个测试用户
INSERT INTO entities (type, code, attributes) VALUES
(
    'HumanUser', 'jane',
    jsonb_build_object(
        'name', 'Jane Li',
        'email', 'jane@shotstudio.local',
        'login', 'jane',
        'password_hash', '$2b$12$qwcKHF/QR3z0XyL79AcIsu7l8JZg4d0EuGW7AKZXZ7sJreFo2xpsW',
        'sg_status_list', 'act'
    )
),
(
    'HumanUser', 'bob',
    jsonb_build_object(
        'name', 'Bob Chen',
        'email', 'bob@shotstudio.local',
        'login', 'bob',
        'password_hash', '$2b$12$Glh/WMue3qYWJoyCsvveZOs2ZuJbJny/l3cSNe5PwBhTdwcHtZyj2',
        'sg_status_list', 'act'
    )
)
ON CONFLICT DO NOTHING;
