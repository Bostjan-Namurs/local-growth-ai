import { AppPreviewScreen } from "../../../../features/admin/screens";

export default async function AppPreviewPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  return <AppPreviewScreen appId={appId} />;
}
