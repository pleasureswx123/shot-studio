import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { ReactNode } from 'react'
import logo from './assets/logo.svg'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import EntityDetailPage from './pages/EntityDetailPage'
import LoginPage from './pages/LoginPage'
import { useAuthStore } from './stores/authStore'

/** 路由守卫：未登录跳转 /login */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const sessionId = useAuthStore(s => s.sessionId)
  if (!sessionId) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  const { user, logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* 顶部导航栏（登录时才显示） */}
      {user && (
        <header className="h-12 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-4 shrink-0">
          <Link to="/projects" className="flex items-center hover:opacity-80 transition-opacity">
            <img src={logo} alt="ShotStudio" className="h-10" />
          </Link>
          <nav className="flex gap-1 ml-4">
            <Link to="/projects" className="px-3 py-1 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors">
              Projects
            </Link>
          </nav>
          {/* 右侧用户区 */}
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-300">{user.name}</span>
            </div>
            <button
              onClick={logout}
              className="text-xs text-gray-500 hover:text-gray-200 px-2 py-1 rounded hover:bg-gray-800 transition-colors"
            >
              登出
            </button>
          </div>
        </header>
      )}

      {/* 主内容区 */}
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
          <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
          <Route path="/projects/:projectId/:entityType/:entityId" element={<ProtectedRoute><EntityDetailPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
