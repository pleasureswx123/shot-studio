# Requirements Document

## Introduction

ShotStudio 是一个工业级影视全流程项目管理系统，复刻 Autodesk Shotgun Studio 的核心功能。系统采用"单一 API 网关 + 批量指令集 + JSONB 桶存储"架构，覆盖从项目立项、资产创建、镜头排期、任务分发到媒体审阅的完整生产生命周期。系统需支持超大规模数据（单页 2000 行 × 100 列）的流畅渲染，并提供实时协作与审计能力。

---

## Glossary

- **System**: ShotStudio 系统整体
- **API_Gateway**: 统一 CRUD 接口处理器，入口为 `POST /crud/requests`
- **Instruction_Engine**: 批量指令解析与执行引擎
- **Entity**: 系统中所有业务对象的统一抽象（Project、Asset、Shot、Task、Version、Note 等）
- **Project**: 顶层业务实体，代表一个影视/动画制作项目
- **Asset**: 资产实体，如角色、场景、道具
- **Shot**: 镜头实体，归属于 Sequence
- **Sequence**: 场次，Shot 的上级分组
- **Task**: 任务实体，归属于 Asset 或 Shot 的某个管线步骤
- **Version**: 媒体版本实体，艺术家提交的产出物
- **Note**: 反馈备注实体，关联到 Version 或 Task
- **Pipeline_Step**: 管线步骤，如 Art、Model、Rig、Texture、Lay、Ani、Lgt、Comp
- **Grid**: 超级网格，前端虚拟化表格组件
- **Audit_Log**: 审计日志，记录所有实体变更的 old_value/new_value
- **JSONB_Store**: PostgreSQL JSONB 字段，用于存储动态属性
- **Media_Pipeline**: 多媒体处理流水线（上传、转码、缩略图生成）
- **RBAC**: 基于角色的访问控制
- **Admin**: 系统管理员角色
- **Producer**: 制片/PM 角色
- **Art_Director**: 艺术总监/组长角色
- **Artist**: 艺术家角色
- **Client**: 客户/外部供应商角色
- **Filter_Parser**: 过滤器解析器，将 API 过滤条件转换为 SQL
- **Pretty_Printer**: 将结构化数据格式化为标准输出的组件

---

## Requirements

### Requirement 1: 统一 API 网关

**User Story:** As a 前端开发者, I want 通过单一端点发送批量指令, so that 我可以在一次 HTTP 请求中完成多种数据操作，减少网络往返。

#### Acceptance Criteria

1. THE API_Gateway SHALL 在 `POST /crud/requests` 端点接收包含一个或多个指令对象的 `requests` 数组。
2. THE API_Gateway SHALL 按数组顺序依次执行每个指令，并将各指令结果按顺序返回。
3. WHEN `batch_transaction` 参数为 `true` 时，THE API_Gateway SHALL 在单个数据库事务中执行数组内所有指令，任意指令失败时回滚全部操作。
4. THE API_Gateway SHALL 以行列分离格式返回数据：每个结果包含 `columns`（列名数组）和 `rows`（数据矩阵）。
5. THE API_Gateway SHALL 验证每个请求携带的 `csrf_token`，IF `csrf_token` 无效，THEN THE API_Gateway SHALL 返回 403 错误并拒绝执行。
6. THE API_Gateway SHALL 从请求中提取 `session_uuid`，并将其传递给所有子指令处理器用于审计追踪。

---

### Requirement 2: 指令解析引擎 - read 指令

**User Story:** As a 制片/PM, I want 通过灵活的过滤条件查询任意实体数据, so that 我可以快速定位项目中的资产、镜头和任务状态。

#### Acceptance Criteria

1. WHEN 收到 `request_type` 为 `read` 的指令时，THE Instruction_Engine SHALL 根据 `type` 字段确定查询的实体类型。
2. THE Filter_Parser SHALL 支持以下关系运算符：`is`（等于）、`is_not`（不等于）、`in`（集合匹配）、`contains`（包含）、`not_contains`（不包含）、`greater_than`（大于）、`less_than`（小于）、`ends_with`（后缀匹配）、`type_is`（多态类型筛选）。
3. THE Filter_Parser SHALL 支持 `logical_operator` 为 `and` 或 `or` 的嵌套条件组合，嵌套深度不少于 3 层。
4. WHEN 过滤条件对象包含 `negate: true` 时，THE Filter_Parser SHALL 对该条件块的结果取反。
5. THE Instruction_Engine SHALL 根据 `columns` 列表动态提取 JSONB 字段，仅返回请求的列。
6. THE Instruction_Engine SHALL 支持 `paging` 参数（`current_page`、`records_per_page`），并在结果中返回 `paging_info`（总记录数、总页数）。
7. THE Instruction_Engine SHALL 支持 `sorts` 参数，对固定列和 JSONB 动态字段均可排序。
8. THE Instruction_Engine SHALL 支持 `grouping` 参数，按指定字段对结果分组，并在结果中返回 `groups` 数据。
9. WHEN 关联字段被请求时，THE Instruction_Engine SHALL 返回包含 `id`、`type`、`name` 的富引用对象，而非仅返回 ID。

