我们的需求是要复刻shotgunstudio这个系统。

以下是头脑风暴出的零碎的想法。

# 工业级影视全流程项目管理系统 - 业务需求规格书 (PRD)

**版本：** v1.0  
**文档状态：** 初稿（业务逻辑全景版）  
**适用对象：** 产品、制片、UI/UX、技术架构师

---

## 1. 项目综述

### 1.1 目标描述

构建一个高度可定制的、支持超大规模数据协作的影视/动画生产管理平台。系统需覆盖从项目立项、资产创建、镜头排期、任务分发到媒体审阅的全生命周期。

### 1.2 核心价值

*   **标准化：** 通过项目模板规范各环节命名与流程。
*   **透明化：** 实时追踪数千个任务的状态与反馈。
*   **高效化：** 强大的网格引擎支持批量处理与动态字段自定义。

---

## 2. 用户角色定义

*   **系统管理员：** 维护全局设置、权限组、基础模板。
*   **制片/PM：** 创建项目、导入镜头/资产、分配任务、监控进度。
*   **艺术总监/组长：** 定义管线步骤、审核版本、发布批注。
*   **艺术家：** 接收任务、提交工作版本、查看反馈。
*   **客户/外部供应商：** 受限查看特定项目的审核进度。

---

## 3. 功能模块详细说明

### 3.1 项目管理中心 (Project Portal)

*   **项目门户页：** 
    *   以列表或卡片形式展示所有活跃项目。
    *   展示关键元数据：项目代码、状态（Active/Archived）、FPS、分辨率、最后更新时间。
*   **项目创建向导：**
    *   **基于模板创建：** 提供 TV Series, Film, Game, Mocap 等标准管线模板，预设字段与步骤。
    *   **基于现有项目克隆：** 复制已有项目的配置（字段定义、权限、管线步骤），但不复制具体数据。
*   **空状态引导：** 新创建的项目在 Assets/Shots 模块需提供明显的引导（如“Add Asset”按钮及说明），帮助用户完成初始化。

### 3.2 项目概览 (Project Overview)

*   **动态流 (Activity Feed)：** 实时滚动展示项目内所有实体的变更、备注发布、版本提交记录。
*   **项目信息板：** 集中展示项目缩略图、参与成员列表、核心规格（FPS等）。
*   **小组件 (Widgets)：** 支持自定义展示最近媒体版本、待办任务统计、项目公告。

### 3.3 资产管理模块 (Assets)

*   **超级网格 (Grid)：** 
    *   支持“资产类型（如角色、场景、道具）”的多级分组折叠。
    *   **管线步骤列 (Pipeline Columns)：** 聚合展示该资产下所有环节（如 Art, Model, Rig, Texture）的状态。支持大组标题一键展开/收起。
*   **实体属性：** 支持基础字段（ID, Thumbnail, Name）及用户自定义扩展字段（如：中文名、制作难度、参考链接）。

### 3.4 镜头管理模块 (Shots)

*   **层级结构：** 支持按 Sequence（场次）对 Shots（镜头）进行分组管理。
*   **剪辑属性：** 记录镜头的 Cut In/Out 点、帧数、镜头编码描述。
*   **状态矩阵：** 横向展示 Lay, Ani, Lgt, Comp 等环节的实时进度。

### 3.5 任务与排期 (Tasks & Gantt)

*   **任务追踪：** 每个资产/镜头下的独立工序，记录负责人、计划起始日期、工期。
*   **甘特图视图 (Gantt)：** 
    *   左侧列表与右侧时间轴联动。
    *   支持拖拽调整任务周期，并直观展示任务间的依赖关系。
*   **任务引导：** 空任务视图下提供快速添加任务的交互入口。

### 3.6 媒体版本与审阅 (Versions & Review)

*   **版本演进：** 针对同一任务提交的多个产出物，自动解析 `v001, v002`。
*   **审阅中心：** 
    *   **列表模式：** 详细展示版本链接、创建人、创建时间。
    *   **缩略图模式：** 墙式展示所有审核内容。
*   **反馈系统 (Notes)：** 在播放器或版本下方发布文字、打画标注，并自动通知相关艺术家。

---

## 4. 核心交互逻辑与规则

### 4.1 动态字段逻辑 (Custom Fields)

*   用户可在线定义字段类型（文本、列表、复选框、多实体关联）。
*   自定义字段需能在 Projects、Assets、Shots 等所有模块中自由添加和配置。

### 4.2 表格交互规则

*   **批量编辑：** 选中多行后，修改其中一行的属性应提示是否应用于所有选中项。
*   **高级过滤：** 侧边栏提供组合过滤器，支持保存为私有或公共视图。
*   **列管理：** 用户可自由拖拽列顺序、隐藏/显示列、固定（Pin）核心列。

### 4.3 管线步骤逻辑 (Pipeline Steps)

*   步骤的状态色块应直观反映当前进度（如：灰色-待开始、橘色-进行中、红色-打回、绿色-完成）。
*   支持点击色块快速跳转到该环节的 Task 详情。

---

## 5. 非功能性需求

