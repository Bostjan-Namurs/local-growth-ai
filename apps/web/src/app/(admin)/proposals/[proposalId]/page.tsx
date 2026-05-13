import { ProposalReviewScreen } from "../../../../features/admin/screens";

export default async function ProposalReviewPage({ params }: { params: Promise<{ proposalId: string }> }) {
  const { proposalId } = await params;
  return <ProposalReviewScreen proposalId={proposalId} />;
}
