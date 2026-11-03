import {
  doc,
  collection,
  writeBatch,
  runTransaction,
  serverTimestamp,
  getDoc,
  getDocs,
  increment,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

export const money = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
export const byOrder = (a, b) => a.order - b.order;

const stateRef = () => doc(db, "auction_state", "current");

/* ---------- bidding helpers (shared by UI) ---------- */
export function nextMinimum(state) {
  return state.bidCount === 0
    ? state.basePrice
    : state.highestBid + state.minIncrement;
}

// Returns a message if this team cannot bid right now, otherwise "".
export function bidBlockReason(state, team, ownsInCategory) {
  if (!state || !state.biddingOpen) return "Bidding is closed.";
  if (ownsInCategory)
    return "You already own a tool in this category, so you cannot bid.";
  if (state.highestBidderId === team.id) return "You are the highest bidder.";
  if (nextMinimum(state) > team.remaining)
    return "The next bid is above your remaining budget.";
  return "";
}

/* ---------- team: place a bid (transaction + matching log entry) ---------- */
export async function placeBid(team, amount) {
  const bidRef = doc(collection(db, "bids"));
  await runTransaction(db, async (tx) => {
    const s = (await tx.get(stateRef())).data();
    if (!s.biddingOpen) throw new Error("Bidding is closed.");
    if (!Number.isInteger(amount) || amount < nextMinimum(s))
      throw new Error("Bid is too low.");
    tx.update(stateRef(), {
      highestBid: amount,
      highestBidderId: team.id,
      highestBidderName: team.name,
      bidCount: s.bidCount + 1,
      updatedAt: serverTimestamp(),
    });
    tx.set(bidRef, {
      toolId: s.toolId,
      teamId: team.id,
      teamName: team.name,
      amount,
      ts: serverTimestamp(),
    });
  });
}

/* ---------- admin: auction control ---------- */
export async function startTool(tool, round, minIncrement) {
  const b = writeBatch(db);
  b.update(doc(db, "tools", tool.id), { status: "live", round });
  if (round === "main")
    b.update(doc(db, "categories", tool.categoryId), { status: "active" });
  b.set(stateRef(), {
    toolId: tool.id,
    categoryId: tool.categoryId,
    toolName: tool.name,
    basePrice: tool.basePrice,
    minIncrement,
    round,
    biddingOpen: true,
    highestBid: 0,
    highestBidderId: "",
    highestBidderName: "",
    bidCount: 0,
    updatedAt: serverTimestamp(),
  });
  b.set(
    doc(db, "settings", "config"),
    { phase: round === "resale" ? "resale" : "live" },
    { merge: true },
  );
  await b.commit();
}

export async function closeBidding(s) {
  const b = writeBatch(db);
  const toolRef = doc(db, "tools", s.toolId);
  b.update(stateRef(), { biddingOpen: false });
  if (s.bidCount > 0) {
    b.update(toolRef, {
      status: "sold",
      winnerTeamId: s.highestBidderId,
      finalPrice: s.highestBid,
    });
    b.update(doc(db, "teams", s.highestBidderId), {
      remaining: increment(-s.highestBid),
    });
    b.set(doc(db, "inventory", `${s.highestBidderId}_${s.categoryId}`), {
      teamId: s.highestBidderId,
      categoryId: s.categoryId,
      toolId: s.toolId,
      toolName: s.toolName,
      price: s.highestBid,
      source: s.round === "resale" ? "resale" : "auction",
    });
  } else {
    b.update(toolRef, { status: "unsold" });
  }
  await b.commit();
}

export const markCategoryDone = (id) =>
  updateDoc(doc(db, "categories", id), { status: "done" });

// Run once after the resale round: every team without a tool in a category gets that category's free default.
export async function assignDefaults({ teams, cats, tools, inventory }) {
  const b = writeBatch(db);
  for (const c of cats) {
    const d = tools.find((t) => t.id === c.defaultToolId);
    if (!d) continue;
    for (const t of teams) {
      if (inventory.some((i) => i.teamId === t.id && i.categoryId === c.id))
        continue;
      b.set(doc(db, "inventory", `${t.id}_${c.id}`), {
        teamId: t.id,
        categoryId: c.id,
        toolId: d.id,
        toolName: d.name,
        price: 0,
        source: "default",
      });
    }
  }
  b.set(doc(db, "settings", "config"), { phase: "done" }, { merge: true });
  await b.commit();
}

/* ---------- admin: setup ---------- */
export const saveIncrement = (v) =>
  setDoc(doc(db, "settings", "config"), { minIncrement: v }, { merge: true });

export async function addTeam({ name, budget, code }) {
  const ref = doc(collection(db, "teams"));
  const b = writeBatch(db);
  b.set(ref, { name, budget, remaining: budget });
  b.set(doc(db, "teamSecrets", ref.id), { code });
  await b.commit();
}

export const addCategory = (name) =>
  addDoc(collection(db, "categories"), {
    name,
    order: Date.now(),
    defaultToolId: "",
    status: "pending",
  });

export async function addTool({ name, categoryId, basePrice, isDefault }) {
  const r = await addDoc(collection(db, "tools"), {
    name,
    categoryId,
    basePrice,
    order: Date.now(),
    isDefault,
    status: isDefault ? "default" : "pending",
    winnerTeamId: null,
    finalPrice: null,
    round: "main",
  });
  if (isDefault)
    await updateDoc(doc(db, "categories", categoryId), { defaultToolId: r.id });
}

async function deleteRefsInBatches(refs) {
  for (let index = 0; index < refs.length; index += 450) {
    const batch = writeBatch(db);
    refs.slice(index, index + 450).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

async function deleteInBatches(refs, updates, finalize) {
  await deleteRefsInBatches(refs);
  for (let index = 0; index < updates.length; index += 450) {
    const batch = writeBatch(db);
    updates.slice(index, index + 450).forEach(({ ref, amount }) => {
      batch.update(ref, { remaining: increment(amount) });
    });
    await batch.commit();
  }
  await finalize();
}

export async function clearBidLog() {
  const bids = await getDocs(collection(db, "bids"));
  await deleteRefsInBatches(bids.docs.map((bid) => bid.ref));
}

export async function resetAuction() {
  const stopAuction = writeBatch(db);
  stopAuction.delete(stateRef());
  await stopAuction.commit();

  const [teams, tools, categories, inventory, bids] = await Promise.all([
    getDocs(collection(db, "teams")),
    getDocs(collection(db, "tools")),
    getDocs(collection(db, "categories")),
    getDocs(collection(db, "inventory")),
    getDocs(collection(db, "bids")),
  ]);
  const deleteRefs = [
    ...inventory.docs.map((item) => item.ref),
    ...bids.docs.map((bid) => bid.ref),
  ];
  await deleteRefsInBatches(deleteRefs);

  const updates = [
    ...teams.docs.map((team) => ({
      ref: team.ref,
      data: { remaining: team.data().budget },
    })),
    ...tools.docs.map((tool) => ({
      ref: tool.ref,
      data: {
        status: tool.data().isDefault ? "default" : "pending",
        winnerTeamId: null,
        finalPrice: null,
        round: "main",
      },
    })),
    ...categories.docs.map((category) => ({
      ref: category.ref,
      data: { status: "pending" },
    })),
  ];

  for (let index = 0; index < updates.length; index += 450) {
    const batch = writeBatch(db);
    updates.slice(index, index + 450).forEach(({ ref, data }) => {
      batch.update(ref, data);
    });
    await batch.commit();
  }
  const batch = writeBatch(db);
  batch.set(doc(db, "settings", "config"), { phase: "setup" }, { merge: true });
  await batch.commit();
}

async function getInventoryRefunds(items) {
  const amounts = new Map();
  items.forEach((item) => {
    amounts.set(
      item.teamId,
      (amounts.get(item.teamId) || 0) + Number(item.price || 0),
    );
  });
  const teams = await Promise.all(
    [...amounts].map(async ([teamId, amount]) => ({
      ref: doc(db, "teams", teamId),
      amount,
      snapshot: await getDoc(doc(db, "teams", teamId)),
    })),
  );
  return teams
    .filter(({ amount, snapshot }) => amount && snapshot.exists())
    .map(({ ref, amount }) => ({ ref, amount }));
}

function ensureNotLive(state, matchesCurrentAuction) {
  if (state?.biddingOpen && matchesCurrentAuction) {
    throw new Error(
      "Close bidding before deleting records from the current auction.",
    );
  }
}

async function getBidsForTools(tools) {
  const snapshots = await Promise.all(
    tools.map((tool) =>
      getDocs(query(collection(db, "bids"), where("toolId", "==", tool.id))),
    ),
  );
  return snapshots.flatMap((snapshot) => snapshot.docs.map((bid) => bid.ref));
}

export async function deleteTeam(team, state) {
  ensureNotLive(state, state?.highestBidderId === team.id);
  const [inventory, bids, members] = await Promise.all([
    getDocs(query(collection(db, "inventory"), where("teamId", "==", team.id))),
    getDocs(query(collection(db, "bids"), where("teamId", "==", team.id))),
    getDocs(query(collection(db, "members"), where("teamId", "==", team.id))),
  ]);
  const refs = [
    ...inventory.docs.map((item) => item.ref),
    ...bids.docs.map((bid) => bid.ref),
    ...members.docs.map((member) => member.ref),
  ];
  await deleteInBatches(refs, [], async () => {
    const batch = writeBatch(db);
    batch.delete(doc(db, "teamSecrets", team.id));
    batch.delete(doc(db, "teams", team.id));
    if (state?.highestBidderId === team.id) batch.delete(stateRef());
    await batch.commit();
  });
}

export async function deleteCategory(category, state) {
  ensureNotLive(state, state?.categoryId === category.id);
  const [tools, inventory] = await Promise.all([
    getDocs(
      query(collection(db, "tools"), where("categoryId", "==", category.id)),
    ),
    getDocs(
      query(
        collection(db, "inventory"),
        where("categoryId", "==", category.id),
      ),
    ),
  ]);
  const bids = await getBidsForTools(
    tools.docs.map((tool) => ({ id: tool.id })),
  );
  const refs = [
    ...tools.docs.map((tool) => tool.ref),
    ...inventory.docs.map((item) => item.ref),
    ...bids,
  ];
  const refunds = await getInventoryRefunds(
    inventory.docs.map((item) => item.data()),
  );
  await deleteInBatches(refs, refunds, async () => {
    const batch = writeBatch(db);
    batch.delete(doc(db, "categories", category.id));
    if (state?.categoryId === category.id) batch.delete(stateRef());
    await batch.commit();
  });
}

export async function deleteTool(tool, state) {
  ensureNotLive(state, state?.toolId === tool.id);
  const [inventory, bids] = await Promise.all([
    getDocs(query(collection(db, "inventory"), where("toolId", "==", tool.id))),
    getDocs(query(collection(db, "bids"), where("toolId", "==", tool.id))),
  ]);
  const categoryRef = doc(db, "categories", tool.categoryId);
  const category = await getDoc(categoryRef);
  const removeState = state?.toolId === tool.id;
  const refunds = await getInventoryRefunds(
    inventory.docs.map((item) => item.data()),
  );

  await deleteInBatches(
    [
      ...inventory.docs.map((item) => item.ref),
      ...bids.docs.map((bid) => bid.ref),
    ],
    refunds,
    async () => {
      const batch = writeBatch(db);
      batch.delete(doc(db, "tools", tool.id));
      if (category.exists() && category.data().defaultToolId === tool.id) {
        batch.update(categoryRef, { defaultToolId: "" });
      }
      if (removeState) batch.delete(stateRef());
      await batch.commit();
    },
  );
}

/* ---------- team login ---------- */
export const joinTeam = (uid, teamId, code) =>
  setDoc(doc(db, "members", uid), { teamId, code });
