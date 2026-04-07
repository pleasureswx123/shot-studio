/**
 * ShotStudio API 客户端
 * 封装对 POST /crud/requests 的调用
 */
import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const http = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
})

// 简单的 CSRF token（开发阶段用固定值）
const CSRF_TOKEN = 'dev-csrf-token'

export interface CrudRequest {
  request_type: 'read' | 'create' | 'update' | 'delete' | 'summarize' | 'group_summarize'
  type: string
  columns?: string[]
  filters?: Record<string, unknown>
  sorts?: Array<{ column: string; direction: 'asc' | 'desc' }>
  paging?: { current_page: number; records_per_page: number }
  grouping?: Array<{ column: string; direction: string; method: string }>
  read?: string[]
  field_values?: Record<string, unknown>
  entity_id?: number
}

export interface CrudResult {
  columns?: string[]
  rows?: unknown[][]
  paging_info?: {
    current_page: number
    records_per_page: number
    total_count: number
    total_pages: number
  }
  error?: { code: string; message: string }
}

export interface CrudResponse {
  results: CrudResult[]
}

/**
 * 发送批量指令到 /crud/requests
 */
export async function crudRequests(
  requests: CrudRequest[],
  sessionUuid?: string,
): Promise<CrudResult[]> {
  // 优先使用传入的 sessionUuid，否则从 store 读取
  const sid = sessionUuid ?? useAuthStore.getState().sessionId ?? undefined
  const params = new URLSearchParams()
  params.append('requests', JSON.stringify(requests))
  params.append('csrf_token', CSRF_TOKEN)
  if (sid) params.append('session_uuid', sid)

  const response = await http.post<CrudResponse>('/crud/requests', params)
  const results = response.data.results

  // 检查每个结果是否包含业务层错误（后端返回 200 但内容含 error）
  for (const r of results) {
    if (r.error) {
      throw new Error(`[${r.error.code}] ${r.error.message}`)
    }
  }

  return results
}

/**
 * 便捷函数：单个 read 请求
 */
export async function readEntities(req: Omit<CrudRequest, 'request_type'>): Promise<CrudResult> {
  const results = await crudRequests([{ request_type: 'read', ...req }])
  return results[0]
}

/**
 * 将行列分离格式转换为对象数组
 * columns: ["id", "code", "sg_status"]
 * rows:    [[153, "SMD", "Active"], ...]
 * →  [{id: 153, code: "SMD", sg_status: "Active"}, ...]
 */
export function rowsToObjects(result: CrudResult): Record<string, unknown>[] {
  const { columns = [], rows = [] } = result
  return rows.map((row) =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  )
}
