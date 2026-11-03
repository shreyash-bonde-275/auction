import { useState } from "react";
import {
  assignDefaults,
  byOrder,
  closeBidding,
  markCategoryDone,
  money,
  startTool,
} from "../lib/auction";

export default function AdminControls({
  cats,
  tools,
  teams,
  inventory,
  state,
  settings,
}) {
  const [catId, setCatId] = useState("");
  const [note, setNote] = useState("");
  const sel = catId || cats[0]?.id || "";
  const open = !!state?.biddingOpen;
  const pending = tools
    .filter((t) => t.categoryId === sel && t.status === "pending")
    .sort(byOrder);
  const unsold = tools
    .filter((t) => t.status === "unsold" && t.round !== "resale")
    .sort(byOrder);

  async function run(fn) {
    setNote("");
    try {
      await fn();
    } catch (e) {
      setNote(e.message);
    }
  }

  return (
    <div className="card">
      <h2>Live controls</h2>
      <select value={sel} onChange={(e) => setCatId(e.target.value)}>
        {cats.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {c.status === "done" ? " (done)" : ""}
          </option>
        ))}
      </select>

      <p className="mute">
        {state ? (
          <>
            <b>{state.toolName}</b> ({state.round}){" "}
            {open ? "is live" : "is closed"}. Highest: {money(state.highestBid)}{" "}
            {state.highestBidderName
              ? `by ${state.highestBidderName}`
              : "(no bids)"}
            .
          </>
        ) : (
          "No tool started yet."
        )}
      </p>

      <button
        disabled={open || !pending.length}
        onClick={() =>
          run(() => startTool(pending[0], "main", settings.minIncrement))
        }
      >
        Start next tool ({pending.length} left)
      </button>
      <button
        className="stop"
        disabled={!open}
        onClick={() => run(() => closeBidding(state))}
      >
        Close bidding
      </button>
      <button
        className="alt"
        disabled={!sel}
        onClick={() => run(() => markCategoryDone(sel))}
      >
        Mark category done
      </button>

      <h3>After all categories</h3>
      <button
        className="alt"
        disabled={open || !unsold.length}
        onClick={() =>
          run(() => startTool(unsold[0], "resale", settings.minIncrement))
        }
      >
        Next resale tool ({unsold.length} unsold)
      </button>
      <button
        className="alt"
        disabled={open}
        onClick={() =>
          window.confirm(
            "Give each team the free default for every category it has nothing from, and finish?",
          ) && run(() => assignDefaults({ teams, cats, tools, inventory }))
        }
      >
        Assign defaults and finish
      </button>

      <div className="err">{note}</div>
    </div>
  );
}
