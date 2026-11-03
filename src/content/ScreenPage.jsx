import { orderBy, limit } from "firebase/firestore";
import { useViewer } from "../hooks/useAuth";
import { useCollection } from "../hooks/useQuery";
import { useAuctionState } from "../hooks/useAuctionState";
import CurrentTool from "../components/CurrentTool";
import BidLog from "../components/BidLog";

export default function ScreenPage() {
  const user = useViewer();
  const state = useAuctionState(!!user);
  const bids = useCollection("bids", [orderBy("ts", "desc"), limit(6)], "screen", !!user);

  return (
    <div className="page">
      <CurrentTool state={state} big />
      <BidLog bids={bids} count={6} />
    </div>
  );
}
