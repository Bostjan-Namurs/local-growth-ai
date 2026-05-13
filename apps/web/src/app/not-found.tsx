import Link from "next/link";
import { EmptyState } from "../components/ui/panels";

export default function NotFound() {
  return (
    <main className="page">
      <EmptyState title="Page not found" description="This admin route is not part of the current mock shell." />
      <div className="actions" style={{ justifyContent: "center", marginTop: 16 }}>
        <Link className="button" href="/dashboard">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
