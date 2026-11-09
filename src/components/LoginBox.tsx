"use client";
import { useState } from "react";

/** Login = enter your X username (creates the account if new). */
export default function LoginBox() {
  const [x, setX] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function login() {
    setBusy(true);
    try {
      const r = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify({ xUsername: x }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok) window.dispatchEvent(new Event("hr:refresh")); else setMsg(d.error ?? `Login failed (${r.status})`);
    } catch { setMsg("Network error, try again"); }
    setBusy(false);
  }
  return (
    <>
      <p style={{ margin: 0 }}>Log in with your <b>X username</b> to play. We contact winners there to send the prize. You don&apos;t need to connect your X account.</p>
      <input className="field" value={x} onChange={(e) => setX(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} placeholder="@yourhandle" autoFocus />
      <button className="btn" onClick={login} disabled={busy}>▶ Log in</button>
      <div className="msg">{msg}</div>
    </>
  );
}
