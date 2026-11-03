import { useState } from "react";
import { clearBidLog, money } from "../lib/auction";

export default function BidLog({ bids, count = 12, canClear = false }) {
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");

  async function clear() {
    if (!window.confirm("Clear the entire bid log? This cannot be undone.")) return;
    setError("");
    setClearing(true);
    try {
      await clearBidLog();
    } catch (e) {
      setError(
        e.code === "permission-denied"
          ? "Firebase denied this deletion. Verify your UID has a matching admins document, then deploy firestore.rules with `firebase deploy --only firestore:rules`."
          : e.message || "Could not clear the bid log. Please try again.",
      );
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="card">
      <div className="card-heading">
        <h3 style={{ marginTop: 0 }}>Bid log</h3>
        {canClear && (
          <button className="alt" type="button" disabled={clearing || !bids.length} onClick={clear}>
            {clearing ? "Clearing…" : "Clear bid log"}
          </button>
        )}
      </div>
      {error && <div className="err" role="alert">{error}</div>}
      {bids.length === 0 && <span className="mute">No bids yet.</span>}
      {bids.slice(0, count).map((b) => (
        <div className="row" key={b.id}>
          <span>{b.teamName}</span>
          <b>{money(b.amount)}</b>
        </div>
      ))}
    </div>
  );
}
