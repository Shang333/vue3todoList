<template>
    <!-- ToDo List -->
    <div id="todoListPage" class="bg-half">
        <nav>
            <h1><a href="#">ONLINE TODO LIST</a></h1>
            <ul>
            <li class="todo_sm"><a href="#"><span>王小明的代辦</span></a></li>
            <li><a href="#" @click.prevent="logout">登出</a></li>
            </ul>
        </nav>
        <div class="container todoListPage vhContainer">
            <div class="todoList_Content">
            <div class="inputBox">
                <input type="text" placeholder="請輸入待辦事項" v-model="newTodo" @keyup.enter="addTodo">
                <a href="#">
                <i class="fa fa-plus"></i>
                </a>
            </div>
            <div class="todoList_list">
                <ul class="todoList_tab">
                <li><a href="#" :class="{ active: activeTab === 'all' }" @click.prevent="activeTab = 'all'">全部</a></li>
                <li><a href="#" :class="{ active: activeTab === 'active' }" @click.prevent="activeTab = 'active'">待完成</a></li>
                <li><a href="#" :class="{ active: activeTab === 'completed' }" @click.prevent="activeTab = 'completed'">已完成</a></li>
                </ul>
                <div class="todoList_items">
                    <!-- ★ 新增：空清單提示（避免載入中或錯誤時誤顯示） -->
                  <p
                    v-if="hasNoTodos"  
                    class="todoList_empty"
                    style="margin:16px 0; color:#666;"
                  >目前尚無待辦事項</p>
                    <ul class="todoList_item" v-else>
                        <li v-for="todo in filteredTodos" :key="todo.id">
                            <label class="todoList_label">
                            <input
                                class="todoList_input"
                                type="checkbox"
                                :checked="todo.completed"
                                @change="toggleTodo(todo)"
                            />
                            <span :style="{ textDecoration: todo.completed ? 'line-through' : 'none', opacity: todo.completed ? 0.6 : 1 }">
                                {{ todo.content }}
                            </span>
                            </label>
                            <a href="#" @click.prevent="removeTodo(todo.id)">
                            <i class="fa fa-times"></i>
                            </a>
                        </li>
                    </ul>

                    <div class="todoList_statistics">
                        <p>{{ completedCount }} 個已完成項目，{{ remainingCount }} 個待完成</p>
                        <a href="#" @click.prevent="clearCompleted" v-if="completedCount > 0">清除已完成</a>
                    </div>
                    <p v-if="loading" style="margin-top:8px;">載入中...</p>
                    <p v-if="errMsg" style="margin-top:8px;color:#c00;">{{ errMsg }}</p>
                </div>
            </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import axios from 'axios'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

/** 基本設定：只用全域 axios */
axios.defaults.baseURL = 'https://todolist-api.hexschool.io' // 無尾斜線
axios.defaults.headers.common['Content-Type'] = 'application/json'

