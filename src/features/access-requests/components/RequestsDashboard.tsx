"use client";

import { useId, useRef, useState } from "react";
import type { AccessRequest, AccessStatus, Environment } from "../types";
import { RequestsTable } from "./RequestsTable";
import { RequestsToolbar } from "./RequestsToolbar";
import { RequestDetailPanel } from "./RequestDetailPanel";
import type { SortOrder } from "./RequestsToolbar";
import styles from "./RequestsDashboard.module.css";

type RequestsDashboardProps = {
  requests: readonly AccessRequest[];
};

function matchesSearch(request: AccessRequest, query: string): boolean {
  const q = query.toLowerCase();
  return (
    request.requesterName.toLowerCase().includes(q) ||
    request.requesterEmail.toLowerCase().includes(q) ||
    request.team.toLowerCase().includes(q) ||
    request.apiName.toLowerCase().includes(q)
  );
}

export function RequestsDashboard({ requests }: RequestsDashboardProps) {
  // Session-local copy of the server-provided requests. Decisions update
  // this list; the `requests` prop itself is never mutated.
  const [localRequests, setLocalRequests] = useState<AccessRequest[]>(() => [
    ...requests,
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AccessStatus | "">("");
  const [environmentFilter, setEnvironmentFilter] = useState<Environment | "">(
    ""
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Id of the detail panel landmark, shared with the row buttons that
  // control it via aria-controls.
  const panelId = useId();

  // Tracks whichever button opened the detail panel, so focus can return
  // there when the user explicitly closes it. Falls back to the page
  // heading if that button no longer exists (e.g. its row was filtered
  // out while the panel was open).
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const fallbackFocusRef = useRef<HTMLHeadingElement>(null);

  const trimmedSearch = searchQuery.trim();
  const normalizedSearch = trimmedSearch.toLowerCase();
  const hasActiveFilters =
    trimmedSearch !== "" || statusFilter !== "" || environmentFilter !== "";

  const filteredRequests = localRequests
    .filter((r) => {
      if (statusFilter !== "" && r.status !== statusFilter) return false;
      if (environmentFilter !== "" && r.environment !== environmentFilter)
        return false;
      if (normalizedSearch !== "" && !matchesSearch(r, normalizedSearch))
        return false;
      return true;
    })
    .sort((a, b) => {
      const diff = Date.parse(a.submittedAt) - Date.parse(b.submittedAt);
      return sortOrder === "newest" ? -diff : diff;
    });

  // No requests exist at all versus the active search/filters simply not
  // matching anything — these are distinct empty states with different
  // messaging.
  const hasNoData = localRequests.length === 0;
  const hasNoResults = filteredRequests.length === 0;

  // Derived from the full local list (not the filtered one) so the panel
  // stays open even if filters change or the selected request's status
  // no longer matches the active filters.
  const selectedRequest =
    selectedRequestId !== null
      ? (localRequests.find((r) => r.id === selectedRequestId) ?? null)
      : null;

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("");
    setEnvironmentFilter("");
    setSortOrder("newest");
  }

  function handleSelectRequest(id: string, trigger: HTMLButtonElement) {
    openerRef.current = trigger;
    setSelectedRequestId(id);
  }

  // Explicit close (close button or Escape) — clears the selection and
  // restores focus. Switching directly between requests goes through
  // `handleSelectRequest` instead and does not touch focus restoration.
  function handleCloseRequest() {
    setSelectedRequestId(null);
    const opener = openerRef.current;
    if (opener !== null && document.body.contains(opener)) {
      opener.focus();
    } else {
      fallbackFocusRef.current?.focus();
    }
  }

  function handleDecision(updatedRequest: AccessRequest) {
    setLocalRequests((prev) =>
      prev.map((r) => (r.id === updatedRequest.id ? updatedRequest : r))
    );
  }


  return (
    <>
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 ref={fallbackFocusRef} tabIndex={-1} className={styles.title}>
            API Access Requests
          </h1>
          <p className={styles.description}>
            Review current requests across teams and environments.
          </p>
        </header>

        <RequestsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          environmentFilter={environmentFilter}
          onEnvironmentChange={setEnvironmentFilter}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
        />

        {hasActiveFilters && !hasNoResults && (
          <div className={styles.toolbarActions}>
            <button
              type="button"
              className={styles.clearFilters}
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        )}

        <section className={styles.summary} aria-label="Request summary">
          <p className={styles.summaryLabel}>Showing</p>
          <p className={styles.summaryValue}>
            {filteredRequests.length} of {localRequests.length} requests
          </p>
        </section>

        {hasNoResults ? (
          <section className={styles.emptyState} aria-label="Access request results">
            {hasNoData ? (
              <>
                <h2 className={styles.emptyStateTitle}>
                  No access requests yet
                </h2>
                <p className={styles.emptyStateText}>
                  Submitted access requests will appear here once teams
                  start requesting API access.
                </p>
              </>
            ) : (
              <>
                <h2 className={styles.emptyStateTitle}>
                  No matching requests
                </h2>
                <p className={styles.emptyStateText}>
                  Try adjusting your search or filters to find what you’re
                  looking for.
                </p>
                <button
                  type="button"
                  className={styles.clearFilters}
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </>
            )}
          </section>
        ) : (
          <section className={styles.tableCard} aria-label="Access request table">
            <RequestsTable
              requests={filteredRequests}
              selectedRequestId={selectedRequestId}
              onSelectRequest={handleSelectRequest}
              panelId={panelId}
            />
          </section>
        )}
      </main>

      <RequestDetailPanel
        key={selectedRequestId ?? "no-selection"}
        request={selectedRequest}
        onClose={handleCloseRequest}
        onDecision={handleDecision}
        panelId={panelId}
      />
    </>
  );
}
