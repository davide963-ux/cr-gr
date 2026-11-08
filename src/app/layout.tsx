export const metadata = { title: "HashRush", description: "Win points. Climb the board. Get paid in $HASHRUSH every Monday." };
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body style={{ margin: 0, background: "#0b0f14", color: "#e6edf3", fontFamily: "ui-monospace,Menlo,monospace" }}>
      <main style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>{children}</main>
    </body></html>
  );
}
