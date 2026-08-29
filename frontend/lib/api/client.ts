export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type RequestOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;
};

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

async function fetchClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += `?${qs}`;
    }
  }

  // Default headers
  const finalHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers,
  };

  const response = await fetch(url, {
    headers: finalHeaders,
    ...customOptions,
  });

  if (!response.ok) {
    let errorData;
    let errorMessage = "An error occurred";
    try {
      errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText || String(response.status);
    }
    throw new ApiError(response.status, errorMessage, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) => fetchClient<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    fetchClient<T>(endpoint, { ...options, method: "POST", body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    fetchClient<T>(endpoint, { ...options, method: "PUT", body: JSON.stringify(data) }),
  patch: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    fetchClient<T>(endpoint, { ...options, method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    fetchClient<T>(endpoint, { ...options, method: "DELETE" }),
};
