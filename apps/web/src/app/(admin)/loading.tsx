import { LoadingSkeleton, PageHeader } from "../../components/ui/panels";

export default function AdminLoading() {
  return (
    <>
      <PageHeader title="Loading" kicker="Preparing the mock admin surface" />
      <section className="panel" aria-label="Loading admin page">
        <LoadingSkeleton />
      </section>
    </>
  );
}