---

### Requirement 3: 指令解析引擎 - create 指令

**User Story:** As a 制片/PM, I want 通过 API 创建新的实体记录, so that 我可以批量初始化项目中的资产和镜头列表。

#### Acceptance Criteria

1. WHEN 收到 `request_type` 为 `create` 的指令时，THE Instruction_Engine SHALL 将 `field_values` 中的标量字段映射到 `entities` 表的 `attributes` JSONB 列。
2. WHEN `field_values` 中包含关联对象或数组时，THE Instruction_Engine SHALL 将其映射到 `entities` 表的 `links` JSONB 列。
3. WHEN 实体创建成功后，THE Instruction_Engine SHALL 向 `event_logs` 表插入一条包含 `session_uuid`、`entity_type`、`entity_id` 和 `new_value` 的审计记录。
4. THE Instruction_Engine SHALL 返回新创建实体的 `id` 和 `uuid`。
5. IF 必填字段缺失，THEN THE Instruction_Engine SHALL 返回包含字段名称的验证错误，并不执行数据库写入。

---

### Requirement 4: 指令解析引擎 - update 指令与写-读联动

**User Story:** As a 艺术总监/组长, I want 修改任务状态后立即获取变更的审计日志, so that 前端界面可以实时展示 old_value 和 new_value 而无需额外请求。

#### Acceptance Criteria

1. WHEN 收到 `request_type` 为 `update` 的指令时，THE Instruction_Engine SHALL 在执行更新前先读取当前记录的字段值作为 `old_value`。
2. THE Instruction_Engine SHALL 执行字段更新，并在同一数据库事务中向 `event_logs` 插入包含 `{attribute_name, old_value, new_value, field_data_type, type: "attribute_change"}` 的审计记录。
3. WHEN `multi_entity_update_mode` 为 `add` 时，THE Instruction_Engine SHALL 将新值追加到 JSONB 数组中，而非替换整个数组。
4. WHEN 同一 `requests` 数组中 `update` 指令之后跟随 `read` 指令查询 `event_logs` 时，THE Instruction_Engine SHALL 确保 `update` 产生的日志对后续 `read` 指令可见（同一事务内可读）。
5. THE Instruction_Engine SHALL 支持通过 `session_uuid` 和 `created_at` 时间戳过滤审计日志，以隔离当前会话的变更记录。

---

### Requirement 5: 指令解析引擎 - delete 与 summarize 指令

**User Story:** As a 制片/PM, I want 软删除实体并获取聚合统计数据, so that 我可以归档过期内容并监控项目整体进度。

#### Acceptance Criteria

1. WHEN 收到 `request_type` 为 `delete` 的指令时，THE Instruction_Engine SHALL 将目标实体的 `is_retired` 字段设为 `true`，而非物理删除记录。
2. THE Instruction_Engine SHALL 在所有 `read` 查询中默认过滤 `is_retired = true` 的记录，除非请求中明确包含 `include_retired: true`。
3. WHEN 收到 `request_type` 为 `summarize` 的指令时，THE Instruction_Engine SHALL 支持以下聚合类型：`record_count`（记录总数）、`sum`（数值求和）、`maximum`（最大值）、`earliest`（最早日期）、`latest`（最晚日期）、`status_percentage`（特定状态值的百分比）。
4. THE Instruction_Engine SHALL 支持 `group_summarize` 指令，按指定字段分组后对每组执行聚合计算。

---

### Requirement 6: 数据库核心模型

**User Story:** As a 系统管理员, I want 系统使用统一的实体存储模型, so that 所有业务对象可以共享动态字段扩展能力而无需频繁修改数据库 Schema。

#### Acceptance Criteria

