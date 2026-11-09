"use client";
import LoginBox from "./LoginBox";
import { useMe } from "./useMe";

/** Login panel for the games hub; shows a greeting once logged in. */
export default function HubLogin() {
  const me = useMe();
  if (me === undefined) return null;
  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      {me.x_username
        ? <p style={{ margin: 0 }}>Logged in as <b style={{ color: "var(--cyan)" }}>@{me.x_username}</b>. Pick a game below.</p>
        : <><h2 className="px">LOG IN</h2><LoginBox /></>}
    </div>
  );
}