*   **超大数据量承载：** 在单页面展示 2000 行、100 列数据时，需保证滚动流畅且无白屏。
*   **实时性：** 状态修改后需全项目可见，并实时更新关联的统计百分比。
*   **数据一致性：** 确保在删除资产时，关联的任务、版本及反馈有明确的处理机制（级联删除或保留）。

---

## 6. 系统生命周期流程 (Workflow)

1.  **立项：** 管理员通过模板创建项目 `SMD_Project`。
2.  **配置：** 制片人根据项目需求，增加自定义字段（如：外包价格、导演优先级）。
3.  **初始化：** 制片人在 Shots 模块导入镜头列表（初始状态为空）。
4.  **分发：** 为镜头添加任务（Animation），并分配给特定艺术家。
5.  **生产：** 艺术家在软件中制作，提交 `v001` 版本。
6.  **审阅：** 组长在审阅中心查看 `v001`，发布反馈 Note，并将任务状态改为“打回”。
7.  **迭代：** 艺术家根据 Note 修改，提交 `v002`，直至审核通过。

---


##  推荐的技术栈组合：

| 模块                   | 推荐技术                           |
| ---------------------- | ---------------------------------- |
| **前端 (展示层)**      | React + TanStack Table + Virtuoso  |
| **后端 (逻辑层)**      | Python (FastAPI)                   |
| **数据库 (持久层)**    | PostgreSQL (JSONB)                 |
| **缓存/队列 (中间层)** | Redis (处理异步任务和实时通知)     |
| **存储 (文件层)**      | MinIO 或 S3 (存视频、图片、大文件) |
| **处理 (多媒体层)**    | FFmpeg (生成缩略图、转码播放代理)  |
| **桌面 (管线层)**      | Python (PySide6) + 各软件插件接口  |
| **基础设施 (运维层)**  | Docker (一键部署所有组件)          |


## 1. 项目概览

复刻一套类似 Shotgun 的影视特效生产管理系统核心。系统采用 **“单一 API 网关 + 批量指令集 + JSONB 桶存储”** 的架构。前端通过一次请求发送多个指令，后端利用 PostgreSQL 的 JSONB 特性实现无限动态字段扩展。

---

## 2. 核心技术栈

*   **后端**: Python (FastAPI/Flask) 或 Node.js (NestJS/Express)
*   **数据库**: **PostgreSQL (必须使用 JSONB)**
*   **接口规范**: 指令驱动型 POST 接口
*   **核心逻辑**: 异步事件审计、软删除、多态关联

---

## 3. 数据库模型设计 (PostgreSQL)

Cursor，请首先创建以下核心表结构：

### 3.1 实体主表 `entities`

```sql
CREATE TABLE entities (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,            -- 如 'Project', 'Asset', 'Task', 'Version'
    code TEXT,                            -- 核心标识名称
    project_id INTEGER,                   -- 顶层项目 ID (隔离索引)
    
    -- 业务属性桶：存储所有动态字段 (如状态、日期、工期、技术规格)
    attributes JSONB DEFAULT '{}'::jsonb, 
    
    -- 关联桶：存储多态引用和集合 (如 task_assignees, note_links)
    -- 格式示例: {"step": {"id": 13, "type": "Step"}, "tags": [{"id": 1, "type": "Tag"}]}
    links JSONB DEFAULT '{}'::jsonb, 
    
    is_retired BOOLEAN DEFAULT FALSE,     -- 软删除标记
    is_template BOOLEAN DEFAULT FALSE,    -- 模板标记
    uuid UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER,
    updated_by INTEGER
);
CREATE INDEX idx_entities_attrs ON entities USING GIN (attributes);
CREATE INDEX idx_entities_links ON entities USING GIN (links);
CREATE INDEX idx_entities_main ON entities (type, project_id, is_retired);
```

### 3.2 系统事件审计表 `event_logs`

```sql
CREATE TABLE event_logs (
    id BIGSERIAL PRIMARY KEY,
    session_uuid UUID NOT NULL,           -- 客户端操作会话 ID
    event_type VARCHAR(100),              -- 如 'Shotgun_Asset_Change'
    entity_type VARCHAR(50),
    entity_id INTEGER,
    meta JSONB,                           -- 存储 {"attribute_name": "...", "old_value": "...", "new_value": "..."}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_event_logs_lookup ON event_logs (session_uuid, id ASC);
```

---

## 4. API 逻辑实现 (指令解析引擎)

### 4.1 统一入口

*   **Endpoint**: `POST /crud/requests`
*   **Payload**: 接收一个 `requests` 数组。
*   **事务处理**: 如果 `batch_transaction=true`，数组内所有指令必须在同一个 DB 事务中运行。

### 4.2 指令解析逻辑 (`request_type`)

Cursor，请按以下逻辑编写处理器：

1.  **`read` 指令**:
    *   根据 `filters` 动态构建 SQL。
    *   支持 `relation`: `is`, `in`, `type_is` (匹配 links 里的 type), `ends_with`, `negate` (取反)。
    *   支持 `subquery`: 嵌套查询关联实体的属性。
    *   根据 `columns` 列表，利用 `jsonb_build_object` 动态提取 JSONB 里的 Key。

