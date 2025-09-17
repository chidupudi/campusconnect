// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

console.log('[CONFIG] API Base URL:', API_BASE_URL);
console.log('[CONFIG] Environment:', process.env.NODE_ENV);

export default API_BASE_URL;