import { api } from "@/lib/apiClient";
import apiRoutes from "@/constants/apis";

export const getInventory = async (params = {}) => {
  const query = new URLSearchParams();
  query.set("view", params.view || "dc");
  query.set("pageNo", String(params.pageNo || 1));
  query.set("pageSize", String(params.pageSize || 100));
  if (params.searchTerm?.trim()) query.set("searchTerm", params.searchTerm.trim());
  if (params.dcCode) query.set("dcCode", params.dcCode);
  if (params.vendorCode) query.set("vendorCode", params.vendorCode);

  const response = await api.get(`${apiRoutes.inventory.get}?${query.toString()}`, {
    indexedDBCache: true,
    backgroundRefresh: true,
    onBackgroundRefresh: (freshResponse) => params.onBackgroundRefresh?.(freshResponse.data),
  });
  if (response.data?.Error) throw new Error(response.data.Message || "Failed to load inventory.");
  return response.data;
};

const unwrap = (response) => {
  if (response.data?.Error) throw new Error(response.data.Message || "Inventory action failed.");
  return response.data;
};

export const startStockTake = async (dcCode) => unwrap(await api.post(apiRoutes.inventory.startStockTake, { dcCode }));
export const getStockTake = async (stockTakeNO) => unwrap(await api.get(`${apiRoutes.inventory.getStockTake}?stockTakeNO=${encodeURIComponent(stockTakeNO)}`));
export const scanStockTakeItem = async (stockTakeNO, scanCode) => unwrap(await api.post(apiRoutes.inventory.scanStockTakeItem, { stockTakeNO, scanCode }));
export const completeStockTake = async (stockTakeNO) => unwrap(await api.post(apiRoutes.inventory.completeStockTake, { stockTakeNO }));

const inventoryService = { getInventory, startStockTake, getStockTake, scanStockTakeItem, completeStockTake };
export default inventoryService;