2.  **`create` 指令**:
    *   将 `field_values` 中的键值对映射到 `attributes`（标量）或 `links`（关联对象/数组）。
    *   **重要**: 写入成功后，必须向 `event_logs` 插入一条记录，携带当前请求的 `session_uuid`。

3.  **`update` 指令**:
    *   支持单字段更新。
    *   若 `multi_entity_update_mode="add"`，需使用 `jsonb_set` 或 `||` 将值追加到 JSONB 数组中，而非替换。
    *   **重要**: 每次更新需计算 Old/New Value 并写入 `event_logs`。

4.  **`delete` 指令**:
    *   将 `is_retired` 设为 `true`。

5.  **`summarize` 指令**:
    *   实现聚合计算：`record_count`, `sum`, `maximum`, `status_percentage` (计算 status 为特定值的百分比)。

    # API 接口说明文档

## 1. 批量数据处理接口 (CRUD Batch Requests)

该接口是 Shotgun 系统的核心数据总线。它允许前端在单次 HTTP POST 请求中封装多个独立的数据指令（`requests`），支持对多种实体类型进行读取、统计、分组及排程计算。

*   **请求路径**: `/crud/requests`
*   **请求方法**: `POST`
*   **内容类型**: `application/x-www-form-urlencoded`
*   **功能描述**: 统一执行 Shotgun 实体（项目、镜头、资产、任务、版本、备注等）的 CRUD 操作、统计聚合及媒体中心管理。

### A. 请求公共参数 (Form Data)

| 参数名                 | 类型          | 必选 | 说明                                                         |
| :--------------------- | :------------ | :--- | :----------------------------------------------------------- |
| `requests`             | String (JSON) | 是   | **核心参数**。包含一个或多个子任务对象的 JSON 数组。详见下方说明。 |
| `csrf_token`           | String        | 是   | 安全校验令牌。                                               |
| `session_uuid`         | UUID          | 否   | 会话唯一标识，用于服务端请求追踪。                           |
| `bkgd`                 | Boolean       | 否   | 是否以后台进程模式运行（默认 `false`）。                     |
| `debug`                | Boolean       | 否   | 开启后返回详细的后端错误信息。                               |
| `amplitude_session_id` | Long          | 否   | 埋点统计会话 ID。                                            |

---

### B. `requests` 内部对象结构说明

每个 request 对象是一个独立的执行指令：

#### 1. 指令控制字段

| 字段名         | 类型   | 可选值/示例                                                  | 说明                                     |
| :------------- | :----- | :----------------------------------------------------------- | :--------------------------------------- |
| `request_type` | String | `read`, `summarize`, `group_summarize`                       | 操作类型：查询记录、全局统计、分组统计。 |
| `type`         | String | `Project`, `Asset`, `Version`, `Task`, `Note`, `HumanUser`... | **实体类型**。                           |
| `read`         | Array  | `["entities", "paging_info", "groups"]`                      | 返回内容控制。                           |
| `columns`      | Array  | 见 [C. 核心实体字段说明]                                     | 返回的字段列表。支持跨实体关联路径。     |
| `promise`      | Object | `{"is_promise": true}`                                       | 承诺模式，用于复杂查询的异步处理。       |

#### 2. 高级过滤逻辑 (`filters`)

*   **logical_operator**: `and`, `or`。支持深层嵌套。
*   **conditions**: 条件数组。
*   **relation (关系符)**:
    *   `is` / `in` / `is_not`: 匹配、集合匹配、不等于。
    *   `type_is`: 多态类型筛选（如：筛选关联到 `Asset` 的所有 `Version`）。
    *   `greater_than` / `less_than`: 日期或数值比较。
*   **negate**: (Boolean) 为 `true` 时，对当前条件块的结果取反。

#### 3. 统计聚合方式 (`summaries`)

*   `record_count`: 统计记录总数。
*   `status_percentage`: 计算百分比（常用于任务进度）。
*   `earliest` / `latest`: 获取日期字段的最早或最晚值。
*   `maximum`: 获取最大值。
*   `sum`: 数值求和（如工期总计）。

---

### C. 核心实体业务字段说明

#### 1. 项目 (`Project`) **(重要更新)**

用于管理创作项目的全局设置。

*   **基础字段**: `name`, `code` (项目简称), `sg_status` (状态: `Active`, `Archive`等), `sg_type` (类型)。
*   **技术规格**:
    *   **`sg_fps`**: **(新)** 项目的帧率设置。
    *   **`sg_resx`**: **(新) **项目画布宽度。
    *   **`sg_resy`**: **(新)** 项目画布高度。
*   **显示资产**: `billboard` (首页大图), `image` (缩略图), `filmstrip_image` (胶片预览)。
*   **系统标记**: `is_template` (是否为模板), `archived` (是否已归档)。

#### 2. 媒体版本 (`Version`)

*   `sg_uploaded_movie_transcoding_status`: 转码状态 (0 为完成)。
*   `user.HumanUser.firstname` / `user.ApiUser.firstname`: 分别获取人类用户或 API 用户的名称。

