<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <main>
    <RouterView />
  </main>
</template>

<style scoped>
main {
  padding: 24px;
  margin-top: 80px; /* 为顶部栏留出空间 */
  margin-left: 270px; /* 为侧边栏留出空间 */
  margin-right: 20px; /* 添加右边距 */
  width: calc(100% - 290px); /* 调整宽度以适应侧边栏 */
  min-height: calc(100vh - 104px); /* 设置最小高度以填满视口 */
  background-color: #f5f5f5;
}
</style>
