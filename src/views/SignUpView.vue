<template>
<!-- sign up -->
<div id="signUpPage" class="bg-yellow">
  <div class="container signUpPage vhContainer">
    <div class="side">
      <a href="#"><img class="logoImg" src="https://raw.githubusercontent.com/hexschool/2022-web-layout-training/main/todolist/logo.png" alt=""></a>
      <img class="d-m-n" src="https://raw.githubusercontent.com/hexschool/2022-web-layout-training/main/todolist/img.png" alt="workImg">
    </div>
    <div>
     <form class="formControls" @submit.prevent="onSignUpSubmit">
        <h2 class="formControls_txt">註冊帳號</h2>
        <label class="formControls_label" for="email">Email</label>
        <input class="formControls_input" type="email" id="email" name="email" placeholder="請輸入 email" required v-model="signUpForm.email">
        <label class="formControls_label" for="name">您的暱稱</label>
        <input class="formControls_input" type="text" name="name" id="name" placeholder="請輸入您的暱稱" v-model="signUpForm.nickname">
        <label class="formControls_label" for="pwd">密碼</label>
        <input class="formControls_input" type="password" name="pwd" id="pwd" placeholder="請輸入密碼" required v-model="signUpForm.password">
        <label class="formControls_label" for="pwdConfirm">再次輸入密碼</label>
        <input class="formControls_input" type="password" name="pwdConfirm" id="pwdConfirm" placeholder="請再次輸入密碼" required v-model="signUpForm.passwordConfirm">
        <button class="formControls_btnSubmit" type="submit" :disabled="isLoading">註冊帳號</button>

        <RouterLink class="formControls_btnLink" to="/">登入</RouterLink>

        <!-- 可選：提示訊息 -->
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
const signUpForm = ref({
  email: '',
  password: '',
  passwordConfirm: '',
  nickname: '',
})

const isLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const signup = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  // 簡單前端驗證
  if (!signUpForm.value.email || !signUpForm.value.password || !signUpForm.value.nickname) {
    errorMsg.value = '請完整填寫 Email/密碼/暱稱'
    return
  }
  if (signUpForm.value.password !== signUpForm.value.passwordConfirm) {
    errorMsg.value = '兩次密碼不一致'
    return
  }
  isLoading.value = true
  try {
    const payload = {
      email: signUpForm.value.email,
      password: signUpForm.value.password,
      nickname: signUpForm.value.nickname,
    }
    const res = await axios.post(`${api}users/sign_up`, payload)
    // 一般會拿到 uid / email 等資訊
    successMsg.value = '註冊成功，請登入'
    // 依你的路由規劃導向登入頁（此處假設登入路徑為 "/"）
    router.push('/')
  } catch (err) {
    // 後端會回傳錯誤訊息字串於 err.response.data.message（通常）
    errorMsg.value = err?.response?.data?.message || '註冊失敗，請稍後再試'
    // console.error(err)
  } finally {
    isLoading.value = false
  }
}

// 供 template 綁定使用
const onSignUpSubmit = () => {
  if (isLoading.value) return
  signup()
}
</script>


