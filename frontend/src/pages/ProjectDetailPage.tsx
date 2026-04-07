import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { readEntities, rowsToObjects } from '../lib/api'
import SgGrid, { type SgColumnDef } from '../components/SgGrid'
import StatusBadge from '../components/StatusBadge'
import GridToolbar from '../components/GridToolbar'
import CreateEntityModal from '../components/CreateEntityModal'

/** 简单防抖 hook */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    timer.current = setTimeout(() => setDebounced(value), delay)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [value, delay])
  return debounced
}

// 各实体类型的列定义
const ASSET_COLUMNS: SgColumnDef[] = [
  { key: 'code',           label: 'Asset Name',  width: 220 },
  { key: 'sg_asset_type',  label: 'Type',        width: 120 },
  { key: 'sg_status_list', label: 'Status',      width: 130, type: 'status', editable: true },
  { key: 'updated_at',     label: 'Updated',     width: 150, type: 'date' },
]

const SHOT_COLUMNS: SgColumnDef[] = [
  { key: 'code',             label: 'Shot Name',    width: 220 },
  { key: 'sg_sequence',      label: 'Sequence',     width: 130, type: 'entity_link' },
  { key: 'sg_status_list',   label: 'Status',       width: 130, type: 'status', editable: true },
  { key: 'sg_cut_duration',  label: 'Cut Duration', width: 120, type: 'number' },
  { key: 'sg_cut_in',        label: 'Cut In',       width: 100, type: 'number' },
  { key: 'sg_cut_out',       label: 'Cut Out',      width: 100, type: 'number' },
  { key: 'updated_at',       label: 'Updated',      width: 150, type: 'date' },
]

const TASK_COLUMNS: SgColumnDef[] = [
  { key: 'code',           label: 'Task Name',  width: 200 },
  { key: 'sg_step',        label: 'Step',       width: 120 },
  { key: 'sg_status_list', label: 'Status',     width: 130, type: 'status', editable: true },
  { key: 'entity',         label: 'Link',       width: 180, type: 'entity_link' },
  { key: 'due_date',       label: 'Due Date',   width: 130, type: 'date' },
  { key: 'updated_at',     label: 'Updated',    width: 150, type: 'date' },
]

const TABS = [
  { key: 'assets', label: 'Assets',   entityType: 'Asset',    columns: ASSET_COLUMNS },
  { key: 'shots',  label: 'Shots',    entityType: 'Shot',     columns: SHOT_COLUMNS  },
  { key: 'tasks',  label: 'Tasks',    entityType: 'Task',     columns: TASK_COLUMNS  },
]

