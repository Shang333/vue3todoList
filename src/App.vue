<script setup>
import { RouterLink, RouterView } from 'vue-router'
import './assets/style/base.css'

</script>

<template>
  <header>
    <nav>
      <RouterLink to="/">Login</RouterLink> |
      <RouterLink to="/signup">SignUp</RouterLink> |
      <RouterLink to="/todolist">TodoList</RouterLink>
    </nav>
  </header>
   <RouterView />
</template>
