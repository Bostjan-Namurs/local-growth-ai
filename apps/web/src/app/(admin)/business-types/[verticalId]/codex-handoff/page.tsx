import { CodexHandoffScreen } from "../../../../../features/admin/screens";

export default async function CodexHandoffPage({ params }: { params: Promise<{ verticalId: string }> }) {
  const { verticalId } = await params;
  return <CodexHandoffScreen verticalId={verticalId} />;
}
