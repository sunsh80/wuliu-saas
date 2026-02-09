<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <nav class="navbar">
      <RouterLink to="/quotes">报价管理</RouterLink>
      <RouterLink to="/orders">订单管理</RouterLink>
    </nav>
  </header>

  <main>
    <RouterView />
  </main>
</template>

<style>
.navbar {
  background-color: #333;
  padding: 1rem;
  margin-bottom: 2rem;
}

.navbar a {
  color: white;
  text-decoration: none;
  margin-right: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  background-color: #007bff;
}

.navbar a.router-link-exact-active {
  background-color: #0056b3;
}
</style>