1. THE System SHALL 使用 `entities` 表统一存储所有实体类型（Project、Asset、Shot、Task、Version、Note 等），通过 `type` 字段区分。
2. THE System SHALL 在 `entities` 表的 `attributes` JSONB 列上建立 GIN 索引，确保对动态字段的查询在 100 万条记录规模下响应时间不超过 500ms。
3. THE System SHALL 使用 `event_logs` 表记录所有实体变更，包含 `session_uuid`、`entity_type`、`entity_id`、`meta`（含 old_value/new_value）和 `created_at`。
4. THE System SHALL 使用 `entity_relationships` 表存储任务依赖等多对多关系，支持 `relation_type` 字段区分关系类型。
5. THE System SHALL 为 `entities` 表的 `(type, project_id, is_retired)` 组合建立复合索引。
6. THE System SHALL 支持 `field_definitions` 表，记录每个项目每种实体类型的自定义字段定义，包含 `name`、`display_name`、`data_type` 和 `config`（JSONB）。

---

### Requirement 7: 项目管理中心

**User Story:** As a 制片/PM, I want 在项目门户页查看和管理所有项目, so that 我可以快速了解各项目状态并创建新项目。

#### Acceptance Criteria

1. THE System SHALL 以列表和卡片两种模式展示所有项目，每个项目显示 `name`、`code`、`sg_status`、`sg_fps`、`sg_resx`、`sg_resy` 和 `updated_at`。
2. WHEN 用户选择基于模板创建项目时，THE System SHALL 提供 TV Series、Film、Game、Mocap 等预设模板，并复制模板的 `field_definitions` 和 `pipeline_steps` 配置，不复制业务数据。
3. WHEN 用户选择克隆现有项目时，THE System SHALL 复制源项目的字段定义、权限配置和管线步骤，不复制 Asset、Shot、Task 等业务实体。
4. WHEN 新创建的项目在 Assets 或 Shots 模块中没有任何数据时，THE System SHALL 展示引导界面，包含明显的"Add Asset"或"Add Shot"操作入口。
5. THE System SHALL 支持将项目状态设置为 `Active` 或 `Archived`，`Archived` 状态的项目在默认视图中不显示。

---

### Requirement 8: 资产管理模块

**User Story:** As a 制片/PM, I want 在超级网格中管理项目资产, so that 我可以一览所有资产的管线步骤状态并进行批量操作。

#### Acceptance Criteria

1. THE Grid SHALL 支持按资产类型（如角色、场景、道具）进行多级分组折叠展示。
2. THE Grid SHALL 以管线步骤列（Pipeline Columns）形式聚合展示每个资产在各环节（Art、Model、Rig、Texture 等）的状态色块。
3. WHEN 用户选中多行并修改其中一行的属性时，THE System SHALL 提示用户是否将修改应用于所有选中行。
4. THE Grid SHALL 支持列的拖拽排序、隐藏/显示和固定（Pin）操作，并将用户的列配置持久化到 `page_configs` 存储中。
5. THE Grid SHALL 支持高级过滤侧边栏，允许用户组合多个过滤条件，并支持将过滤视图保存为私有或公共视图。
6. WHEN 单页面展示 2000 行 × 100 列数据时，THE Grid SHALL 通过虚拟化渲染保证滚动帧率不低于 30fps 且无白屏。

---

### Requirement 9: 镜头管理模块

**User Story:** As a 制片/PM, I want 按场次层级管理镜头, so that 我可以清晰地追踪每个镜头在各管线环节的制作进度。

#### Acceptance Criteria

1. THE System SHALL 支持 Sequence（场次）→ Shot（镜头）的两级层级结构，Shot 必须归属于一个 Sequence。
2. THE System SHALL 为每个 Shot 记录 `sg_cut_in`（剪入点）、`sg_cut_out`（剪出点）、帧数和镜头编码描述。
3. THE Grid SHALL 以状态矩阵形式横向展示每个 Shot 在 Lay、Ani、Lgt、Comp 等环节的实时进度色块。
4. WHEN 管线步骤状态为"待开始"时，THE Grid SHALL 以灰色色块显示；WHEN 状态为"进行中"时，THE Grid SHALL 以橘色显示；WHEN 状态为"打回"时，THE Grid SHALL 以红色显示；WHEN 状态为"完成"时，THE Grid SHALL 以绿色显示。
5. WHEN 用户点击状态色块时，THE System SHALL 跳转到该 Shot 对应管线步骤的 Task 详情页。

