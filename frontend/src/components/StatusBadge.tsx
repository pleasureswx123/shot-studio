// Shotgun 状态码 → 中文标签 + 颜色
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  // Shot / Asset 状态
  wtg: { label: '等待开始', cls: 'bg-gray-600 text-gray-200' },
  rdy: { label: '就绪',     cls: 'bg-blue-600 text-blue-100' },
  ip:  { label: '进行中',   cls: 'bg-orange-500 text-white' },
  rev: { label: '待审核',   cls: 'bg-yellow-500 text-gray-900' },
  apr: { label: '已通过',   cls: 'bg-green-600 text-green-100' },
  fin: { label: '最终版',   cls: 'bg-green-700 text-green-100' },
  na:  { label: 'N/A',      cls: 'bg-gray-700 text-gray-400' },
  hld: { label: '暂停',     cls: 'bg-purple-600 text-purple-100' },
  omt: { label: '省略',     cls: 'bg-red-800 text-red-200' },
  // Project 状态
  Active:   { label: '进行中', cls: 'bg-green-600 text-green-100' },
  Archived: { label: '已归档', cls: 'bg-gray-600 text-gray-200' },
  Lost:     { label: '已搁置', cls: 'bg-red-700 text-red-200' },
}

interface Props {
  status: string
}

export default function StatusBadge({ status }: Props) {
  const config = STATUS_MAP[status] ?? { label: status, cls: 'bg-gray-700 text-gray-300' }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${config.cls}`}>
      {config.label}
    </span>
  )
}
