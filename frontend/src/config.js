// API Configuration
// In development: uses Vite proxy (relative URLs work)
// In production: uses VITE_API_URL environment variable

export const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// Helper function to build API URLs
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  
  // In development (no VITE_API_URL), return relative URL for proxy
  if (!API_BASE_URL) {
    return `/${cleanEndpoint}`
  }
  
  // In production, use full URL
  return `${API_BASE_URL}/${cleanEndpoint}`
}

export default {
  API_BASE_URL,
  getApiUrl
}
