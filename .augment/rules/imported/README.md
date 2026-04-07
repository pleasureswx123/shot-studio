---
type: "always_apply"
---

# 参考资料说明文档

## 项目目标

本项目 **ShotStudio** 的目标是复刻 **Autodesk Shotgun**（现名 Flow Production Tracking）的核心功能，构建一套工业级影视全流程项目管理系统。

---

## 参考资料目录结构

```
reference-materials/
├── README.md                  ← 本文件
├── crawl.py                   ← HTML 爬取脚本
├── crawl_json.py              ← API 数据抓取脚本
├── shotgun_html_pages/        ← 爬取的 HTML 页面（~120 个文件）
├── shotgun_json_data/         ← 抓取的 API 请求/响应数据（~11,000 个文件）
├── shotgun_screenshot/        ← 手动截图（40 张）
├── scratch-ideas.md           ← AI 生成的头脑风暴与零碎想法
├── requirements.md            ← AI 生成的需求规格文档
└── design.md                  ← AI 生成的系统设计文档
```

---

## 各资料来源与说明

### 1. `shotgun_html_pages/` — 真实系统 HTML 页面

**来源**：由 `crawl.py` 脚本自动爬取生成。

**爬取方式**：
- 脚本通过 Playwright 以 CDP 协议连接到一个已登录 Shotgun 的本地 Chrome 浏览器（`http://localhost:9222`），借助真实会话绕过认证。
- 目标站点：`https://beicunyihuivfx.shotgunstudio.com`（一个真实运营中的 Shotgun 实例）。
- **爬取策略**：
  - 白名单中的关键 URL 无条件保存（项目列表、媒体中心等）。
  - `/page/*` 类型页面无数量限制，全部保存。
  - 实体详情页（Shot、Asset、Task 等）每种类型最多保存 3 个，避免数据冗余。

**内容概览**（约 120 个 HTML 文件）：
- `projects.html` — 项目列表页
- `detail_Project_*.html` — 项目详情页（含 bootstrap_data 配置）
- `detail_Asset_*.html` / `detail_Shot_*.html` / `detail_Task_*.html` — 实体详情页
- `detail_Version_*.html` / `detail_Note_*.html` — 版本和备注详情页
- `page_project_default_entity_type_*_project_id_*.html` — 各项目下的资产、镜头、任务列表页
- `page_media_center_*.html` — 媒体审阅中心页面
- `page_project_overview_*.html` — 项目概览页（含活动流、小组件）

**Agent 使用建议**：
- 这些 HTML 是**最权威的 UI 真实参考**，包含 Shotgun 的实际 DOM 结构、字段命名、布局逻辑。
- 特别注意页面中的 `<span id="sg_page_*_bootstrap_data">` 元素，其中包含页面的过滤器、列宽、分组等配置 JSON，是理解"页面自举机制"的关键。
- HTML 中的 CSS 类名和 `sg_entity_type`、`sg_entity_id` 等 DOM 属性揭示了前端与实体的绑定方式。

---

### 2. `shotgun_json_data/` — 真实 API 请求与响应数据

**来源**：由 `crawl_json.py` 脚本自动抓取生成。

**抓取方式**：
- 同样通过 Playwright CDP 连接已登录的 Chrome 浏览器。
- 脚本监听所有网络请求，**拦截目标站点中所有 `/crud/requests` 接口**的 HTTP 请求和响应。
- 每次拦截将请求体（`request_body`）和响应数据（`response_data`）合并存储为一个 JSON 文件。
- 文件命名格式：`crud_requests_{timestamp}_{序号}.json`

**内容规模**：约 **11,007 个 JSON 文件**，覆盖了用户在 Shotgun 中浏览各个页面时产生的所有 API 交互。

**单个文件结构**：
```json
{
  "url": "https://.../crud/requests",
  "request_body": { "requests": [...], "csrf_token": "...", "session_uuid": "..." },
  "response_data": { "results": [{ "columns": [...], "rows": [[...]] }] }
}
```

