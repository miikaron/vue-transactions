import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import TransactionSummary from '../views/TransactionSummary.vue'

import CustomerForm from '../components/transaction/CustomerForm.vue'

import { useAuthStore } from '../stores/auth';


const routes = [
  { path: '/', name: 'TransactionSummary', component: TransactionSummary },
  { path: '/home', name: 'Home', component: Home },
  { path: '/add-customer', name: 'CustomerForm', component: CustomerForm },
  { path: '/:catchAll(.*)', redirect: '/home' }  // Wildcard route for non-existent URLs
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Check for user and fetch if needed
  if (!authStore.user) {
    await authStore.fetchUser();
  }

  // Redirect based on authentication state

  if (!authStore.user && to.name === 'Home') {
    next({ name: 'TransactionSummary' });
  } else {
    next();
  }
});

export default router
