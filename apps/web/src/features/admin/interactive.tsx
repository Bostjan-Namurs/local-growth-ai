"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Lead, TrustState } from "../../lib/types";
import { Pill, StatusBadge, TrustBadge } from "../../components/ui/badges";
import { ConfirmActionDialog, DataCard, EmptyState, WarningPanel } from "../../components/ui/panels";

function leadStatusState(status: Lead["leadStatus"]): TrustState {
  if (status === "Qualified") return "approved";
  if (status === "Needs review") return "needs_review";
  return "draft";
}

function complianceState(status: Lead["complianceStatus"]): TrustState {
  if (status === "Allowed") return "verified";
  if (status === "Blocked") return "blocked";
  return "needs_review";
}

export function LeadInboxInteractive({ initialLeads }: { initialLeads: Lead[] }) {
  const [query, setQuery] = useState("");
  const [businessType, setBusinessType] = useState("all");
  const [city, setCity] = useState("all");
  const [minimumScore, setMinimumScore] = useState("70");
  const [compliance, setCompliance] = useState("Allowed");

  const filteredLeads = useMemo(() => {
    return initialLeads.filter((lead) => {
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 ||
        lead.businessName.toLowerCase().includes(normalizedQuery) ||
        lead.businessType.toLowerCase().includes(normalizedQuery);
      const matchesType = businessType === "all" || lead.businessType === businessType;
      const matchesCity = city === "all" || lead.city === city;
      const matchesScore = lead.opportunityScore >= Number(minimumScore);
      const matchesCompliance = compliance === "all" || lead.complianceStatus === compliance;
      return matchesQuery && matchesType && matchesCity && matchesScore && matchesCompliance;
    });
  }, [businessType, city, compliance, initialLeads, minimumScore, query]);

  return (
    <>
      <DataCard title="Filters" description="Client-side controls over mock lead data">
        <div className="filters">
          <label className="field">
            <span>Search</span>
            <input
              aria-label="Search leads"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Business name or type"
              value={query}
            />
          </label>
          <label className="field">
            <span>Business type</span>
            <select aria-label="Business type filter" onChange={(event) => setBusinessType(event.target.value)} value={businessType}>
              <option value="all">All types</option>
              <option>Bike Rental</option>
              <option>Restaurant</option>
              <option>Salon</option>
              <option>Hotel</option>
            </select>
          </label>
          <label className="field">
            <span>City</span>
            <select aria-label="City filter" onChange={(event) => setCity(event.target.value)} value={city}>
              <option value="all">All cities</option>
              <option>Ljubljana</option>
              <option>Maribor</option>
              <option>Bled</option>
            </select>
          </label>
          <label className="field">
            <span>Score</span>
            <select aria-label="Minimum opportunity score" onChange={(event) => setMinimumScore(event.target.value)} value={minimumScore}>
              <option value="60">60+</option>
              <option value="70">70+</option>
              <option value="80">80+</option>
              <option value="90">90+</option>
            </select>
          </label>
          <label className="field">
            <span>Compliance</span>
            <select aria-label="Compliance filter" onChange={(event) => setCompliance(event.target.value)} value={compliance}>
              <option value="all">All</option>
              <option value="Allowed">Allowed</option>
              <option value="Needs review">Needs review</option>
              <option value="Blocked">Blocked</option>
            </select>
          </label>
        </div>
      </DataCard>

      <DataCard title="Leads" description={`${filteredLeads.length} mock leads`}>
        {filteredLeads.length === 0 ? (
          <EmptyState title="No leads match these filters" description="Adjust the mock filters to restore rows." />
        ) : (
          <div className="table-scroll">
            <table className="table">
              <caption>Mock lead inbox with compliance and review status</caption>
              <thead>
                <tr>
                  <th scope="col">Business name</th>
                  <th scope="col">Business type</th>
                  <th scope="col">City</th>
                  <th scope="col">Website status</th>
                  <th scope="col">Score</th>
                  <th scope="col">Source</th>
                  <th scope="col">Compliance</th>
                  <th scope="col">Package</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>{lead.businessName}</td>
                    <td>{lead.businessType}</td>
                    <td>{lead.city}</td>
                    <td>{lead.websiteStatus}</td>
                    <td>
                      <Pill tone={lead.opportunityScore >= 85 ? "ok" : "neutral"}>{lead.opportunityScore}</Pill>
                    </td>
                    <td>{lead.source}</td>
                    <td>
                      <TrustBadge state={complianceState(lead.complianceStatus)} />
                    </td>
                    <td>{lead.recommendedPackage}</td>
                    <td>
                      <StatusBadge state={leadStatusState(lead.leadStatus)}>{lead.leadStatus}</StatusBadge>
                    </td>
                    <td>
                      <div className="actions">
                        <Link className="button secondary" href={`/leads/${lead.id}`}>
                          View
                        </Link>
                        <button className="button secondary" type="button">
                          Generate CGP
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataCard>
    </>
  );
}

export function ProposalApprovalPanel() {
  const [decision, setDecision] = useState<"pending" | "approved" | "changes" | "rejected">("pending");
  const isApproved = decision === "approved";

  return (
    <DataCard title="Approval panel">
      <ConfirmActionDialog
        title="Approve proposal"
        description="Approving only moves this mock proposal to preview app generation. It does not send outreach."
        actionLabel={isApproved ? "Approved" : "Approve proposal"}
        disabled={isApproved}
      />
      <div className="segmented-actions" role="group" aria-label="Proposal review decision">
        <button className="button" onClick={() => setDecision("approved")} type="button">
          Approve
        </button>
        <button className="button secondary" onClick={() => setDecision("changes")} type="button">
          Request regeneration
        </button>
        <button className="button secondary" onClick={() => setDecision("pending")} type="button">
          Edit manually
        </button>
        <button className="button danger" onClick={() => setDecision("rejected")} type="button">
          Reject
        </button>
      </div>
      <div className="decision-state" aria-live="polite">
        <span className="eyebrow">Current mock decision</span>
        <StatusBadge state={decision === "approved" ? "approved" : decision === "rejected" ? "rejected" : decision === "changes" ? "needs_review" : "draft"}>
          {decision}
        </StatusBadge>
      </div>
      {isApproved ? (
        <Link className="button" href="/apps/app-001">
          Generate preview app
        </Link>
      ) : (
        <button className="button" disabled type="button">
          Generate preview app
        </button>
      )}
    </DataCard>
  );
}

export function BusinessTypeWizardInteractive({ qaChecklist }: { qaChecklist: string[] }) {
  const steps = [
    "Business type basics",
    "App pattern selection",
    "Required features",
    "Required customer inputs",
    "AI rules",
    "Campaign playbook",
    "QA checklist",
    "Codex handoff"
  ];
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <>
      <div className="stepper" aria-label="Business type wizard progress">
        {steps.map((step, index) => (
          <button
            className={`step ${index === currentStep ? "active" : ""}`}
            key={step}
            onClick={() => setCurrentStep(index)}
            type="button"
          >
            <strong>{index + 1}</strong>
            <span>{step}</span>
          </button>
        ))}
      </div>
      <section className="grid cols-2" style={{ marginTop: 16 }}>
        <DataCard title={steps[currentStep]} description={`Step ${currentStep + 1} of ${steps.length}`}>
          {currentStep === 0 ? (
            <form className="form">
              <label className="field">
                <span>Business type name</span>
                <input defaultValue="Bike Rental" />
              </label>
              <label className="field">
                <span>Vertical ID</span>
                <input defaultValue="bike-rental" />
              </label>
              <label className="field">
                <span>Synonyms</span>
                <textarea defaultValue="bike rental, bicycle hire, bike shop, cycling tours" />
              </label>
            </form>
          ) : null}
          {currentStep === 1 ? (
            <div className="radio-stack">
              {["rental_booking", "appointment_booking", "reservation_booking", "service_quote"].map((pattern) => (
                <label className="choice-row" key={pattern}>
                  <input defaultChecked={pattern === "rental_booking"} name="app-pattern" type="radio" />
                  <span>{pattern}</span>
                </label>
              ))}
            </div>
          ) : null}
          {currentStep === 2 ? (
            <Checklist items={["Catalog", "Availability calendar", "Booking request", "Pickup and return rules", "Admin approval required"]} />
          ) : null}
          {currentStep === 3 ? (
            <Checklist items={["Business contact details", "Opening hours", "Rental catalog", "Pricing", "Policies", "Product photos"]} />
          ) : null}
          {currentStep === 4 ? (
            <div className="stack">
              <WarningPanel title="Allowed" tone="ok">
                Generic feature descriptions, SEO copy, and draft benefits may be generated with labels.
              </WarningPanel>
              <WarningPanel title="Must be placeholders" tone="warn">
                Opening hours, pricing, inventory, policies, and product photos.
              </WarningPanel>
              <WarningPanel title="Forbidden to invent" tone="danger">
                Exact prices, legal terms, safety guarantees, availability, reviews, insurance, or certifications.
              </WarningPanel>
            </div>
          ) : null}
          {currentStep === 5 ? (
            <Checklist items={["Launch campaign draft", "Seasonal campaign draft", "Hotel partner campaign draft"]} />
          ) : null}
          {currentStep === 6 ? <Checklist items={qaChecklist} /> : null}
          {currentStep === 7 ? (
            <WarningPanel title="Codex handoff is gated" tone="warn">
              This creates a reviewable implementation request. It does not activate a vertical in production.
            </WarningPanel>
          ) : null}
        </DataCard>
        <DataCard title="Wizard safety gates">
          <WarningPanel title="Approval required" tone="warn">
            Dangerous actions stay disabled until an admin approves the draft.
          </WarningPanel>
          <button className="button" disabled type="button">
            Activate vertical disabled
          </button>
        </DataCard>
      </section>
      <div className="wizard-controls">
        <button className="button secondary" disabled={currentStep === 0} onClick={() => setCurrentStep((step) => Math.max(0, step - 1))} type="button">
          Previous
        </button>
        <button className="button" disabled={currentStep === steps.length - 1} onClick={() => setCurrentStep((step) => Math.min(steps.length - 1, step + 1))} type="button">
          Next
        </button>
      </div>
    </>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <div className="checklist">
      {items.map((item) => (
        <label className="choice-row" key={item}>
          <input defaultChecked type="checkbox" />
          <span>{item}</span>
        </label>
      ))}
    </div>
  );
}
