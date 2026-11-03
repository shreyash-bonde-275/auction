import { money } from "../lib/auction";

export default function CurrentTool({ state, big = false }) {
  if (!state) {
    return (
      <div className={big ? "card big" : ""}>
        <span className="mute">Waiting for the auctioneer to start.</span>
      </div>
    );
  }
  const lead = state.bidCount > 0;
  const verdict = !state.biddingOpen
    ? lead ? `Sold to ${state.highestBidderName}` : "Unsold"
    : lead ? `Highest bidder: ${state.highestBidderName}` : "Open for bids";

  return (
    <div className={big ? "card big" : ""}>
      <div className="mute">{state.round === "resale" ? "Resale round" : "Now on the block"}</div>
      <div className="tool">{state.toolName}</div>
      <div className="price">{money(lead ? state.highestBid : state.basePrice)}</div>
      <div style={{ margin: "6px 0 12px" }}>
        {big ? <div className="tool">{verdict}</div> : lead ? <>Highest bidder: <b>{state.highestBidderName}</b></> : <span className="mute">Base price. No bids yet.</span>}
      </div>
    </div>
  );
}
