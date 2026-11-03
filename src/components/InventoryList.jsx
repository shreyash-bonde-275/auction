import { money } from "../lib/auction";

export default function InventoryList({ items }) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Your tools</h3>
      {items.length === 0 && <span className="mute">Nothing yet.</span>}
      {items.map((i) => (
        <div className="row" key={i.id}>
          <span>{i.toolName}</span>
          <span className="mute">{money(i.price)}{i.source === "default" ? " · free default" : ""}</span>
        </div>
      ))}
    </div>
  );
}