// 小工具：清洗 & 檢查 token（保險，避免不可見字元）
function cleanToken(raw) {
  return String(raw || '')
    .replace(/^"+|"+$/g, '')
    .replace(/[\u0009-\u000D\u0085\u00A0\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g, '')
    .trim()
}
function isLikelyJWT(t) {
  return /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(t)
}

/** 全域請求攔截器：每次請求前統一帶 Token */
axios.interceptors.request.use((config) => {
  const tk = cleanToken(localStorage.getItem('hexToken'))
  if (tk && isLikelyJWT(tk)) {
    if (typeof config.headers?.set === 'function') {
      config.headers.set('Authorization', `${tk}`) //不用bearer
    } else {
      config.headers['Authorization'] = `${tk}` // 不用bearer
    }
  } else {
    if (typeof config.headers?.delete === 'function') {
      config.headers.delete('Authorization')
    } else {
      delete config.headers['Authorization']
    }
  }
  return config
})

/** Router 與狀態 */
const router = useRouter()
const todos = ref([])
const newTodo = ref('')
const activeTab = ref('all')
const loading = ref(false)
const errMsg = ref('')

/** 正規化 todo */
function normalizeTodo(t, idx = 0) {
  const completed = typeof t.status === 'boolean' ? t.status : !!t.completed_at
  const id = t.id ?? t._id ?? t.uuid ?? String(Date.now() + '-' + idx)
  return { id, content: t.content ?? t.title ?? '', completed }
}

/** 讀取清單（無尾斜線：/todos） */
async function fetchTodos() {
  loading.value = true
  errMsg.value = ''
  try {
    const res = await axios.get('/todos')
    const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
    todos.value = list.map((t, i) => normalizeTodo(t, i))
  } catch (e) {
    const status = e?.response?.status
    const msg = e?.response?.data?.message || e.message
    if (status === 401 || status === 403) {
      errMsg.value = '未登入或 Token 已失效，請重新登入'
      await logout(true)
      return
    }
    console.error('fetchTodos error:', status, e?.response?.data || msg)
    errMsg.value = '載入待辦失敗：請確認已登入或 Token 有效'
  } finally {
    loading.value = false
  }
}

/** 新增待辦（仍用 /todos，無尾斜線） */
async function addTodo() {
  const content = (newTodo.value ?? '').toString().trim()
  if (!content) { errMsg.value = '請先輸入內容'; return }
  try {
    await axios.post('/todos', { content })
    newTodo.value = ''
    await fetchTodos()
  } catch (e) {
    const s = e?.response?.status
    const msg = e?.response?.data?.message || e.message
    if (s === 401 || s === 403) { errMsg.value = '未登入或 Token 已失效，請重新登入'; await logout(true); return }
    if (s === 400) errMsg.value = '新增失敗：格式錯誤（content 可能為空或欄位名不符）'
    else errMsg.value = `新增待辦失敗：${s ?? ''} ${msg ?? ''}`.trim()
    console.error('addTodo error:', s, e?.response?.data || msg)
  }
}

/** 切換完成／刪除／清除已完成 */
async function toggleTodo(todo) {
  try { await axios.patch(`/todos/${todo.id}/toggle`); await fetchTodos() }
  catch (e) { const s=e?.response?.status; if (s===401||s===403){await logout(true);return} errMsg.value='更新狀態失敗' }
}
async function removeTodo(id) {
  try { await axios.delete(`/todos/${id}`); await fetchTodos() }
  catch (e) { const s=e?.response?.status; if (s===401||s===403){await logout(true);return} errMsg.value='刪除失敗' }
}
async function clearCompleted() {
  const ids = todos.value.filter(t=>t.completed).map(t=>t.id)
  if (!ids.length) return
  try { await Promise.allSettled(ids.map(id=>axios.delete(`/todos/${id}`))); await fetchTodos() }
  catch (e) { const s=e?.response?.status; if (s===401||s===403){await logout(true);return} errMsg.value='清除已完成失敗' }
}

/** 登出（仍用全域 axios；token 由攔截器自動帶） */
const logout = async (silent = false) => {
  try {
    const token = localStorage.getItem('hexToken')
    if (!token) throw new Error('No token')
    await axios.post('/users/sign_out')
  } catch (err) {
    if (!silent) errMsg.value = '登出發生問題，但已清除登入狀態'
  } finally {
    localStorage.removeItem('hexToken')
    // 也一併移除全域預設（雖有攔截器，但這步有助於「乾淨」）
    delete axios.defaults.headers.common['Authorization']
    await router.replace({ name: 'Login' })
  }
}

/** 篩選 / 統計 */
const filteredTodos = computed(() => {
  if (activeTab.value === 'active') return todos.value.filter(t => !t.completed)
  if (activeTab.value === 'completed') return todos.value.filter(t => t.completed)
  return todos.value
})
const completedCount = computed(() => todos.value.filter(t => t.completed).length)
const remainingCount = computed(() => todos.value.length - completedCount.value)

/** 掛載：檢查 token 存在即可（Bearer 前綴由攔截器處理） */
onMounted(async () => {
  const tk = cleanToken(localStorage.getItem('hexToken'))
  if (!tk) { await router.replace({ name: 'Login' }); return }
  await fetchTodos()
})

// ★ 新增：空清單判斷（避免載入中或錯誤時誤顯示）
const hasNoTodos = computed(() =>
  !loading.value &&
  !errMsg.value &&
  filteredTodos.value.length === 0
)

</script>




