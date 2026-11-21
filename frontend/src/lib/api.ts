const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("sunpower_token");
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("sunpower_token", token);
    }
  }

  getToken(): string | null {
    if (typeof window !== "undefined" && !this.token) {
      this.token = localStorage.getItem("sunpower_token");
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("sunpower_token");
      localStorage.removeItem("sunpower_user");
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});

    headers.set("Content-Type", "application/json");
    const token = this.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  }

  // Dashboard
  async getDashboardKPIs(timeframe: string = "month") {
    return this.request<any>(`/dashboard/kpis?timeframe=${timeframe}`);
  }

  // CRM & Leads
  async getLeads(params: string = "") {
    return this.request<any[]>(`/crm/leads${params ? `?${params}` : ""}`);
  }

  async createLead(data: any) {
    return this.request<any>("/crm/leads", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateLead(id: number, data: any) {
    return this.request<any>(`/crm/leads/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async submitPublicEnquiry(data: any) {
    return this.request<any>("/crm/public-enquiry", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getCustomers(search: string = "") {
    return this.request<any[]>(`/crm/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`);
  }

  // Surveys
  async getSurveys(status: string = "") {
    return this.request<any[]>(`/surveys${status ? `?status=${status}` : ""}`);
  }

  async getSurveyDetail(id: number) {
    return this.request<any>(`/surveys/${id}`);
  }

  async scheduleSurvey(data: any) {
    return this.request<any>("/surveys", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async approveSurvey(id: number, overrideReason?: string) {
    return this.request<any>(`/surveys/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ override_reason: overrideReason }),
    });
  }

  // Packages & BOM
  async getPackages() {
    return this.request<any[]>("/packages");
  }

  async calculateBOM(systemType: string, capacityKw: number) {
    return this.request<any>(`/packages/calculate-bom?system_type=${systemType}&capacity_kw=${capacityKw}`);
  }

  // Quotations
  async getQuotations() {
    return this.request<any[]>("/quotations");
  }

  async getQuotationDetail(id: number) {
    return this.request<any>(`/quotations/${id}`);
  }

  async createQuotation(data: any) {
    return this.request<any>("/quotations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async acceptQuotation(id: number) {
    return this.request<any>(`/quotations/${id}/accept`, {
      method: "POST",
    });
  }

  // Orders
  async getOrders(params: string = "") {
    return this.request<any[]>(`/orders${params ? `?${params}` : ""}`);
  }

  async getOrderDetail(id: number) {
    return this.request<any>(`/orders/${id}`);
  }

  async creditOverride(id: number, reason: string) {
    return this.request<any>(`/orders/${id}/credit-override`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  // Payments
  async getPayments(params: string = "") {
    return this.request<any[]>(`/payments${params ? `?${params}` : ""}`);
  }

  async recordPayment(data: any) {
    return this.request<any>("/payments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Inventory
  async getInventory(lowStock: boolean = false) {
    return this.request<any[]>(`/inventory${lowStock ? "?low_stock_only=true" : ""}`);
  }

  async adjustStock(data: any) {
    return this.request<any>("/inventory/adjust", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Serials & QR
  async getSerials(params: string = "") {
    return this.request<any[]>(`/serials${params ? `?${params}` : ""}`);
  }

  async verifyScannedQR(qrCode: string, orderId?: number) {
    return this.request<any>("/serials/verify-qr", {
      method: "POST",
      body: JSON.stringify({ qr_code: qrCode, order_id: orderId }),
    });
  }

  // Dispatch
  async getOrdersReadyForDispatch() {
    return this.request<any[]>("/dispatch/orders-ready");
  }

  async confirmDispatch(data: any) {
    return this.request<any>("/dispatch/confirm", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Technicians
  async getTechnicians() {
    return this.request<any[]>("/technicians");
  }

  // Installations
  async getInstallations() {
    return this.request<any[]>("/installations");
  }

  async getInstallationDetail(id: number) {
    return this.request<any>(`/installations/${id}`);
  }

  async updateTaskProgress(installationId: number, taskId: number, data: any) {
    return this.request<any>(`/installations/${installationId}/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async customerAcceptance(installationId: number, data: any) {
    return this.request<any>(`/installations/${installationId}/customer-acceptance`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Warranties
  async getWarranties() {
    return this.request<any[]>("/warranties");
  }

  async lookupWarranty(query: string) {
    return this.request<any>(`/warranties/lookup?query=${encodeURIComponent(query)}`);
  }

  // Service
  async getServiceTickets() {
    return this.request<any[]>("/service/tickets");
  }

  async createServiceTicket(data: any) {
    return this.request<any>("/service/tickets", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateServiceTicket(id: number, data: any) {
    return this.request<any>(`/service/tickets/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Subsidies
  async getSubsidies() {
    return this.request<any[]>("/subsidies");
  }

  async updateSubsidy(id: number, data: any) {
    return this.request<any>(`/subsidies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Finance & Profitability
  async getJobProfitability() {
    return this.request<any[]>("/finance/job-profitability");
  }

  async getFinancialOverview() {
    return this.request<any>("/finance/overview");
  }

  // Auth Switch Role
  async switchRole(role: string) {
    const res = await this.request<any>(`/auth/switch-role?role=${role}`, {
      method: "POST",
    });
    if (res.access_token) {
      this.setToken(res.access_token);
      if (typeof window !== "undefined") {
        localStorage.setItem("sunpower_user", JSON.stringify(res.user));
      }
    }
    return res;
  }
}

export const api = new ApiClient();
