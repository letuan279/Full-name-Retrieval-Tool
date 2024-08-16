<script setup>
import { ref, computed } from 'vue'
import FullnameRetrievalTool from './pages/FullnameRetrievalTool.vue';
import StudentSearch from './pages/StudentSearch.vue';
import NotFound from './pages/NotFound.vue';

const routes = {
  '/': FullnameRetrievalTool,
  '/full-name-retrieval': FullnameRetrievalTool,
  '/student-search': StudentSearch
}

const currentPath = ref(window.location.pathname)

window.addEventListener('popstate', () => {
  currentPath.value = window.location.pathname
})

const currentView = computed(() => {
  return routes[currentPath.value || '/'] || NotFound
})
</script>

<template>
  <component :is="currentView" />
</template>