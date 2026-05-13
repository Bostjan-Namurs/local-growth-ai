import { BusinessTypeDetailScreen } from "../../../../features/admin/screens";

export default async function BusinessTypeDetailPage({ params }: { params: Promise<{ verticalId: string }> }) {
  const { verticalId } = await params;
  return <BusinessTypeDetailScreen verticalId={verticalId} />;
}
