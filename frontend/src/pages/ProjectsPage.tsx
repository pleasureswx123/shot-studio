import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { readEntities, rowsToObjects } from '../lib/api'

// 状态颜色映射（参考 Shotgun 截图）
const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-500',
  Archived: 'bg-gray-500',
  Lost: 'bg-red-500',
}

const STATUS_LABELS: Record<string, string> = {
  Active: '进行中',
  Archived: '已归档',
  Lost: '已搁置',
}

interface Project {
  id: number
  code: string
  name?: string
  sg_status?: string
  sg_fps?: number
  sg_resx?: number
  sg_resy?: number
  updated_at?: string
}

export default function ProjectsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: () =>
      readEntities({
        type: 'Project',
        columns: ['id', 'code', 'sg_status', 'sg_fps', 'sg_resx', 'sg_resy', 'updated_at'],
        filters: {
          logical_operator: 'and',
          conditions: [],
        },
        sorts: [{ column: 'id', direction: 'asc' }],
        paging: { current_page: 1, records_per_page: 50 },
        read: ['entities', 'paging_info'],
      }),
  })

  const projects = data ? (rowsToObjects(data) as unknown as Project[]) : []
  const total = data?.paging_info?.total_count ?? 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p>加载项目列表…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        <p>加载失败：{String(error)}</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* 页头 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Projects</h1>
          <p className="text-sm text-gray-400 mt-1">{total} 个项目</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors">
          + 新建项目
        </button>
      </div>

      {/* 项目卡片网格 */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-gray-700 rounded-lg text-gray-500">
          <p className="text-lg mb-2">暂无项目</p>
          <p className="text-sm">点击「新建项目」开始</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate()
  const status = project.sg_status ?? 'Active'
  const dotColor = STATUS_COLORS[status] ?? 'bg-gray-500'
  const label = STATUS_LABELS[status] ?? status
  const updatedAt = project.updated_at
    ? new Date(project.updated_at).toLocaleDateString('zh-CN')
    : '—'

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-orange-500/50 transition-colors cursor-pointer group"
    >
      {/* 缩略图占位 */}
      <div className="w-full h-32 bg-gray-800 rounded-md mb-3 flex items-center justify-center text-gray-600 group-hover:bg-gray-750 transition-colors">
        <span className="text-3xl font-bold">{project.code?.slice(0, 2).toUpperCase()}</span>
      </div>

      {/* 项目名 */}
      <h3 className="text-white font-medium text-sm truncate mb-1">{project.code}</h3>

      {/* 状态 + 规格 */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="text-xs text-gray-400">{label}</span>
        {project.sg_fps && (
          <span className="text-xs text-gray-600 ml-auto">{project.sg_fps} fps</span>
        )}
      </div>

      {/* 分辨率 + 更新时间 */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        {project.sg_resx && project.sg_resy ? (
          <span>{project.sg_resx}×{project.sg_resy}</span>
        ) : <span />}
        <span>{updatedAt}</span>
      </div>
    </div>
  )
}
