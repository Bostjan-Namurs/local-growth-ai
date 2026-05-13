import Link from "next/link";

const navGroups = [
  {
    label: null,
    items: [{ label: "Dashboard", href: "/dashboard" }]
  },
  {
    label: "Pipeline",
    items: [
      { label: "Leads", href: "/leads" },
      { label: "Businesses", href: "/leads/lead-001" },
      { label: "Proposals", href: "/proposals" },
      { label: "Generated Apps", href: "/apps" },
      { label: "Campaigns", href: "/campaigns" }
    ]
  },
  {
    label: "Automation",
    items: [
      { label: "Agent Runs", href: "/agent-runs" },
      { label: "Approvals", href: "/approvals" },
      { label: "Deployments", href: "/deployments" }
    ]
  },
  {
    label: "Configuration",
    items: [
      { label: "Business Types", href: "/business-types" },
      { label: "Blueprints", href: "/blueprints" },
      { label: "Templates", href: "/templates" },
      { label: "LLM Gateway", href: "/settings/llm-gateway" },
      { label: "Data Sources", href: "/data-sources" }
    ]
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/settings" },
      { label: "Audit Logs", href: "/audit-logs" }
    ]
  }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <aside className="sidebar" aria-label="Admin navigation">
        <Link className="sidebar-brand" href="/dashboard">
          <span className="brand-mark">LG</span>
          <span>
            <strong>LocalGrowth AI</strong>
            <small>Admin Console</small>
          </span>
        </Link>
        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label ?? "root"}>
              {group.label ? <div className="nav-label">{group.label}</div> : null}
              {group.items.map((item) => (
                <Link href={item.href} key={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="content-shell">
        <header className="app-topbar">
          <label className="search-box">
            <span>Search</span>
            <input placeholder="Businesses, leads, proposals..." />
          </label>
          <div className="topbar-status">
            <span className="badge ok">Development</span>
            <span className="badge info">Fake LLM</span>
            <span className="admin-avatar">Admin</span>
          </div>
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
