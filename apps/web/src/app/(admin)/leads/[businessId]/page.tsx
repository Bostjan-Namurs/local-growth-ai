import { BusinessProfileScreen } from "../../../../features/admin/screens";

export default async function BusinessProfilePage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return <BusinessProfileScreen businessId={businessId} />;
}
