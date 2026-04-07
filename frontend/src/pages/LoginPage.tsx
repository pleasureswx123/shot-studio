import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function LoginPage() {
  const [loginVal, setLoginVal] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    try {
      await login(loginVal.trim(), password)
      navigate('/projects', { replace: true })
    } catch {
      // error 已经写进 store 了
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-widest text-white">
            SHOT<span className="text-blue-500">STUDIO</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">影视全流程项目管理</p>
        </div>

        {/* 登录卡片 */}
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-800 rounded-xl px-8 py-8 shadow-2xl space-y-5"
        >
          <h2 className="text-white font-semibold text-lg">登录</h2>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-2.5 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* 用户名 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">用户名 / 邮箱</label>
            <input
              type="text"
              autoComplete="username"
              value={loginVal}
              onChange={e => setLoginVal(e.target.value)}
              placeholder="admin"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5
                         text-white placeholder-gray-600 text-sm
                         focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30
                         transition-colors"
            />
          </div>

          {/* 密码 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">密码</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5
                         text-white placeholder-gray-600 text-sm
                         focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30
                         transition-colors"
            />
          </div>

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed
                       text-white font-medium rounded-lg py-2.5 text-sm
                       transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                登录中…
              </>
            ) : '登录'}
          </button>

          {/* 开发提示 */}
          <p className="text-center text-xs text-gray-600">
            测试账号：admin / admin123 &nbsp;·&nbsp; jane / jane123
          </p>
        </form>
      </div>
    </div>
  )
}
