import axios from "axios";

export const API_ORIGIN = import.meta.env.VITE_API_URL;

if (!API_ORIGIN) {
  throw new Error("VITE_API_URL is not set. Add it to client/.env");
}

export const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true,
});