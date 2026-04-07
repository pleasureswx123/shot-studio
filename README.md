# ShotStudio

> 影视全流程项目管理系统，复刻 Autodesk Shotgun（Flow Production Tracking）核心功能。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-green.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg)

---

## 功能特性

- **统一数据总线** — 单一端点 `POST /crud/requests` 支持批量指令（read / create / update / delete）
- **动态字段扩展** — PostgreSQL JSONB 存储实体属性，无需频繁变更 Schema
- **实体管理** — 支持 Project、Asset、Shot、Task、Version、Note 等标准影视实体
- **高性能网格** — 前端虚拟化表格，流畅渲染大规模数据
- **状态流转** — 内置 Pipeline Status 状态机，支持审批流程
- **媒体存储** — MinIO / S3 兼容对象存储，用于版本文件与缩略图

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite + TanStack Table + Tailwind CSS |
| 后端 | FastAPI + SQLAlchemy (async) + Pydantic |
| 数据库 | PostgreSQL 16（JSONB 实体存储） |
| 缓存/队列 | Redis 7 |
| 对象存储 | MinIO（S3 兼容） |
| 异步任务 | Celery |
| 容器化 | Docker + Docker Compose |

---

## 快速启动

### 前置要求

- Docker & Docker Compose
- Node.js 20+（本地前端开发）
- Python 3.11+（本地后端开发）

### 使用 Docker Compose 一键启动

```bash
git clone https://github.com/pleasureswx123/shot-studio.git
cd shot-studio
docker compose up -d
```

启动后访问：

| 服务 | 地址 |
|------|------|
| 前端界面 | http://localhost:5173 |
| 后端 API | http://localhost:8000 |
| API 文档 | http://localhost:8000/api/docs |
| MinIO 控制台 | http://localhost:9001 |

### 本地开发

**后端：**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**前端：**

```bash
cd frontend
npm install
npm run dev
```

---

## 项目结构

```
shot-studio/
├── backend/
│   ├── app/
│   │   ├── api/          # 路由层（auth、crud_requests）
│   │   ├── core/         # 配置、数据库连接
│   │   └── engine/       # 指令引擎（read/create/update/delete handler）
│   ├── migrations/       # SQL 初始化脚本
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # 通用组件（SgGrid、StatusBadge 等）
│   │   ├── pages/        # 页面（Projects、ProjectDetail、EntityDetail）
│   │   ├── stores/       # Zustand 状态管理
│   │   └── lib/          # API 客户端
│   └── package.json
├── docker-compose.yml
└── reference-materials/  # 系统设计文档与需求规格
```

---

## API 协议

所有数据操作通过单一端点完成：

```
POST /crud/requests
```

请求体示例（查询 Shot 列表）：

```json
{
  "requests": [
    {
      "request_type": "read",
      "type": "Shot",
      "filters": [["project.Project.id", "is", 1]],
      "columns": ["code", "sg_status_list", "description"],
      "paging": { "current_page": 1, "entities_per_page": 50 }
    }
  ]
}
```

---

## License

[MIT](LICENSE)
