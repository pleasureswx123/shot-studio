import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { crudRequests } from '../lib/api'

const ASSET_TYPES = ['Character', 'Environment', 'Prop', 'Vehicle', 'FX', 'Matte Painting']
const TASK_STEPS  = ['Rigging', 'Skinning', 'Model', 'Surface', 'Anim', 'Light', 'Comp', 'FX', 'Previz', 'Layout']

interface Props {
  entityType: 'Asset' | 'Shot' | 'Task'
  projectId: number
  queryKey: unknown[]
  onClose: () => void
}

export default function CreateEntityModal({ entityType, projectId, queryKey, onClose }: Props) {
  const [code, setCode] = useState('')
  const [assetType, setAssetType] = useState('Character')
  const [taskStep, setTaskStep] = useState('Anim')
  const queryClient = useQueryClient()

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => {
      const fieldValues: Record<string, unknown> = {
        project: { type: 'Project', id: projectId },
        code,
        sg_status_list: 'wtg',
        ...(entityType === 'Asset' ? { sg_asset_type: assetType } : {}),
        ...(entityType === 'Task' ? { sg_step: taskStep } : {}),
      }
      return crudRequests([{
        request_type: 'create',
        type: entityType,
        field_values: fieldValues,
        columns: ['id', 'code'],
      }])
    },
    onSuccess: () => {
      // 前缀匹配：不管 sorting 状态，只要 queryKey 前三段一致就刷新
      queryClient.invalidateQueries({ queryKey, exact: false })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.trim()) mutate()
  }

  return (
    /* 遮罩层 */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">
            {entityType === 'Asset' ? '新建资产 (Asset)' : entityType === 'Shot' ? '新建镜头 (Shot)' : '新建任务 (Task)'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Code */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {entityType === 'Asset' ? 'Asset Name *' : entityType === 'Shot' ? 'Shot Code *' : 'Task Name *'}
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={entityType === 'Asset' ? 'e.g. hero_char' : entityType === 'Shot' ? 'e.g. SQ010_0030' : 'e.g. Animation'}
              autoFocus
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Asset Type（仅 Asset）*/}
          {entityType === 'Asset' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Asset Type</label>
              <select
                value={assetType}
                onChange={e => setAssetType(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          {/* Pipeline Step（仅 Task）*/}
          {entityType === 'Task' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Pipeline Step</label>
              <select
                value={taskStep}
                onChange={e => setTaskStep(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                {TASK_STEPS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <p className="text-red-400 text-sm">创建失败：{String(error)}</p>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isPending || !code.trim()}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors"
            >
              {isPending ? '创建中…' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
