<template>
<!-- login_page -->
<div id="loginPage" class="bg-yellow">
  <div class="container loginPage vhContainer ">
    <div class="side">
      <a href="#"><img class="logoImg" src="https://raw.githubusercontent.com/hexschool/2022-web-layout-training/main/todolist/logo.png" alt=""></a>
      <img class="d-m-n" src="https://raw.githubusercontent.com/hexschool/2022-web-layout-training/main/todolist/img.png" alt="workImg">
    </div>
    <div>
       <form class="formControls" @submit.prevent="onSignInSubmit">
        <h2 class="formControls_txt">最實用的線上代辦事項服務</h2>
        <label class="formControls_label" for="email">Email</label>
        <input class="formControls_input" type="email" id="email" name="email" placeholder="請輸入 email" required v-model="signInForm.email">
        <label class="formControls_label" for="pwd">密碼</label>
        <input class="formControls_input" type="password" name="pwd" id="pwd" placeholder="請輸入密碼" required v-model="signInForm.password">
        <button class="formControls_btnSubmit" type="submit" :disabled="isLoading">登入</button>

        <RouterLink class="formControls_btnLink" to="/signup">註冊帳號</RouterLink>
        <br/>
          <!-- 可選：顯示訊息 -->
          <p v-if="errorMsg" style="color:#d87355">{{ errorMsg }}</p>
          <p v-if="successMsg" style="color:#2e7d32">{{ successMsg }}</p>
      </form>
    </div>
  </div>
</div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const api = 'https://todolist-api.hexschool.io/'

// 表單資料：請把 template 的 input 加上對應 v-model
const signInForm = ref({
  email: '',
  password: '',
})

const isLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const signin = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  if (!signInForm.value.email || !signInForm.value.password) {
    errorMsg.value = '請輸入 Email 與密碼'
    return
  }
  isLoading.value = true
  try {
    const res = await axios.post(`${api}users/sign_in`, signInForm.value)
    const token = res?.data?.token
    if (!token) throw new Error('未取得授權 token')

    // 儲存 token，之後可帶到後續 API
    localStorage.setItem('hexToken', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

    successMsg.value = '登入成功'
    // 導向待辦頁
    router.push('/todolist')
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || '登入失敗，請確認帳密'
    // console.error(err)
  } finally {
    isLoading.value = false
  }
}

// 供 template 綁定使用
const onSignInSubmit = () => {
  if (isLoading.value) return
  signin()
}
</script>