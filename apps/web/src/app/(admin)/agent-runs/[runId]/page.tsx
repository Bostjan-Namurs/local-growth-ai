import { AgentRunDetailScreen } from "../../../../features/admin/screens";

export default async function AgentRunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return <AgentRunDetailScreen runId={runId} />;
}