#### 3. 任务与备注 (`Task` / `Note`)

*   `task_assignees`: 任务分配对象。
*   `note_links`: 备注关联的实体链接。

#### 4. 用户信息 (`HumanUser`)

*   `can_impersonate_this_user`: 是否允许管理员模拟身份。

---

### D. 典型请求场景示例

#### 场景 1：获取所有“处于激活状态”的项目及技术规格

```json
{
  "request_type": "read",
  "type": "Project",
  "filters": {
    "logical_operator": "and",
    "conditions": [
      {
        "path": "sg_status",
        "relation": "is",
        "values": ["Active"]
      }
    ]
  },
  "columns": ["name", "code", "sg_status", "sg_fps", "sg_resx", "sg_resy", "is_template"],
  "sorts": [{"column": "name", "direction": "asc"}],
  "paging": {"current_page": 1, "records_per_page": 50}
}
```

#### 场景 2：排除已转码成功的版本 (使用 negate)

```json
{
  "request_type": "read",
  "type": "Version",
  "filters": {
    "logical_operator": "and",
    "conditions": [
      {
        "logical_operator": "or",
        "conditions": [{"path": "sg_uploaded_movie_transcoding_status", "relation": "is", "values": [0]}],
        "negate": true
      }
    ]
  }
}
```

---

### E. 公共 Context 与 Header 说明

*   **local_timezone_offset**: `8` (北京时间)。
*   **source_widget (page_id)**:
    *   `4762`: **(新)** 全局项目管理页 (Projects Page)。
    *   `5561`: 项目概览页。
    *   `5565`: 媒体中心。
*   **Header: Referer**: 校验页面来源，如 `.../projects`。
*   **Header: X-Requested-With**: 固定为 `XMLHttpRequest`。

---

如果您后续有任何关于 **Update (修改数据)**、**Create (新建记录)** 或 **Delete (删除)** 的操作示例，请发送给我。我们已经完整覆盖了 Shotgun 的**所有核心数据检索、复杂统计及项目管理属性逻辑**。

# 工业级影视全流程项目管理系统 - 技术方案说明书 (TDD)

**版本：** v1.0  
**技术栈核心：** React / FastAPI / PostgreSQL (JSONB) / Celery / MinIO

---

## 1. 总体架构设计 (System Architecture)

系统采用 **前后端分离 + 异步任务处理 + 对象存储** 的分布式架构。

*   **前端层 (UI Layer):** 基于 React 的单页应用 (SPA)，处理复杂的网格渲染与交互。
*   **接入层 (API Layer):** FastAPI 提供高性能 RESTful 接口，处理业务逻辑与权限校验。
*   **任务层 (Worker Layer):** Celery + Redis 处理耗时的多媒体转码（FFmpeg）与自动化流水线。
*   **持久层 (Storage Layer):** 
    *   **PostgreSQL:** 存储结构化元数据（核心字段 + JSONB 动态字段）。
    *   **MinIO/S3:** 存储原始视频、图片、工程文件。
    *   **Redis:** 缓存 Session、任务状态及实时通知消息。

---

## 2. 数据库设计 (Database Design)

### 2.1 混合存储模型 (Hybrid Schema)

为了平衡“高性能查询”与“字段高度灵活性”，采用 **“核心列 + JSONB 列”** 方案。

#### A. 实体基础表 (如 `assets`, `shots`, `tasks`)

```sql
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status_code VARCHAR(50) DEFAULT 'wtg', -- 核心状态
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- 核心灵魂：存储所有用户自定义字段
    custom_fields JSONB DEFAULT '{}', 
    -- 冗余字段：存储快照或汇总数据（如完成百分比）
    summary_data JSONB DEFAULT '{}'
);
-- 关键索引：针对 JSONB 建立 GIN 索引，确保万级数据下搜索自定义字段不卡顿
CREATE INDEX idx_assets_custom_fields ON assets USING GIN (custom_fields);
```

#### B. 字段定义表 (`field_definitions`)

记录每个项目、每个实体拥有哪些自定义列及其渲染类型。

*   `name`: 内部 Key（如 `material_type`）
*   `display_name`: UI 显示名（如 `材质类型`）
*   `data_type`: 类型（`text`, `number`, `list`, `checkbox`, `entity_link`）
*   `config`: JSONB 格式，存下拉框选项或校验规则。

---

## 3. 前端技术方案 (Frontend Strategy)

### 3.1 超级网格渲染引擎

针对 **“2000行 x 100列”** 的极端场景，采用 **“无头逻辑 + 虚拟化”** 方案。

*   **TanStack Table (v8):** 
    *   处理表格状态（排序、过滤、列隐藏、列交换、行选中）。
    *   实现 **列组 (Column Grouping)** 功能，支撑 Art/Model 等管线步骤的聚合展示。
*   **React-Virtuoso:** 
    *   实现 **双向虚拟化**。仅渲染用户视口内的单元格，内存占用恒定。
    *   支持固定列（ID, Thumbnail）与动态宽度计算。

### 3.2 状态管理与并发更新