**Agent 使用建议**：
- 这是**最核心的参考资料**。`/crud/requests` 是 Shotgun 的唯一数据总线接口，通过分析这些文件可以精确还原：
  - 各页面的查询指令结构（`request_type`、`type`、`filters`、`columns`、`grouping`）
  - 真实的数据返回格式（行列分离：`columns` + `rows` 矩阵）
  - 关联字段的富引用格式（`{"id": 88, "type": "HumanUser", "name": "LI YUQING"}`）
  - `update` 指令后紧跟 `read EventLogEntry` 的"写-读联动"模式
- 分析时可按页面类型批量检索，如筛选包含 `"type": "Asset"` 的请求。

---

### 3. `shotgun_screenshot/` — 手动截图

**来源**：使用 **Snipaste** 截图工具，于 **2026-04-01** 手动截取。共 **40 张** PNG 截图。

**内容**：覆盖 Shotgun 界面的各主要模块，包括项目列表、资产网格、镜头列表、任务管理、媒体审阅中心、详情页等。

**Agent 使用建议**：
- 这是**最直观的 UI 视觉参考**，用于还原界面的视觉设计语言、布局结构、色彩方案和交互组件样式。
- 状态色块颜色（灰色=待开始、橘色=进行中、红色=打回、绿色=完成）等视觉细节以截图为准。

---

### 4. `scratch-ideas.md` — 头脑风暴与零碎想法

**来源**：由 AI 工具辅助生成，内容经过多轮对话提炼，**准确性未经人工验证**。

**内容**：包含 PRD（产品需求）、TDD（技术方案）、API 接口说明、数据库设计思路等多个层次的零碎想法。

**Agent 使用建议**：
- 可作为**概念性参考**，帮助理解系统整体思路和设计意图。
- **重要警告**：部分内容可能与真实 Shotgun 行为存在偏差。当与 `shotgun_html_pages` 或 `shotgun_json_data` 中的真实数据冲突时，**以真实数据为准**。

---

### 5. `requirements.md` — 需求规格文档

**来源**：由 AI 工具基于 `scratch-ideas.md` 整理生成，格式规范，**准确性未经人工验证**。

**内容**：包含 18 个用户故事（User Story）形式的功能需求，覆盖 API 网关、指令引擎、数据模型、各业务模块、RBAC、媒体流水线等。

**Agent 使用建议**：
- 可作为**功能范围的参考清单**，理解系统需要实现哪些能力。
- 同样需结合真实抓取数据进行核实，不可盲目照搬。

---

### 6. `design.md` — 系统设计文档

**来源**：由 AI 工具生成，**准确性未经人工验证**。

**内容**：包含系统架构图（Mermaid）、各组件接口定义（Python 代码签名）、完整数据库 DDL（entities/event_logs/entity_relationships/field_definitions/page_configs 五张表）、23 条正确性属性（Correctness Properties）、测试策略。

**Agent 使用建议**：
- 这是**最具可操作性的实现参考**，数据库表结构设计和组件接口签名可直接参考。
- 架构设计（FastAPI + PostgreSQL JSONB + Celery + Redis + MinIO）经过合理性验证，可信度较高。
- 正确性属性（Property 1~23）可作为测试用例的设计依据。

---

## 资料优先级与可信度排序

| 资料 | 来源 | 可信度 | 主要用途 |
|---|---|---|---|
| `shotgun_json_data/` | 真实 API 抓取 | ⭐⭐⭐⭐⭐ 最高 | API 协议、数据结构、返回格式 |
| `shotgun_html_pages/` | 真实页面爬取 | ⭐⭐⭐⭐⭐ 最高 | UI 结构、DOM 属性、页面配置 |
| `shotgun_screenshot/` | 手动截图 | ⭐⭐⭐⭐ 高 | UI 视觉设计、色彩、布局 |
| `design.md` | AI 生成 | ⭐⭐⭐ 中 | 实现方案、数据库设计、架构 |
| `requirements.md` | AI 生成 | ⭐⭐⭐ 中 | 功能范围参考 |
| `scratch-ideas.md` | AI 生成 | ⭐⭐ 低 | 概念理解、设计灵感 |

**核心原则：真实抓取数据 > AI 生成文档。遇到矛盾时，以 `shotgun_json_data` 和 `shotgun_html_pages` 为最终依据。**
