import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import StatusBadge from './StatusBadge'
import { crudRequests } from '../lib/api'

const STATUSES = ['wtg', 'rdy', 'ip', 'rev', 'apr', 'fin', 'na', 'hld', 'omt']

interface Props {
  status: string
  entityType: string
  entityId: number
  queryKey: unknown[]
}

export default function StatusSelect({ status, entityType, entityId, queryKey }: Props) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const queryClient = useQueryClient()
  const open = pos !== null

  // 点击外部关闭
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setPos(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const { mutate, isPending } = useMutation({
    mutationFn: (newStatus: string) =>
      crudRequests([{
        request_type: 'update',
        type: entityType,
        entity_id: entityId,
        field_values: { sg_status_list: newStatus },
      }]),
    onSuccess: (data) => {
      console.log('[StatusSelect] mutation success:', data)
      // 用前缀匹配，确保不管 sorting 是什么都能命中缓存
      queryClient.invalidateQueries({ queryKey: queryKey.slice(0, 3) })
      setPos(null)
    },
    onError: (err) => {
      console.error('[StatusSelect] mutation error:', err)
    },
  })

  const handleClick = () => {
    console.log('[StatusSelect] handleClick fired, open:', open, 'btnRef:', btnRef.current)
    if (open) { setPos(null); return }
    const rect = btnRef.current?.getBoundingClientRect()
    console.log('[StatusSelect] rect:', rect)
    if (rect) setPos({ top: rect.bottom + 4, left: rect.left })
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleClick}
        disabled={isPending}
        className={`transition-opacity ${isPending ? 'opacity-50' : 'hover:opacity-80'}`}
      >
        <StatusBadge status={status} />
      </button>

      {/* 用 portal 渲染到 body，完全脱离 overflow 限制 */}
      {open && pos && createPortal(
        <div
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-gray-800 border border-gray-700 rounded-md shadow-2xl py-1 min-w-36"
          onMouseDown={e => e.stopPropagation()}
        >
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { console.log('[StatusSelect] selecting:', s); mutate(s) }}
              className={`w-full px-3 py-1.5 text-left hover:bg-gray-700 flex items-center gap-2 transition-colors ${s === status ? 'bg-gray-700/50' : ''}`}
            >
              <StatusBadge status={s} />
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}
