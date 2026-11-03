import { useDocument } from "./useQuery";

export function useAuctionState(enabled = true) {
  return useDocument("auction_state", "current", enabled);
}

export function useSettings(enabled = true) {
  const s = useDocument("settings", "config", enabled);
  return { minIncrement: 500, phase: "setup", ...(s || {}) };
}
