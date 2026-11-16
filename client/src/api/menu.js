import { api } from "./client";

export async function getMenuItems({ category, available = true } = {}) {
  const response = await api.get("/menu", { params: { category, available } });
  return response.data;
}

export async function getMenuItemById(id) {
  const response = await api.get(`/menu/${id}`);
  return response.data;
}