import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { readEntities, crudRequests, rowsToObjects } from '../lib/api'
import StatusSelect from '../components/StatusSelect'
import StatusBadge from '../components/StatusBadge'

// 每种实体类型的字段配置
const ENTITY_FIELDS: Record<string, { key: string; label: string; type?: string }[]> = {
  asset: [
    { key: 'code',           label: 'Asset Name',  type: 'text' },
    { key: 'sg_asset_type',  label: 'Asset Type',  type: 'text' },
    { key: 'sg_status_list', label: 'Status',      type: 'status' },
    { key: 'sg_description', label: 'Description', type: 'text' },
    { key: 'updated_at',     label: 'Updated',     type: 'readonly' },
    { key: 'created_at',     label: 'Created',     type: 'readonly' },
  ],
  shot: [
    { key: 'code',            label: 'Shot Code',     type: 'text' },
    { key: 'sg_status_list',  label: 'Status',        type: 'status' },
    { key: 'sg_cut_in',       label: 'Cut In',        type: 'text' },
    { key: 'sg_cut_out',      label: 'Cut Out',       type: 'text' },
    { key: 'sg_cut_duration', label: 'Cut Duration',  type: 'text' },
    { key: 'updated_at',      label: 'Updated',       type: 'readonly' },
    { key: 'created_at',      label: 'Created',       type: 'readonly' },
  ],
  task: [
    { key: 'code',           label: 'Task Name',  type: 'text' },
    { key: 'sg_step',        label: 'Step',       type: 'text' },
    { key: 'sg_status_list', label: 'Status',     type: 'status' },
    { key: 'due_date',       label: 'Due Date',   type: 'text' },
    { key: 'updated_at',     label: 'Updated',    type: 'readonly' },
    { key: 'created_at',     label: 'Created',    type: 'readonly' },
  ],
}

// 实体类型 → 显示名
const ENTITY_LABEL: Record<string, string> = {
  asset: 'Asset', shot: 'Shot', task: 'Task',
}

// ──────────────────────────────────────────────────────
// FieldRow：行内可编辑字段行
// ──────────────────────────────────────────────────────
interface FieldRowProps {
  fieldKey: string
  label: string
  type: string
  value: unknown
  entityType: string
  entityId: number
  queryKey: unknown[]
  onSave: (val: unknown) => void
}

function FieldRow({ fieldKey, label, type, value, entityType, entityId, queryKey, onSave }: FieldRowProps) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState('')

  const displayValue = value == null || value === '' ? '—' : String(value)

  const startEdit = () => {
    if (type === 'readonly' || type === 'status') return
    setDraft(value == null ? '' : String(value))
    setEditing(true)
  }

  const commit = () => {
    setEditing(false)
    if (draft !== String(value ?? '')) onSave(draft)
  }

  if (type === 'status') {
    return (
      <div className="flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-gray-800/40 group">
        <span className="w-36 text-sm text-gray-400 shrink-0">{label}</span>
        <StatusSelect
          status={String(value ?? '')}
          entityType={entityType}
          entityId={entityId}
          queryKey={queryKey}
        />
      </div>
    )
  }

  if (type === 'readonly') {
    return (
      <div className="flex items-center gap-4 px-3 py-2.5 rounded-lg">
        <span className="w-36 text-sm text-gray-400 shrink-0">{label}</span>
        <span className="text-sm text-gray-500">{formatDate(value)}</span>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-gray-800/40 cursor-text group"
      onClick={startEdit}
    >
      <span className="w-36 text-sm text-gray-400 shrink-0">{label}</span>
      {editing ? (
        <input
          autoFocus
          className="flex-1 bg-gray-700 border border-blue-500 rounded px-2 py-1 text-sm text-white outline-none"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span className={`text-sm flex-1 ${value == null || value === '' ? 'text-gray-600 italic' : 'text-white'}`}>
          {displayValue}
          <span className="ml-2 opacity-0 group-hover:opacity-100 text-gray-600 text-xs">✎</span>
        </span>
      )}
    </div>
  )
}

function formatDate(v: unknown) {
  if (!v) return '—'
  try { return new Date(String(v)).toLocaleString('zh-CN') } catch { return String(v) }
}

