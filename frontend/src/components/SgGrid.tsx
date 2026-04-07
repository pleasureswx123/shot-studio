import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { readEntities, rowsToObjects } from '../lib/api'
import StatusBadge from './StatusBadge'
import StatusSelect from './StatusSelect'

export interface SgColumnDef {
  key: string
  label: string
  width?: number
  type?: 'text' | 'status' | 'date' | 'number' | 'entity_link'
  editable?: boolean
}

interface SgGridProps {
  entityType: string
  projectId?: number
  columnDefs: SgColumnDef[]
  onRowClick?: (entityId: number) => void
  extraFilters?: Record<string, unknown>[]   // 额外过滤条件（搜索、状态芯片）
}

export default function SgGrid({ entityType, projectId, columnDefs, onRowClick, extraFilters }: SgGridProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const queryFilters = useMemo(() => {
    const conditions: unknown[] = []
    if (projectId) {
      conditions.push({ path: 'project', relation: 'is', values: [{ type: 'Project', id: projectId }] })
    }
    if (extraFilters) conditions.push(...extraFilters)
    return { logical_operator: 'and', conditions }
  }, [projectId, extraFilters])

  const sorts = sorting.length > 0
    ? sorting.map(s => ({ column: s.id, direction: (s.desc ? 'desc' : 'asc') as 'asc' | 'desc' }))
    : [{ column: 'id', direction: 'asc' as const }]

  // extraFilters 序列化进 queryKey，确保搜索/过滤变化时重新请求
  const queryKey = ['sg-grid', entityType, projectId, sorting, extraFilters ?? []]

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => readEntities({
      type: entityType,
      columns: ['id', ...columnDefs.map(c => c.key)],
      filters: queryFilters,
      sorts,
      paging: { current_page: 1, records_per_page: 200 },
      read: ['entities', 'paging_info'],
    }),
  })

  const rows = useMemo(() => (data ? rowsToObjects(data) : []), [data])
  const total = data?.paging_info?.total_count ?? 0

  const columns = useMemo((): ColumnDef<Record<string, unknown>>[] =>
    columnDefs.map(col => ({
      id: col.key,
      accessorKey: col.key,
      header: col.label,
      size: col.width ?? 150,
      cell: ({ getValue, row }) => {
        const value = getValue()
        if (col.type === 'status') {
          const entityId = (row.original as Record<string, unknown>).id as number
          console.log('[SgGrid] status cell | col.editable:', col.editable, '| entityId:', entityId, '| value:', value)
          return col.editable
            ? <StatusSelect status={String(value ?? '')} entityType={entityType} entityId={entityId} queryKey={queryKey} />
            : <StatusBadge status={String(value ?? '')} />
        }
        if (col.type === 'date') {
          return <span className="text-gray-400">{value ? new Date(String(value)).toLocaleDateString('zh-CN') : '—'}</span>
        }
        if (col.type === 'entity_link' && value && typeof value === 'object') {
          return <span className="text-blue-400">{(value as Record<string, string>).name ?? '—'}</span>
        }
        if (col.type === 'number') {
          return <span className="tabular-nums">{value != null ? String(value) : '—'}</span>
        }
        return <span>{value != null ? String(value) : '—'}</span>
      },
    })),
  [columnDefs])

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
        加载中…
      </div>
    )
  }
  if (error) return <div className="text-red-400 p-4">加载失败：{String(error)}</div>

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="flex items-center px-4 py-2 border-b border-gray-800 text-xs text-gray-500 shrink-0">
        <span>{total} 条记录</span>
      </div>

      {/* 表格：overflow-x-auto 支持横向滚动，overflow-y 不裁切，保证下拉菜单可见 */}
      <div className="overflow-x-auto overflow-y-visible flex-1">
        <table className="w-full text-sm border-collapse min-w-max">
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="bg-gray-900 border-b border-gray-700">
                {hg.headers.map(header => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-white whitespace-nowrap border-r border-gray-800 last:border-r-0"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span className="ml-1 text-blue-400">
                        {sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : ''}
                      </span>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-16 text-gray-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  onClick={() => {
                    const entityId = (row.original as Record<string, unknown>).id as number
                    onRowClick?.(entityId)
                  }}
                  className={`border-b border-gray-800/60 hover:bg-gray-800/60 cursor-pointer transition-colors ${i % 2 === 0 ? '' : 'bg-gray-900/20'}`}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-3 py-2 text-gray-300 whitespace-nowrap border-r border-gray-800/40 last:border-r-0">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
