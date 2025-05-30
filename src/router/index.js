import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: 'Home - Stacks Guestbook'
    }
  },
  {
    path: '/about',
    name: 'About',
    // Lazy-loaded component
    component: () => import('../views/About.vue'),
    meta: {
      title: 'About - Stacks Guestbook'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: {
      title: 'Page Not Found - Stacks Guestbook'
    }
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

// Update page title based on route meta
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'Stacks Guestbook';
  next();
});

export default router;