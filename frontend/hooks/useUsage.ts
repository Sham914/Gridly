import { useQuery } from "@tanstack/react-query";
import { usageService } from "@/services/usage.service";
import type { UsageParams } from "@/types/energy";

export function useUsage(params: UsageParams) {
  return useQuery({
    queryKey: ["usage", params],
    queryFn: () => usageService.getUsage(params),
    enabled: !!params.meter,
  });
}