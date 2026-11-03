import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";

// Live list of documents. `key` should change whenever `constraints` change.
export function useCollection(path, constraints = [], key = "", enabled = true) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    if (!enabled) return;
    const q = query(collection(db, path), ...constraints);
    return onSnapshot(
      q,
      (s) => setRows(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => console.error(path, e)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key, enabled]);
  return rows;
}

// Live single document (null until it exists).
export function useDocument(path, id, enabled = true) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!enabled) return;
    return onSnapshot(
      doc(db, path, id),
      (s) => setData(s.exists() ? { id: s.id, ...s.data() } : null),
      (e) => console.error(path, e)
    );
  }, [path, id, enabled]);
  return data;
}
