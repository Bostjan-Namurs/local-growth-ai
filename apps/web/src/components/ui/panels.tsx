export function PageHeader({
  title,
  kicker,
  actions
}: {
  title: string;
  kicker?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {kicker ? <p className="page-kicker">{kicker}</p> : null}
      </div>
      {actions ? <div className="actions">{actions}</div> : null}
    </div>
  );
}

export function DataCard({
  title,
  description,
  children,
  className = "",
  style
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section className={`panel ${className}`} style={style}>
      {title ? (
        <div className="panel-header">
          <h2 className="section-title">{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function WarningPanel({
  title,
  children,
  tone = "warn"
}: {
  title: string;
  children: React.ReactNode;
  tone?: "warn" | "danger" | "info" | "ok";
}) {
  return (
    <div className={`warning-panel ${tone}`}>
      <strong>{title}</strong>
      <div>{children}</div>
    </div>
  );
}

export function JsonViewer({ value }: { value: unknown }) {
  return <pre className="json-viewer">{JSON.stringify(value, null, 2)}</pre>;
}

export function Timeline({ items }: { items: Array<{ title: string; detail: string; meta?: string }> }) {
  return (
    <div className="timeline">
      {items.map((item) => (
        <div className="timeline-item" key={`${item.title}-${item.detail}`}>
          <strong>{item.title}</strong>
          <span>{item.detail}</span>
          {item.meta ? <small>{item.meta}</small> : null}
        </div>
      ))}
    </div>
  );
}

export function ApprovalBar({
  status,
  children
}: {
  status: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="approval-bar">
      <div>
        <span className="eyebrow">Approval status</span>
        <div>{status}</div>
      </div>
      <div className="actions">{children}</div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="skeleton-stack" aria-label="Loading">
      <div />
      <div />
      <div />
    </div>
  );
}

export function ConfirmActionDialog({
  title,
  description,
  actionLabel,
  disabled
}: {
  title: string;
  description: string;
  actionLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="confirm-action">
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <button className="button" disabled={disabled} type="button">
        {actionLabel}
      </button>
    </div>
  );
}
