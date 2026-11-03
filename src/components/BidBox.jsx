import { useEffect, useState } from "react";
import { bidBlockReason, nextMinimum, placeBid } from "../lib/auction";

export default function BidBox({ state, team, ownsInCategory }) {
  const min = nextMinimum(state);
  const [amount, setAmount] = useState(min);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const why = bidBlockReason(state, team, ownsInCategory);

  useEffect(() => {
    setAmount(min);
  }, [min, state.toolId]);

  async function submit() {
    setMsg("");
    setBusy(true);
    try {
      await placeBid(team, parseInt(amount, 10));
    } catch (e) {
      setMsg(
        "Bid rejected. Someone may have bid first, or the amount is too low or over budget.",
      );
    }
    setBusy(false);
  }

  return (
    <div>
      <input
        type="number"
        inputMode="numeric"
        value={amount}
        min={min}
        onChange={(e) => setAmount(e.target.value)}
        disabled={!!why}
        style={{ width: 150 }}
      />
      <button onClick={submit} disabled={!!why || busy}>
        Place bid
      </button>
      <div className="err">{why || msg}</div>
    </div>
  );
}
