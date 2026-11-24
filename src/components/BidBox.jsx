import { useEffect, useState } from "react";
import { bidBlockReason, nextMinimum, placeBid } from "../lib/auction";

export default function BidBox({ state, team, ownsInCategory }) {
  const min = nextMinimum(state);
  const [amount, setAmount] = useState(min);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const why = bidBlockReason(state, team, ownsInCategory);
  const overBudget =
    Number.isFinite(Number(amount)) && Number(amount) > team.remaining;
  const reason = overBudget
    ? "The bid cannot exceed your remaining budget."
    : why || msg;

  useEffect(() => {
    setAmount(Math.min(min, team.remaining));
  }, [min, state.toolId, team.remaining]);

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
        max={team.remaining}
        onChange={(e) => setAmount(e.target.value)}
        disabled={!!why}
      />
      <button onClick={submit} disabled={!!why || overBudget || busy}>
        Place bid
      </button>
      <div className="err">{reason}</div>
    </div>
  );
}