*   **Zustand:** 轻量级管理全局 UI 状态（当前项目、选中的行）。
*   **Immer:** 处理复杂的嵌套 JSON 状态更新，确保不可变性。
*   **批量编辑逻辑：** 前端收集选中的 ID 列表，向后端发送单个 PATCH 请求，利用 PostgreSQL 的 `jsonb_set` 或 `jsonb_merge` 进行原子化批量更新。

---

## 4. 后端技术方案 (Backend Strategy)

### 4.1 FastAPI 异步架构

*   **异步 I/O：** 全面使用 `async def` 处理数据库查询与文件操作，提升高并发下的系统吞吐量。
*   **Pydantic 模型：** 定义动态 Schema，利用 Python 类型提示对前端传来的 JSONB 数据进行强校验。

### 4.2 多媒体处理流水线 (Media Pipeline)

1.  **上传：** 前端通过 S3 预签名 URL 直接上传至 MinIO。
2.  **触发：** FastAPI 接收到上传完成回调，推送转码任务至 Redis 队列。
3.  **转码：** Celery Worker 调用 **FFmpeg**：
    *   命令 1: 生成 256x256 的 JPG 缩略图。
    *   命令 2: 生成 Web 友好的 H.264 MP4 (Proxy)。
4.  **写回：** 更新 `versions` 表，通过 WebSocket 通知前端。

---

## 5. 关键技术难点解决 (Problem Solving)

### 5.1 项目模板与克隆

*   **技术实现：** 后端编写递归克隆逻辑。当从模板创建项目时，仅复制 `field_definitions` 和 `pipeline_steps` 的配置行，不触碰业务数据表。

### 5.2 动态字段的搜索与排序

*   **搜索：** 构造 PostgreSQL 的 `->>` 操作符 SQL。
*   **排序：** 利用 JSONB 路径抽取进行排序，并结合特定类型的索引优化。

### 5.3 权限控制 (RBAC)

*   **Casbin (Python版):** 采用“实体-动作-角色”模型。
*   **字段级过滤：** 后端在返回 JSON 数据前，根据当前用户角色，动态剔除 `custom_fields` 中无权查看的键值对。

---

## 6. 基础设施与部署 (Infrastructure)

*   **容器化：** 使用 **Docker Compose** 编排服务。
    *   `api`: FastAPI 实例
    *   `worker`: Celery 转码进程
    *   `db`: PostgreSQL
    *   `storage`: MinIO
    *   `cache`: Redis
*   **自动化：** 数据库迁移由 **Alembic** 统一管理。
*   **监控：** 引入 Prometheus + Grafana 监控转码队列堆积情况及数据库连接数。

---

## 7. 桌面端集成方案 (Desktop SDK)

*   **技术：** Python (PySide6) 开发桌面轻量级 Client。
*   **集成：** 通过标准 Python `requests` 访问网页端同一套 FastAPI 接口。
*   **DCC 支撑：** 提供统一的 Python 包，供 Maya/Houdini 等软件调用，实现：
    *   `fetch_task_info()`: 获取当前任务详情。
    *   `publish_version()`: 自动上传并创建版本记录。

---

### 总结

利用 **JSONB** 解决了灵活性问题，利用 **TanStack + Virtuoso** 解决了前端卡顿问题，利用 **FastAPI + Celery** 解决了管线自动化的性能问题。这是一套具备高度扩展性的工业级架构。


# Autodesk Shotgun / Flow Production Tracking  
# **/crud/requests 接口完整官方级文档**

**接口地位**：**全系统唯一核心数据接口**  
**所有页面（列表、详情、新建、编辑、删除）99% 走这里**  
**支持：查询 / 新建 / 更新 / 删除 / 批量操作**

---

# 1. 基础信息
```
POST https://{domain}.shotgunstudio.com/crud/requests
```

- 请求类型：`application/x-www-form-urlencoded`
- 认证方式：`Cookie + CSRF Token`
- 返回格式：`JSON`

---

# 2. 必传请求参数（顶层结构）
```
requests=[]
&csrf_token=xxx
&session_uuid=xxx
&bkgd=false
&batch_transaction=false
```

## 顶层参数说明
| 参数 | 说明 |
|---|---|
| `requests` | **核心请求数组**，可批量多个操作 |
| `csrf_token` | 防跨域token（必须从浏览器Cookie取） |
| `session_uuid` | 会话ID（浏览器复制） |
| `bkgd` | 后台运行，固定 false |
| `batch_transaction` | 批量事务，固定 false |

---

# 3. requests 数组内部结构（单个请求）
```json
{
  "request_type": "read",
  "type": "Asset",
  "read": ["entities", "paging_info", "groups"],
  "filters": {},
  "columns": [],
  "sorts": [],
  "paging": {},
  "grouping": [],
  "source_widget": {}
}
```

---

# 4. 关键字段详解（最完整版）

## 4.1 request_type（操作类型）
- `read`        **查询（列表/详情）**
- `create`      新建
- `update`      更新
- `delete`      删除
- `summarize`   汇总/统计

## 4.2 type（实体类型，最核心）
**你想查什么，只改这个字段！**

