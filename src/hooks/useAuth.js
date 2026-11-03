import { useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "../firebase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setReady(true);
      }),
    []
  );
  return { user, ready };
}

// Guarantees a signed-in user (anonymous if nobody else is). Used by team and display pages.
export function useViewer() {
  const { user, ready } = useAuth();
  useEffect(() => {
    if (ready && !user) signInAnonymously(auth).catch(console.error);
  }, [ready, user]);
  return user;
}
