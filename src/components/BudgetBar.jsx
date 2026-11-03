import { money } from "../lib/auction";

export default function BudgetBar({ team }) {
  return (
    <div className="card">
      <div className="mute">{team.name}</div>
      <h2>{money(team.remaining)} left</h2>
    </div>
  );
}