```
Asset           资产
Shot            镜头
Task            任务
Version         版本
Project         项目
HumanUser       用户
PublishFile     发布文件
Playlist        播放列表
Step            步骤/状态
Ticket          工单
Note            备注
```

## 4.3 read（返回内容）
```
"read": ["entities", "paging_info", "groups"]
```
- `entities`      实际数据列表
- `paging_info`   分页
- `groups`        分组结果

## 4.4 filters（查询条件）
结构固定三层：
```json
"filters": {
  "conditions": [
    {
      "path": "project",
      "relation": "is",
      "values": [{ "type": "Project", "id": 153 }]
    }
  ],
  "logical_operator": "and"
}
```

### relation 支持
```
is              等于
is_not          不等于
contains        包含
not_contains    不包含
between         之间
greater_than    大于
less_than       小于
```

## 4.5 columns（返回字段）
任意字段，系统支持什么写什么：
```
"id", "code", "name", "sg_status_list", "image", 
"tags", "project", "tasks", "description", "created_by"
```

## 4.6 sorts（排序）
```json
"sorts": [
  { "column": "id", "direction": "asc" }
]
```

## 4.7 paging（分页）
```json
"paging": {
  "current_page": 1,
  "records_per_page": 50
}
```

## 4.8 grouping（分组）
```json
"grouping": [
  { "column": "sg_asset_type", "direction": "asc", "method": "exact" }
]
```

---

# 5. 完整可用示例（直接复制跑）

## 示例：查询 SMD 项目(153) 下所有资产
```json
[
  {
    "request_type": "read",
    "type": "Asset",
    "read": ["entities", "paging_info"],
    "filters": {
      "conditions": [
        {
          "path": "project",
          "relation": "is",
          "values": [{"type":"Project","id":153}]
        }
      ]
    },
    "columns": [
      "id","code","sg_status_list","image","tags","project","tasks"
    ],
    "sorts": [{"column":"id","direction":"asc"}],
    "paging": {"current_page":1,"records_per_page":50}
  }
]
```

---

# 6. 批量请求示例（一次查多种数据）
```json
[
  {"request_type":"read","type":"Asset",...},
  {"request_type":"read","type":"Shot",...},
  {"request_type":"read","type":"Task",...}
]
```

---

# 7. 返回结构说明
```json
{
  "results": [
    {
      "entities": [...],
      "paging_info": {...}
    }
  ]
}
```

- `results[0].entities` 就是真实列表
- 字段名、类型、值全部原样返回

---

# 8. 你必须从浏览器获取的关键值（不可缺少）
1. `_session_id`
2. `csrf_token_u88` → 对应 `csrf_token` 参数
3. `session_uuid`

---

# 9. 一句话终极总结（最重要）
## **/crud/requests = Shotgun 的万能数据心脏**
## **只需要改 type，就能获取全系统任何数据**
- Asset 资产
- Shot 镜头
- Task 任务
- Version 版本
- Project 项目
- User 用户

---


### 第一部分：API 核心架构汇总 (Interface Implementation)

该系统通过一个通用的 `POST /crud/requests` 接口实现了一套 **领域驱动设计 (DDD)** 的查询语言。

*   **设计模式**: 批处理指令模式（Batch Command Pattern）。
*   **请求结构**:
    *   `requests[]`: 指令数组，支持 `read` (查询), `summarize` (聚合), `group_summarize` (分组聚合)。
    *   **多态查询**: 同一个 `entity` 字段可以指向不同类型的对象。
    *   **异步承诺**: 支持 `promise` 标记，用于处理长耗时任务。
*   **过滤引擎**: 支持嵌套逻辑 (`and`/`or`)、取反 (`negate`)、以及针对多态关联的类型筛选 (`type_is`)。

---

### 第二部分：反推 PostgreSQL 表结构设计

基于 JSONB 的特性，为了平衡**灵活性（动态字段）**和**查询性能（结构化字段）**，建议采用以下设计：

#### 1. 主表：`entities` (全实体存储表)

这是最核心的表，所有的 `Shot`, `Asset`, `Task`, `Version` 等都存储在这里。

```sql
CREATE TABLE entities (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,            -- 对应 API 中的 type: 'Shot', 'Asset', 'Task', 'Version' 等
    project_id INTEGER REFERENCES entities(id), -- 绝大多数实体归属于某个 Project
    uuid UUID DEFAULT gen_random_uuid(),  -- 系统唯一标识
    
    -- 核心元数据（固定列，方便索引和基础排序）
    code TEXT,                            -- 实体名称/编号，如 'S01_C001'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER,                   -- 指向 HumanUser 的 id
    updated_by INTEGER,                   -- 指向 HumanUser 的 id
    
    -- 动态数据存储（核心字段）
    -- 存储 sg_status_list, start_date, due_date, technical_specs 等所有自定义字段
    attributes JSONB DEFAULT '{}'::jsonb,
    
    -- 关联关系存储
    -- 存储如 task_assignees (Array), note_links (Array) 等多对多关系
    links JSONB DEFAULT '{}'::jsonb
);

-- 索引优化
CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_project ON entities(project_id);
-- JSONB 索引：支持高效搜索 attributes 内部的任何字段
CREATE INDEX idx_entities_attributes ON entities USING GIN (attributes);
-- 针对 code 的全文检索或前缀搜索
CREATE INDEX idx_entities_code ON entities(code);
```

