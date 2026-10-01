import axios, { type AxiosInstance } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor - token ekle
    this.client.interceptors.request.use(
      (config: any) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - token yenileme
    this.client.interceptors.response.use(
      (response: any) => response,
      async (error: any) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (!refreshToken) {
              throw new Error("No refresh token");
            }

            const { data } = await axios.post(`${API_URL}/auth/refresh`, {
              refreshToken,
            });

            localStorage.setItem("accessToken", data.accessToken);
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

            return this.client(originalRequest);
          } catch (err) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "/login";
            return Promise.reject(err);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth
  async register(email: string, password: string, name?: string) {
    const { data } = await this.client.post("/auth/register", {
      email,
      password,
      name,
    });
    return data;
  }

  async verifyEmail(email: string, code: string) {
    const { data } = await this.client.post("/auth/verify-email", { email, code });
    return data;
  }

  async resendCode(email: string) {
    const { data } = await this.client.post("/auth/resend-code", { email });
    return data;
  }

  async login(email: string, password: string) {
    const { data } = await this.client.post("/auth/login", { email, password });
    return data;
  }

  async getMe() {
    const { data } = await this.client.get("/auth/me");
    return data;
  }

  // Companies
  async getCompanies() {
    const { data } = await this.client.get("/companies");
    return data;
  }

  async getCompany(id: string) {
    const { data } = await this.client.get(`/companies/${id}`);
    return data;
  }

  async getCompanyHistory(id: string, period: string = "1D") {
    const { data } = await this.client.get(`/companies/${id}/history`, {
      params: { period },
    });
    return data;
  }

  async createCompany(company: any) {
    const { data } = await this.client.post("/companies", company);
    return data;
  }

  async updateCompany(id: string, company: any) {
    const { data } = await this.client.patch(`/companies/${id}`, company);
    return data;
  }

  async deleteCompany(id: string) {
    const { data } = await this.client.delete(`/companies/${id}`);
    return data;
  }

  // Orders
  async createOrder(order: any) {
    const { data } = await this.client.post("/orders", order);
    return data;
  }

  async getMyOrders(params?: any) {
    const { data } = await this.client.get("/orders/mine", { params });
    return data;
  }

  async cancelOrder(id: string) {
    const { data } = await this.client.delete(`/orders/${id}`);
    return data;
  }

  async getOrderBook(companyId: string) {
    const { data } = await this.client.get(`/orders/book/${companyId}`);
    return data;
  }

  // Portfolio
  async getPortfolioSummary() {
    const { data } = await this.client.get("/portfolio/summary");
    return data;
  }

  async getMyTrades(params?: any) {
    const { data } = await this.client.get("/portfolio/trades", { params });
    return data;
  }

  async getLeaderboard(params?: any) {
    const { data } = await this.client.get("/portfolio/leaderboard", {
      params,
    });
    return data;
  }

  // IPO
  async getActiveIPOs() {
    const { data } = await this.client.get("/ipo");
    return data;
  }

  async getIPO(companyId: string) {
    const { data } = await this.client.get(`/ipo/${companyId}`);
    return data;
  }

  async createIPODemand(demand: any) {
    const { data } = await this.client.post("/ipo/demand", demand);
    return data;
  }

  async getMyIPODemands() {
    const { data } = await this.client.get("/ipo/demands/mine");
    return data;
  }

  // News
  async getNews(params?: any) {
    const { data } = await this.client.get("/news", { params });
    return data;
  }

  async getNewsItem(id: string) {
    const { data } = await this.client.get(`/news/${id}`);
    return data;
  }

  // Admin
  async getDashboard() {
    const { data } = await this.client.get("/admin/dashboard");
    return data;
  }

  async getUsers() {
    const { data } = await this.client.get("/admin/users");
    return data;
  }

  async manageCash(userId: string, delta: number, reason: string) {
    const { data } = await this.client.post("/admin/users/cash", {
      userId,
      delta,
      reason,
    });
    return data;
  }

  async createIPOWindow(ipoWindow: any) {
    const { data } = await this.client.post("/admin/ipo", ipoWindow);
    return data;
  }

  async allocateIPO(companyId: string, allocationPrice: number) {
    const { data } = await this.client.post(
      `/admin/ipo/${companyId}/allocate`,
      { allocationPrice }
    );
    return data;
  }

  async createNews(news: any) {
    const { data } = await this.client.post("/admin/news", news);
    return data;
  }

  async deleteNews(id: string) {
    const { data } = await this.client.delete(`/admin/news/${id}`);
    return data;
  }

  async getAuditLogs(params?: any) {
    const { data } = await this.client.get("/admin/logs", { params });
    return data;
  }

  async getSystemStatus() {
    const { data } = await this.client.get("/admin/system/status");
    return data;
  }

  async updateSystemStatus(status: string, resumeDate?: string) {
    const { data } = await this.client.post("/admin/system/status", {
      status,
      resumeDate,
    });
    return data;
  }

  async getRegistrationStatus() {
    const { data } = await this.client.get("/admin/system/registration-status");
    return data;
  }

  async updateRegistrationStatus(status: string) {
    const { data } = await this.client.post(
      "/admin/system/registration-status",
      {
        status,
      }
    );
    return data;
  }

  // Ads
  async getPublicAds(location?: string) {
    const { data } = await this.client.get("/public/ads", {
      params: { location },
    });
    return data;
  }

  async getAdminAds() {
    const { data } = await this.client.get("/admin/ads");
    return data;
  }

  async createAd(ad: any) {
    const { data } = await this.client.post("/admin/ads", ad);
    return data;
  }

  async updateAd(id: string, ad: any) {
    const { data } = await this.client.put(`/admin/ads/${id}`, ad);
    return data;
  }

  async deleteAd(id: string) {
    const { data } = await this.client.delete(`/admin/ads/${id}`);
    return data;
  }

  // Axios instance'ı direkt kullanmak için
  get(url: string, config?: any) {
    return this.client.get(url, config);
  }

  post(url: string, data?: any, config?: any) {
    return this.client.post(url, data, config);
  }

  put(url: string, data?: any, config?: any) {
    return this.client.put(url, data, config);
  }

  patch(url: string, data?: any, config?: any) {
    return this.client.patch(url, data, config);
  }

  delete(url: string, config?: any) {
    return this.client.delete(url, config);
  }
}

export const api = new ApiClient();
export default api;
