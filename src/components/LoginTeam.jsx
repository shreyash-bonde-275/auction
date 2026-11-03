import { useState } from "react";
import { joinTeam } from "../lib/auction";

export default function LoginTeam({ uid, teams, onJoined }) {
  const [teamId, setTeamId] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const chosen = teamId || teams[0]?.id || "";

  async function join() {
    setErr("");
    try {
      await joinTeam(uid, chosen, code.trim());
      onJoined(chosen);
    } catch (e) {
      setErr("Wrong code for that team.");
    }
  }

  return (
    <div className="card">
      <select value={chosen} onChange={(e) => setTeamId(e.target.value)}>
        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <input placeholder="Team code" value={code} onChange={(e) => setCode(e.target.value)} />
      <button onClick={join} disabled={!chosen || !code}>Join</button>
      <div className="err">{err}</div>
    </div>
  );
}
