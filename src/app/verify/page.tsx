"use client";
import { useState } from "react";

export default function Verify() {
  const [msg, setMsg] = useState("");
  async function confirm() {
    const token = new URLSearchParams(window.location.search).get("token");
    const r = await fetch("/api/auth/verify", { method: "POST", body: JSON.stringify({ token }) });
    if (r.ok) window.location.href = "/play"; else setMsg((await r.json()).error);
  }
  return (<><h1>Confirm your email</h1><button onClick={confirm}>Confirm and sign in</button><p>{msg}</p></>);
}