export default function EntityDetailPage() {
  const { projectId, entityType, entityId } = useParams<{
    projectId: string; entityType: string; entityId: string
  }>()
  const pid   = Number(projectId)
  const eid   = Number(entityId)
  const eType = entityType?.toLowerCase() ?? 'asset'
  const apiType = ENTITY_LABEL[eType] ?? 'Asset'

  const fields = ENTITY_FIELDS[eType] ?? ENTITY_FIELDS.asset
  const allKeys = ['id', 'code', 'entity', 'sg_sequence', ...fields.map(f => f.key)]

  const queryClient = useQueryClient()
  const entityQK = ['entity-detail', eType, eid]

  // 加载实体
  const { data: entityData, isLoading } = useQuery({
    queryKey: entityQK,
    queryFn: () => readEntities({
      type: apiType,
      columns: [...new Set(allKeys)],
      filters: { logical_operator: 'and', conditions: [{ path: 'id', relation: 'is', values: [eid] }] },
      paging: { current_page: 1, records_per_page: 1 },
    }),
    enabled: !!eid,
  })

  const entity = entityData ? (rowsToObjects(entityData)[0] ?? null) : null

  // 关联 Tasks（Asset/Shot 显示）
  const showTasks = eType === 'asset' || eType === 'shot'
  const tasksQK = ['entity-tasks', eType, eid]
  const { data: tasksData } = useQuery({
    queryKey: tasksQK,
    queryFn: () => readEntities({
      type: 'Task',
      columns: ['id', 'code', 'sg_step', 'sg_status_list', 'entity'],
      filters: { logical_operator: 'and', conditions: [
        { path: 'project', relation: 'is', values: [{ type: 'Project', id: pid }] }
      ]},
      paging: { current_page: 1, records_per_page: 200 },
    }),
    enabled: showTasks,
    select: (data) => {
      // 在 Python 侧按 entity.id 过滤（后端暂不支持 links 字段过滤）
      const all = rowsToObjects(data) as Record<string, unknown>[]
      return all   // 先返回全部，组件内再按 entity.id 过滤
    },
  })

  // entity 字段 update mutation
  const { mutate: saveField } = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      crudRequests([{
        request_type: 'update',
        type: apiType,
        entity_id: eid,
        field_values: { [key]: value },
      }]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: entityQK }),
  })

  // 关联 tasks 过滤（entity.id === eid）
  const relatedTasks = (tasksData ?? []).filter((t) => {
    const ent = t.entity as { id?: number } | undefined
    return ent?.id === eid
  })

  // 面包屑上级的 tab
  const tabMap: Record<string, string> = { asset: 'assets', shot: 'shots', task: 'tasks' }
  const parentTab = tabMap[eType] ?? 'assets'

  if (isLoading) return (
    <div className="flex items-center justify-center h-full text-gray-400">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />加载中…
    </div>
  )
  if (!entity) return <div className="p-8 text-red-400">实体不存在</div>

  const entityName = String(entity.code ?? eid)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 面包屑 */}
      <div className="px-6 py-3 border-b border-gray-800 bg-gray-900/50 shrink-0 flex items-center gap-2 text-sm text-gray-400">
        <Link to="/projects" className="hover:text-white">Projects</Link>
        <span>/</span>
        <Link to={`/projects/${pid}?tab=${parentTab}`} onClick={e => { e.preventDefault(); history.back() }} className="hover:text-white">
          {apiType}s
        </Link>
        <span>/</span>
        <span className="text-white font-medium">{entityName}</span>
      </div>

      {/* 内容区：左字段 + 右关联 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧：字段面板 */}
        <div className="flex-1 overflow-y-auto p-6 border-r border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-6">{entityName}</h2>
          <div className="space-y-1">
            {fields.map(f => (
              <FieldRow
                key={f.key}
                fieldKey={f.key}
                label={f.label}
                type={f.type ?? 'text'}
                value={entity[f.key]}
                entityType={apiType}
                entityId={eid}
                queryKey={entityQK}
                onSave={(val) => saveField({ key: f.key, value: val })}
              />
            ))}
          </div>
        </div>

        {/* 右侧：关联 Tasks */}
        {showTasks && (
          <div className="w-72 shrink-0 overflow-y-auto p-4 bg-gray-900/30">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Tasks ({relatedTasks.length})
            </h3>
            {relatedTasks.length === 0 ? (
              <p className="text-gray-500 text-sm">无关联任务</p>
            ) : (
              <div className="space-y-2">
                {relatedTasks.map(t => (
                  <div key={String(t.id)} className="bg-gray-800/60 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-white font-medium">{String(t.code ?? '')}</p>
                      <p className="text-xs text-gray-500">{String(t.sg_step ?? '')}</p>
                    </div>
                    <StatusBadge status={String(t.sg_status_list ?? '')} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
