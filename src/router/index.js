import { createRouter, createWebHistory } from 'vue-router'
import axios from 'axios'
import LoginView from '@/views/LoginView.vue'
import SignUpView from '@/views/SignUpView.vue'
import TodoListView from '@/views/TodoListView.vue'

const routes = [
  { path: '/', component: LoginView },
  { path: '/signup', component: SignUpView },
  { path: '/todolist', component: TodoListView, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 小工具：解析 JWT 取得 payload（含 exp）
function parseJwt (token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

router.beforeEach((to, from, next) => {
  if (!to.meta.requiresAuth) return next()

  const token = localStorage.getItem('hexToken')
  if (!token) {
    return next({ path: '/' }) // 沒 token 直接回登入
  }

  // 檢查是否過期（exp 是秒）
  const payload = parseJwt(token)
  const now = Date.now()
  const isExpired = !payload?.exp || payload.exp * 1000 <= now
  if (isExpired) {
    localStorage.removeItem('hexToken')
    delete axios.defaults.headers.common['Authorization']
    return next({ path: '/' })
  }

  // 設定預設授權標頭（進到受保護頁面時）
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  return next()
})

export default router
