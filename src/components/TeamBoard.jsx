import { money } from "../lib/auction";

export default function TeamBoard({ teams, inventory, cats = [], headerAction }) {
  return (
    <div className="card">
      <div className="card-heading">
        <h3 style={{ marginTop: 0 }}>Teams</h3>
        {headerAction}
      </div>
      {teams.map((t) => {
        const own = inventory.filter((i) => i.teamId === t.id);
        return (
          <div className="row" key={t.id}>
            <span>
              <b>{t.name}</b>
              <br />
              {own.length === 0 && <span className="mute">No tools yet.</span>}
              {own.map((i) => (
                <div key={i.id}>
                  {i.toolName} <span className="mute">({cats.find((c) => c.id === i.categoryId)?.name || ""}, {money(i.price)})</span>
                </div>
              ))}
            </span>
            <b>{money(t.remaining)}</b>
          </div>
        );
      })}
    </div>
  );
}