#### 2. 关系表：`entity_dependencies` (任务依赖/层级)

虽然 JSONB 可以存储关系，但对于 API 中出现的 `TaskDependency`（FS/SS 依赖）和 `WorkDayRule`，使用专门的关系表进行路径查询（Recursive query）效率更高。

```sql
CREATE TABLE entity_relationships (
    id SERIAL PRIMARY KEY,
    from_id INTEGER NOT NULL REFERENCES entities(id), -- 主实体
    to_id INTEGER NOT NULL REFERENCES entities(id),   -- 目标实体
    relation_type VARCHAR(50),                        -- 'dependency', 'parent_child', 'link'
    
    -- 存储依赖的具体属性，如 offset_days, dependency_type (FS/SS)
    metadata JSONB DEFAULT '{}'::jsonb 
);

CREATE INDEX idx_rel_from ON entity_relationships(from_id);
CREATE INDEX idx_rel_to ON entity_relationships(to_id);
```

---

### 第三部分：实体属性与 JSONB 键名映射表

当您在 PostgreSQL 中实现这些实体时，API 参数应映射到 `attributes` 字段中：

| 实体类型 (`type`) | 映射到 JSONB 的键名 (`attributes ->> 'key'`)                 | 类型       | 说明               |
| :---------------- | :----------------------------------------------------------- | :--------- | :----------------- |
| **Project**       | `sg_status`, `sg_fps`, `sg_resx`, `sg_resy`, `billboard`, `is_template` | Mixed      | 项目配置与技术参数 |
| **Asset**         | `sg_asset_type`, `tags`, `parents`                           | Mixed      | 资产分类与层级     |
| **Shot**          | `sg_cut_in`, `sg_cut_out`, `sg_sequence`                     | Number/Ref | 剪辑点与场次关联   |
| **Task**          | `start_date`, `due_date`, `duration`, `sg_status_list`       | Mixed      | 排程与工期控制     |
| **Version**       | `sg_uploaded_movie_transcoding_status`, `filmstrip_image`    | Mixed      | 媒体转码与预览     |
| **Note**          | `subject`, `content`, `read_by_current_user`                 | Mixed      | 反馈内容与阅读状态 |
| **WorkDayRule**   | `day_of_week`, `working`, `precedence`                       | Mixed      | 工作历规则         |

---

### 



这是一个里程碑式的发现！通过这段真实的 HTML 源码和 `/crud/requests` 返回的 JSON 数据，我们已经完成了对 Shotgun 系统**从“逻辑黑盒”到“物理细节”的精准捕获**。

这些数据揭示了 Genesis 系统必须复刻的**四大底层核心机制**。我将为您深度解构这些发现，并据此优化我们的《开发任务书》。

---

### 1. 数据交换协议的反推：由“对象数组”改为“行列分离”

**发现：**
在 JSON Response 中，数据不是以 `[{"id": 153, "name": "SMD"}, ...]` 这种常见的 JSON 对象数组返回的，而是：

*   一个 `columns` 数组（列头定义）。
*   一个 `rows` 数组（纯数据矩阵），例如：`[153, "SMD", "https://...", "P001_SMD", ...]`。

**Genesis 架构调整：**

*   **后端优化**：指令解析引擎在执行 `read` 请求时，必须将数据库查询结果进行“脱壳”处理，分离出 `columns` 和 `rows`。
*   **目的**：极大地压缩了高频请求的体积（省去了重复的 Key 名），这是支撑工业级大数据量前端渲染的关键。

### 2. 实体关联的物理结构：由“简单 ID”改为“富引用”

**发现：**
JSON 中 `updated_by` 的返回格式是：
`{"id": 88, "name": "LI YUQING", "status": "act", "type": "HumanUser", "valid": "valid"}`
而在 HTML DOM 中，这个字段被渲染为：
`<a sg_entity_type="HumanUser" sg_entity_id="88" ...>LI YUQING</a>`

**Genesis 架构调整：**

*   **多态关联桶 (Links)**：我们的 `links` JSONB 字段不能只存 ID，必须存储一个**富引用对象**。
*   **读取逻辑**：后端在处理 `read` 指令时，如果遇到关联字段，需要具备“自动 Join”或“缓存提取”能力，以返回包含 `name` 和 `type` 的复合对象，确保前端无需二次查询就能渲染超链接。

### 3. 系统配置的“自举”机制 (Bootstrap Data)

**发现：**
HTML 源码中隐藏了一个巨大的 `<span id="sg_page_4762_bootstrap_data">`。它包含了当前页面的：

*   `filters`（当前的过滤条件，如 `sg_status is Active`）。
*   `column_widths`（用户自定义的列宽）。
*   `pivot_grouping`（分组逻辑）。

**Genesis 架构调整：**

