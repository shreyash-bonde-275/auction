import { orderBy, limit } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { useCollection, useDocument } from "../hooks/useQuery";
import { useAuctionState, useSettings } from "../hooks/useAuctionState";
import { byOrder } from "../lib/auction";
import LoginAdmin from "../components/LoginAdmin";
import SetupForms from "../components/SetupForms";
import AdminControls from "../components/AdminControls";
import BidLog from "../components/BidLog";
import TeamBoard from "../components/TeamBoard";
import Tabs from "../components/Tabs";

export default function AdminPage() {
  const { user, ready } = useAuth();
  const admin = useDocument("admins", user?.uid || "", !!user);
  const isAdmin = !!admin;

  const teams = useCollection("teams", [], "", isAdmin);
  const cats = useCollection("categories", [], "", isAdmin).sort(byOrder);
  const tools = useCollection("tools", [], "", isAdmin);
  const inventory = useCollection("inventory", [], "", isAdmin);
  const bids = useCollection("bids", [orderBy("ts", "desc"), limit(30)], "recent", isAdmin);
  const state = useAuctionState(isAdmin);
  const settings = useSettings(isAdmin);

  if (!ready) return null;

  return (
    <div className="page">
      <h1>Auction admin</h1>
      <Tabs />
      {!isAdmin ? (
        <LoginAdmin />
      ) : (
        <>
          <SetupForms
            key={settings.minIncrement}
            cats={cats}
            settings={settings}
            teams={teams}
            tools={tools}
            state={state}
          />
          <AdminControls
            cats={cats} tools={tools} teams={teams} inventory={inventory}
            state={state} settings={settings}
          />
          <BidLog bids={bids} canClear />
          <TeamBoard teams={teams} inventory={inventory} cats={cats} />
          <button className="alt" onClick={() => signOut(auth)}>Sign out</button>
        </>
      )}
    </div>
  );
}
