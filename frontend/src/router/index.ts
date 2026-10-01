import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("@/views/RegisterView.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/verify",
      name: "verify",
      component: () => import("@/views/VerifyView.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/",
      component: () => import("@/layouts/MainLayout.vue"),
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "dashboard",
          component: () => import("@/views/DashboardView.vue"),
        },
        {
          path: "markets",
          name: "markets",
          component: () => import("@/views/MarketsView.vue"),
        },
        {
          path: "markets/:id",
          name: "market-detail",
          component: () => import("@/views/MarketDetailView.vue"),
        },
        {
          path: "portfolio",
          name: "portfolio",
          component: () => import("@/views/PortfolioView.vue"),
        },
        {
          path: "ipo",
          name: "ipo",
          component: () => import("@/views/IpoView.vue"),
        },
        {
          path: "leaderboard",
          name: "leaderboard",
          component: () => import("@/views/LeaderboardView.vue"),
        },
        {
          path: "news",
          name: "news",
          component: () => import("@/views/NewsView.vue"),
        },
        // Admin routes
        {
          path: "admin",
          name: "admin",
          component: () => import("@/views/admin/AdminDashboard.vue"),
          meta: { requiresAdmin: true },
        },
        {
          path: "admin/companies",
          name: "admin-companies",
          component: () => import("@/views/admin/CompaniesManagement.vue"),
          meta: { requiresAdmin: true },
        },
        {
          path: "admin/users",
          name: "admin-users",
          component: () => import("@/views/admin/UsersManagement.vue"),
          meta: { requiresAdmin: true },
        },
        {
          path: "admin/news",
          name: "admin-news",
          component: () => import("@/views/admin/NewsManagement.vue"),
          meta: { requiresAdmin: true },
        },
        {
          path: "admin/ipo",
          name: "admin-ipo",
          component: () => import("@/views/admin/IpoManagement.vue"),
          meta: { requiresAdmin: true },
        },
        {
          path: "admin/ads",
          name: "ads",
          component: () => import("@/views/admin/AdminAds.vue"),
          meta: { requiresAdmin: true },
        },
      ],
    },
  ],
});

// Navigation guards
router.beforeEach(async (to: any, _from: any, next: any) => {
  const authStore = useAuthStore();

  // Auth required
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: "login" });
  }

  // Guest only
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return next({ name: "dashboard" });
  }

  // Admin only
  if (to.meta.requiresAdmin) {
    if (!authStore.user) {
      await authStore.fetchUser();
    }

    if (!authStore.isAdmin) {
      return next({ name: "dashboard" });
    }
  }

  next();
});

export default router;