interface Project {
  id: number
  code: string
  sg_status?: string
  sg_fps?: number
  sg_resx?: number
  sg_resy?: number
}

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const pid = Number(projectId)
  const navigate = useNavigate()
  const [activeTab, setActiveTab]           = useState('assets')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [search, setSearch]                 = useState('')
  const [statusFilter, setStatusFilter]     = useState('')
  const debouncedSearch = useDebounce(search, 300)

  // 切换 Tab 时清空搜索和状态过滤
  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setSearch('')
    setStatusFilter('')
    setShowCreateModal(false)
  }

  // 构造 extraFilters 传给 SgGrid
  const extraFilters = useMemo(() => {
    const conds: Record<string, unknown>[] = []
    if (debouncedSearch.trim()) {
      conds.push({ path: 'code', relation: 'contains', values: [debouncedSearch.trim()] })
    }
    if (statusFilter) {
      conds.push({ path: 'sg_status_list', relation: 'is', values: [statusFilter] })
    }
    return conds.length > 0 ? conds : undefined
  }, [debouncedSearch, statusFilter])

  // 加载项目基本信息
  const { data: projectData } = useQuery({
    queryKey: ['project', pid],
    queryFn: () => readEntities({
      type: 'Project',
      columns: ['id', 'code', 'sg_status', 'sg_fps', 'sg_resx', 'sg_resy'],
      filters: {
        logical_operator: 'and',
        conditions: [{ path: 'id', relation: 'is', values: [pid] }],
      },
      paging: { current_page: 1, records_per_page: 1 },
    }),
    enabled: !!pid,
  })

  const projects = projectData ? (rowsToObjects(projectData) as unknown as Project[]) : []
  const project = projects[0]

  // Task 进度统计（全量，不受当前过滤影响）
  const { data: taskStatsData } = useQuery({
    queryKey: ['task-stats', pid],
    queryFn: () => readEntities({
      type: 'Task',
      columns: ['id', 'sg_status_list'],
      filters: { logical_operator: 'and', conditions: [
        { path: 'project', relation: 'is', values: [{ type: 'Project', id: pid }] }
      ]},
      paging: { current_page: 1, records_per_page: 500 },
    }),
    enabled: !!pid,
  })

  const taskStats = useMemo(() => {
    if (!taskStatsData) return null
    const tasks = rowsToObjects(taskStatsData) as Record<string, unknown>[]
    const total = tasks.length
    const done  = tasks.filter(t => t.sg_status_list === 'apr' || t.sg_status_list === 'fin').length
    const ip    = tasks.filter(t => t.sg_status_list === 'ip').length
    const pct   = total > 0 ? Math.round((done / total) * 100) : 0
    return { total, done, ip, pct }
  }, [taskStatsData])

  const currentTab = TABS.find(t => t.key === activeTab) ?? TABS[0]

  return (
    <div className="flex flex-col h-full">
      {/* 面包屑 + 项目信息 */}
      <div className="px-6 py-3 border-b border-gray-800 bg-gray-900/50 shrink-0">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
          <Link to="/projects" className="hover:text-white transition-colors">Projects</Link>
          <span>/</span>
          <span className="text-white font-medium">{project?.code ?? '…'}</span>
        </div>
        <div className="flex items-center gap-3">
          {project?.sg_status && <StatusBadge status={project.sg_status} />}
          {project?.sg_fps && (
            <span className="text-xs text-gray-500">{project.sg_fps} fps</span>
          )}
          {project?.sg_resx && project?.sg_resy && (
            <span className="text-xs text-gray-500">{project.sg_resx} × {project.sg_resy}</span>
          )}
        </div>
      </div>

      {/* Task 进度统计条 */}
      {taskStats && taskStats.total > 0 && (
        <div className="px-6 py-2 border-b border-gray-800/60 bg-gray-900/20 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-16 shrink-0">Tasks</span>
            {/* 进度条 */}
            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 rounded-full transition-all duration-500"
                style={{ width: `${taskStats.pct}%` }}
              />
            </div>
            {/* 数字 */}
            <div className="flex items-center gap-3 text-xs shrink-0">
              <span className="text-green-400">{taskStats.done} 完成</span>
              <span className="text-orange-400">{taskStats.ip} 进行中</span>
              <span className="text-gray-500">{taskStats.total} 总计</span>
              <span className="text-gray-400 font-semibold">{taskStats.pct}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 切换栏 + 新建按钮 */}
      <div className="flex items-center border-b border-gray-800 bg-gray-900/30 shrink-0">
        <div className="flex gap-0 flex-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-orange-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="mr-4 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          + 新建
        </button>
      </div>

      {/* 工具栏：搜索 + 状态过滤 */}
      <GridToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* 网格内容区 */}
      <div className="flex-1 overflow-hidden">
        <SgGrid
          key={`${pid}-${currentTab.entityType}`}
          entityType={currentTab.entityType}
          projectId={pid}
          columnDefs={currentTab.columns}
          extraFilters={extraFilters}
          onRowClick={(entityId) =>
            navigate(`/projects/${pid}/${currentTab.entityType.toLowerCase()}/${entityId}`)
          }
        />
      </div>

      {/* 新建弹窗 */}
      {showCreateModal && (
        <CreateEntityModal
          entityType={currentTab.entityType as 'Asset' | 'Shot' | 'Task'}
          projectId={pid}
          queryKey={['sg-grid', currentTab.entityType, pid]}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  )
}
