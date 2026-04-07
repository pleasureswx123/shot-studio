interface StatusChip {
  value: string
  label: string
  dot: string   // tailwind dot color class
  ring: string  // active ring class
}

const CHIPS: StatusChip[] = [
  { value: '',    label: '全部',   dot: 'bg-gray-500',   ring: 'ring-gray-500' },
  { value: 'wtg', label: '等待',   dot: 'bg-gray-400',   ring: 'ring-gray-400' },
  { value: 'ip',  label: '进行中', dot: 'bg-orange-500', ring: 'ring-orange-500' },
  { value: 'rev', label: '待审核', dot: 'bg-yellow-500', ring: 'ring-yellow-500' },
  { value: 'apr', label: '已通过', dot: 'bg-green-500',  ring: 'ring-green-500' },
  { value: 'fin', label: '最终版', dot: 'bg-green-700',  ring: 'ring-green-700' },
  { value: 'hld', label: '暂停',   dot: 'bg-purple-500', ring: 'ring-purple-500' },
]

interface Props {
  search: string
  onSearchChange: (v: string) => void
  statusFilter: string
  onStatusFilterChange: (v: string) => void
}

export default function GridToolbar({ search, onSearchChange, statusFilter, onStatusFilterChange }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-800 bg-gray-900/30 shrink-0">
      {/* 搜索框 */}
      <div className="relative">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="搜索名称…"
          className="pl-8 pr-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-md
                     text-gray-200 placeholder-gray-600 w-44
                     focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30
                     transition-colors"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
          >✕</button>
        )}
      </div>

      {/* 分隔线 */}
      <div className="h-4 w-px bg-gray-700" />

      {/* 状态筛选芯片 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {CHIPS.map(chip => {
          const active = chip.value === statusFilter
          return (
            <button
              key={chip.value}
              onClick={() => onStatusFilterChange(chip.value)}
              className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                border transition-all
                ${active
                  ? `bg-gray-700 border-gray-500 text-white ring-1 ${chip.ring}`
                  : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                }
              `}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${chip.dot}`} />
              {chip.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