*   **页面配置表**：我们需要增加一张 `page_configs` 表，存储这些复杂的 UI 状态 JSON。
*   **逻辑自举**：当用户访问项目列表时，前端先请求 `page_config`，拿到过滤条件后，再构造 `/crud/requests` 指令向后端要数据。

### 4. 字段命名空间与类型系统

**发现：**
数据中清晰地区分了：

*   **系统字段**：`id`, `name`, `image`, `updated_at`。
*   **业务自定义字段**：`sg_status`, `sg_description`, `sg_fps`, `sg_resx`（全部带 `sg_` 前缀）。
*   **类型系统**：HTML DOM 明确标注了 `data_type="number"`（如 fps）和 `data_type="list"`（如 status）。

**Genesis 架构调整：**

*   **动态 Schema 校验**：后端解析 `create/update` 指令时，必须根据字段的前缀决定存入 `entities` 表的固定列还是存入 `attributes` JSONB 桶。

---



这就是我们一直在寻找的**“最终拼图”**！

这段 Request/Response 数据揭示了 Shotgun 最核心、也是最精妙的**“写-读联动（Write-Read Feedback Loop）”**机制。这直接决定了 Genesis 的后端引擎必须具备高度的**原子性**和**实时日志生成能力**。

让我们深度解剖这次 `update` 操作暴露出的四个核心架构细节：

### 1. 指令链式执行：原子性的联合请求

**发现：**
前端发出的 `Payload` 是一个包含**两个指令**的数组：

1.  第一个指令是 `update`：修改项目 ID 286 的 `sg_status`。
2.  第二个指令是 `read`：立即查询 `EventLogEntry`（审计日志）。

**Genesis 架构实现：**

*   后端解析引擎必须在一个 `POST` 请求内按顺序执行数组里的所有指令。
*   **关键点**：第二个指令带有复杂的 `filters`，它是专门用来获取刚刚那个 `update` 操作产生的日志的。这确保了前端 UI 能立即拿到 `old_value` 和 `new_value` 进行界面刷新。

### 2. 审计日志的“元数据（Meta）”结构

**发现：**
日志的 `meta` 字段非常详尽，不仅记录了谁改了什么，还记录了：

*   `type`: "attribute_change"（属性变更）
*   `old_value`: "Active"
*   `new_value`: "Lost"
*   `field_data_type`: "list"（字段类型）

**Genesis 架构实现：**

*   我们的 `update` 处理器不能只改数据，它必须在执行 `UPDATE` SQL 之前，先 `SELECT` 出旧值。
*   计算出 Diff 后，在同一个数据库事务中，向 `event_logs` 表插入一条标准格式的 JSON 数据。

### 3. Session 隔离与时间戳同步

**发现：**
`read` 日志的过滤条件中包含：

*   `session_uuid`: `25ce63a4...`（确保只拿当前会话产生的变更）。
*   `created_at > "2026-04-03 02:31:02 UTC"`（只拿本次操作之后的日志）。

**Genesis 架构实现：**

*   后端必须能够从 Header 或 Payload 中提取 `session_uuid`，并将其持久化到日志表中。
*   这是一种高明的“乐观 UI”更新策略：前端不依赖于 `update` 返回的成功状态，而是通过追踪 `EventLog` 来确认数据已经落库。

### 4. 复杂的“过滤器解析器（Filter Parser）”

**发现：**
Request 里的 `filters` 结构非常复杂，包含 `logical_operator: "and"`，以及嵌套的条件：

*   `relation: "ends_with"`（对应 SQL 的 `LIKE '%_Change'`）
*   `relation: "greater_than"`（对应 SQL 的 `>`）

---

### 根据这些新发现，更新给 Cursor 的 Step 2 和 Step 4 指令：

请把这段提示语喂给 Cursor，它能让你的 Genesis 系统达到“Shotgun 级”的严密程度：

> **给 Cursor 的核心逻辑修正：**
>
> “Cursor，我们需要实现 Shotgun 的 **Write-Read 联动机制**。请按以下规则重构 API 逻辑：
>
> 1.  **原子执行循环**：`POST /crud/requests` 必须能够顺序处理多个指令。如果是 `update` 后跟着 `read`，确保 `update` 生成的日志能被后续的 `read` 指令查到。
> 2.  **自动计算 Diff**：实现 `update` 处理器时，必须：
>     *   a. 读取数据库中当前的记录。
>     *   b. 记录 `old_value`。
>     *   *c. 执行更新。*
>     *   d. 将 `{old_value: ..., new_value: ..., attribute_name: ..., type: 'attribute_change'}` 写入 `event_logs` 表。
> 3.  **高级过滤器引擎**：实现一个能解析复杂逻辑的解析器。支持以下操作符：
>     *   `is` -> `=`
>     *   `is_not` -> `!=` 或 `IS NOT NULL`
>     *   `greater_than` -> `>`
>     *   `ends_with` -> `LIKE %value`
> 4.  **返回格式一致性**：无论是查询 Project 还是 EventLogEntry，返回格式统一为：`{"columns": [...], "rows": [[...], [...]]}`。”

---

