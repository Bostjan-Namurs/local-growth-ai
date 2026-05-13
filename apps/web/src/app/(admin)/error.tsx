"use client";

import { PageHeader, WarningPanel } from "../../components/ui/panels";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <PageHeader title="Admin page error" kicker="The mock UI failed to render this route" />
      <WarningPanel title="Recoverable UI error" tone="danger">
        {error.message || "Unknown render error"}
      </WarningPanel>
      <button className="button" onClick={reset} type="button">
        Try again
      </button>
    </>
  );
}
