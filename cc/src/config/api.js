// API Configuration
const getApiUrl = () => {
  // Always use localhost:5000 for browser access in Docker
  // The backend service is exposed on localhost:5000 from the host
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

const API_BASE_URL = getApiUrl();

console.log('[CONFIG] API Base URL:', API_BASE_URL);
console.log('[CONFIG] Environment:', process.env.NODE_ENV);
console.log('[CONFIG] Hostname:', window.location.hostname);

export default API_BASE_URL;