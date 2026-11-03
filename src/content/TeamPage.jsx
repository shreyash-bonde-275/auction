import { useEffect, useState } from "react";
import { deleteDoc, doc, getDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import { useViewer } from "../hooks/useAuth";
import { useCollection } from "../hooks/useQuery";
import { useAuctionState } from "../hooks/useAuctionState";
import LoginTeam from "../components/LoginTeam";
import BudgetBar from "../components/BudgetBar";
import CurrentTool from "../components/CurrentTool";
import BidBox from "../components/BidBox";
import InventoryList from "../components/InventoryList";

export default function TeamPage() {
  const user = useViewer();
  const [teamId, setTeamId] = useState(null);
  const [checked, setChecked] = useState(false);
  const [leaveError, setLeaveError] = useState("");

  // Returning teams skip login: look for an existing member record.
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "members", user.uid))
      .then((m) => {
        if (m.exists()) setTeamId(m.data().teamId);
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [user]);

  const teams = useCollection("teams", [], "", !!user);
  const inventory = useCollection(
    "inventory",
    [where("teamId", "==", teamId || "")],
    teamId || "",
    !!teamId,
  );
  const state = useAuctionState(!!teamId);
  const team = teams.find((t) => t.id === teamId);

  async function leaveTeam() {
    setLeaveError("");
    try {
      await deleteDoc(doc(db, "members", user.uid));
      setTeamId(null);
    } catch {
      setLeaveError("Could not leave the team. Please try again.");
    }
  }

  if (!user || !checked)
    return (
      <div className="page">
        <span className="mute">Loading…</span>
      </div>
    );

  return (
    <div className="page">
      <div className="team-page-header">
        <h1>Auction</h1>
        {teamId && team && (
          <button
            className="leave-team"
            type="button"
            aria-label="Leave team"
            title="Leave team"
            onClick={leaveTeam}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
              <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
            </svg>
          </button>
        )}
      </div>
      {leaveError && (
        <div className="err" role="alert">
          {leaveError}
        </div>
      )}
      {!teamId ? (
        <LoginTeam uid={user.uid} teams={teams} onJoined={setTeamId} />
      ) : !team ? (
        <span className="mute">Loading your team…</span>
      ) : (
        <>
          <BudgetBar team={team} />
          <div className="card">
            <CurrentTool state={state} />
            {state && (
              <BidBox
                state={state}
                team={team}
                ownsInCategory={inventory.some(
                  (i) => i.categoryId === state.categoryId,
                )}
              />
            )}
          </div>
          <InventoryList items={inventory} />
        </>
      )}
    </div>
  );
}
