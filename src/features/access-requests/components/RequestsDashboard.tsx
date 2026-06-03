"use client";

import { useState } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AccessStatus | "">("");
  const [environmentFilter, setEnvironmentFilter] = useState<Environment | "">(
    ""
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const trimmedSearch = searchQuery.trim();
  const normalizedSearch = trimmedSearch.toLowerCase();
  const hasActiveFilters =
    trimmedSearch !== "" || statusFilter !== "" || environmentFilter !== "";

  const filteredRequests = requests
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

  // Derived from the full list so the panel stays open when filters change.
  const selectedRequest =
    selectedRequestId !== null
      ? (requests.find((r) => r.id === selectedRequestId) ?? null)
      : null;

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("");
    setEnvironmentFilter("");
    setSortOrder("newest");
  }

  return (
    <>
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>API Access Requests</h1>
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

      {hasActiveFilters && (
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
          {filteredRequests.length} of {requests.length} requests
        </p>
      </section>

      <section className={styles.tableCard} aria-label="Access request table">
        <RequestsTable
          requests={filteredRequests}
          selectedRequestId={selectedRequestId}
          onSelectRequest={setSelectedRequestId}
          emptyMessage={
            hasActiveFilters
              ? "No requests match your current filters."
              : "No access requests found."
          }
        />
      </section>
    </main>

    <RequestDetailPanel
      request={selectedRequest}
      onClose={() => setSelectedRequestId(null)}
    />
    </>
  );
}