---

### Requirement 10: 任务与甘特图排期

**User Story:** As a 艺术总监/组长, I want 在甘特图中管理任务依赖和排期, so that 我可以直观地规划生产进度并识别关键路径。

#### Acceptance Criteria

1. THE System SHALL 为每个 Task 记录 `assignee`（负责人）、`start_date`（计划开始日期）、`due_date`（计划结束日期）和 `duration`（工期天数）。
2. THE System SHALL 提供甘特图视图，左侧为任务列表，右侧为时间轴，两侧联动滚动。
3. WHEN 用户在甘特图中拖拽任务条时，THE System SHALL 更新该 Task 的 `start_date` 和 `due_date`，并通过 `update` 指令持久化变更。
4. THE System SHALL 支持任务间的依赖关系（FS：完成-开始，SS：开始-开始），并在甘特图中以连线形式展示。
5. THE System SHALL 使用 `entity_relationships` 表存储任务依赖，`metadata` 字段记录 `dependency_type` 和 `offset_days`。
6. WHEN 任务视图为空时，THE System SHALL 展示快速添加任务的交互入口。

---

### Requirement 11: 媒体版本与审阅系统

**User Story:** As a 艺术总监/组长, I want 在审阅中心查看版本并发布反馈, so that 艺术家可以收到明确的修改意见并提交新版本。

#### Acceptance Criteria

1. THE System SHALL 支持针对同一 Task 提交多个 Version，并自动解析版本号（`v001`、`v002` 等）。
2. THE System SHALL 提供列表模式和缩略图模式两种审阅视图，列表模式展示版本链接、创建人和创建时间，缩略图模式以墙式展示所有审核内容。
3. WHEN 用户在 Version 下发布 Note 时，THE System SHALL 创建关联到该 Version 的 Note 实体，并通过通知机制告知相关 Artist。
4. THE System SHALL 支持在 Note 中附加文字内容和画标注信息。
5. WHEN 艺术家提交新 Version 时，THE System SHALL 自动触发 Media_Pipeline 处理流程。

---

### Requirement 12: 多媒体处理流水线

**User Story:** As a 艺术家, I want 上传视频文件后系统自动生成缩略图和播放代理, so that 审阅人员可以直接在浏览器中预览我的工作成果。

#### Acceptance Criteria

1. THE System SHALL 通过预签名 URL 支持前端直接上传文件至对象存储（MinIO 或 S3），不经过 API 服务器中转。
2. WHEN 文件上传完成后，THE Media_Pipeline SHALL 将转码任务推送至 Redis 队列，由 Celery Worker 异步处理。
3. THE Media_Pipeline SHALL 使用 FFmpeg 生成不小于 256×256 像素的 JPG 缩略图。
4. THE Media_Pipeline SHALL 使用 FFmpeg 将原始视频转码为 H.264 编码的 MP4 播放代理文件。
5. WHEN 转码完成后，THE Media_Pipeline SHALL 更新对应 Version 实体的 `sg_uploaded_movie_transcoding_status` 字段，并通过 WebSocket 通知前端刷新。
6. IF 转码任务失败，THEN THE Media_Pipeline SHALL 将错误信息记录到 `event_logs`，并将 Version 的转码状态标记为失败。

---

### Requirement 13: 动态字段与页面配置

**User Story:** As a 制片/PM, I want 为项目自定义字段并保存个人视图配置, so that 我可以根据项目需求扩展数据模型而无需修改系统代码。

#### Acceptance Criteria

1. THE System SHALL 允许用户在线定义字段类型，支持：`text`（文本）、`number`（数字）、`list`（下拉列表）、`checkbox`（复选框）、`entity_link`（实体关联）。
2. THE System SHALL 将自定义字段定义存储在 `field_definitions` 表中，并在 `entities.attributes` JSONB 列中存储对应的字段值。
3. THE System SHALL 支持 `page_configs` 存储机制，持久化用户的过滤条件、列宽、列顺序和分组配置。
4. WHEN 用户访问项目列表页时，THE System SHALL 先加载该用户的 `page_config`，再根据配置中的过滤条件构造 `read` 指令查询数据。
5. THE System SHALL 支持将视图配置保存为私有（仅当前用户可见）或公共（项目内所有成员可见）。

---

### Requirement 14: 权限控制 (RBAC)

**User Story:** As a 系统管理员, I want 基于角色控制用户对项目和实体的访问权限, so that 客户只能查看被授权的项目内容，艺术家只能修改自己负责的任务。

