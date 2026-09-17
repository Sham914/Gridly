    
import { api } from "@/api/api";
import type { UsagePoint, UsageParams } from "@/types/energy";

export const usageService = {
  getUsage: async (
    params: UsageParams
  ): Promise<UsagePoint[]> => {
    const response = await api.get<UsagePoint[]>(
      "/usage",
      {
        params,
      }
    );

    return response.data;
  },
};