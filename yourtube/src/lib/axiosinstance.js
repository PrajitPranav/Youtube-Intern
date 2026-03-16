import axios from "axios";
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000",
  timeout: 30000, // 30 seconds — handles Render free tier cold start delay
});
export default axiosInstance;