#### Acceptance Criteria

1. THE System SHALL 实现基于角色的访问控制，支持以下角色：Admin、Producer、Art_Director、Artist、Client。
2. WHEN Client 角色用户访问系统时，THE System SHALL 仅展示该用户被明确授权的项目，且只允许只读访问。
3. WHEN Artist 角色用户尝试修改非自己负责的 Task 时，THE System SHALL 返回 403 错误并拒绝操作。
4. THE System SHALL 在返回 `read` 指令结果前，根据当前用户角色动态过滤 `attributes` JSONB 中无权查看的字段。
5. THE System SHALL 支持字段级权限配置，允许管理员在 `field_definitions` 中为特定字段设置可见角色列表。

---

### Requirement 15: 数据一致性与级联处理

**User Story:** As a 系统管理员, I want 删除资产时系统明确处理关联数据, so that 不会产生孤立的任务、版本或反馈记录。

#### Acceptance Criteria

1. WHEN 一个 Asset 或 Shot 被软删除时，THE System SHALL 同时将其关联的所有 Task 实体的 `is_retired` 设为 `true`。
2. WHEN 一个 Task 被软删除时，THE System SHALL 同时将其关联的所有 Version 实体的 `is_retired` 设为 `true`。
3. WHEN 一个 Version 被软删除时，THE System SHALL 保留关联的 Note 实体，但将 Note 的关联链接标记为已失效。
4. THE System SHALL 在执行级联软删除时，为每个被影响的实体在 `event_logs` 中记录独立的审计条目。
5. IF 删除操作因关联数据处理失败而中断，THEN THE System SHALL 回滚所有变更并返回包含失败原因的错误信息。

---

### Requirement 16: 实时通知与活动流

**User Story:** As a 艺术家, I want 实时收到任务状态变更和审阅反馈的通知, so that 我可以及时响应而无需手动刷新页面。

#### Acceptance Criteria

1. THE System SHALL 通过 WebSocket 连接向在线用户推送实体变更通知，延迟不超过 2 秒。
2. WHEN 一个 Note 被创建并关联到某个 Task 时，THE System SHALL 向该 Task 的所有 `task_assignees` 推送通知。
3. THE System SHALL 在项目概览页提供动态流（Activity Feed），实时展示项目内所有实体的变更、Note 发布和 Version 提交记录。
4. WHEN 用户离线时产生的通知，THE System SHALL 在用户下次登录时通过消息中心展示未读通知列表。

---

### Requirement 17: 解析器与序列化（Round-Trip 保证）

**User Story:** As a 系统管理员, I want 系统的过滤器和配置数据能够可靠地序列化和反序列化, so that 保存的视图配置在任何时候加载都能产生一致的查询结果。

#### Acceptance Criteria

1. THE Filter_Parser SHALL 将 API 过滤条件对象解析为有效的 PostgreSQL SQL WHERE 子句。
2. THE Pretty_Printer SHALL 将内部过滤条件结构格式化回标准 JSON 过滤条件对象。
3. FOR ALL 有效的过滤条件对象，解析后再格式化再解析 SHALL 产生语义等价的 SQL WHERE 子句（round-trip 属性）。
4. THE Filter_Parser SHALL 在收到格式无效的过滤条件时返回包含具体错误位置的描述性错误信息。
5. THE System SHALL 对 `page_configs` 中存储的视图配置执行相同的 round-trip 保证：存储后读取的配置与存储前的配置语义等价。

---

### Requirement 18: 桌面端与 DCC 集成

**User Story:** As a 艺术家, I want 在 Maya/Houdini 等 DCC 软件中直接提交版本, so that 我无需离开制作软件就能完成版本上传和任务状态更新。

#### Acceptance Criteria

1. THE System SHALL 提供 Python SDK，封装对 `POST /crud/requests` 接口的调用，支持 `fetch_task_info(task_id)` 和 `publish_version(task_id, file_path)` 方法。
2. THE System SHALL 提供基于 PySide6 的桌面轻量级客户端，访问与 Web 端相同的 FastAPI 接口。
3. WHEN `publish_version(task_id, file_path)` 被调用时，THE System SHALL 自动获取预签名上传 URL、上传文件并创建 Version 实体记录。
4. THE System SHALL 确保 Python SDK 与 Web 前端使用相同的认证机制（Cookie + CSRF Token 或 API Token）。
