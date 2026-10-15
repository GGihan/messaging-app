const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = async (endpoint, options = {}) => {
  // Prepare standard headers
  const headers = {
    ...options.headers, // Merges custom headers passed into the function call
  };

  // Default to JSON for standard payloads
  if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Let the browser automatically generate the boundary header for FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  // Construct the absolute path dynamically
  const url = `${BASE_URL}/api${endpoint}`;

  const response = await fetch(url, {
    method: 'GET',
    ...options,
    headers,
    credentials: 'include', // Attach & store session cookies
  });

  // Handle standard CORS, network and validation errors
  if (!response.ok) {
    // errorData = { success: false, message: "Error message" }
    const errorData = await response.json().catch(() => ({}));

    throw new ApiError(
      errorData.message,
      response.status,
      errorData
    );
  }

  return response.json();
};

export class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = data.errors || [];
  }

  // Instantly flattens express-validator errors array into a clean object
  unwrapFieldErrors() {
    const errorMap = {};
    this.errors.forEach(err => {
      if (err.field) errorMap[err.field] = err.message;
    });
    return errorMap; // Returns: { username: "Too short", email: "Invalid address" }
  }
};