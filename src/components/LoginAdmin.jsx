import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function go() {
    setErr("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setErr("Sign-in failed. Check the email and password.");
    }
  }

  return (
    <div className="card">
      <input
        type="email"
        placeholder="Admin email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={go}>Sign in</button>
      <div className="err">{err}</div>
    </div>
  );
}
