import { useState } from "react";
import { useViewer } from "../hooks/useAuth";
import { useCollection, useDocument } from "../hooks/useQuery";
import { byOrder, resetAuction } from "../lib/auction";
import TeamBoard from "../components/TeamBoard";
import Tabs from "../components/Tabs";

export default function SummaryPage() {
  const user = useViewer();
  const admin = useDocument("admins", user?.uid || "", !!user);
  const isAdmin = !!admin;
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const teams = useCollection("teams", [], "", !!user);
  const inventory = useCollection("inventory", [], "", !!user);
  const cats = useCollection("categories", [], "", !!user).sort(byOrder);

  async function clearSummary() {
    if (!window.confirm(
      "Clear the summary and reset the auction? This also clears all bids, restores team budgets, and resets tool and category status. This cannot be undone.",
    )) return;
    setError("");
    setResetting(true);
    try {
      await resetAuction();
    } catch (e) {
      setError(
        e.code === "permission-denied"
          ? "Firebase denied the reset. Verify your UID has a matching admins document, then deploy firestore.rules with `firebase deploy --only firestore:rules`."
          : e.message || "Could not reset the auction. Please try again.",
      );
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="page">
      <h1>Final summary</h1>
      <Tabs />
      {error && <div className="err" role="alert">{error}</div>}
      {user && !user.isAnonymous && !admin && (
        <div className="mute" role="status">
          Admin controls are hidden because this account is not listed in Firestore admins. Add its UID as an admins document ID to enable them.
        </div>
      )}
      <TeamBoard
        teams={teams}
        inventory={inventory}
        cats={cats}
        headerAction={isAdmin && (
          <button className="alt" type="button" disabled={resetting} onClick={clearSummary}>
            {resetting ? "Clearing…" : "Clear summary"}
          </button>
        )}
      />
    </div>
  );
}
