"use client";

import { useEffect, useRef } from "react";
import type { AccessRequest } from "../types";
import { StatusBadge } from "./StatusBadge";
import styles from "./RequestDetailPanel.module.css";

type RequestDetailPanelProps = {
  request: AccessRequest | null;
  onClose: () => void;
};

const detailDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

function formatDetailDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return detailDateFormatter.format(date);
}

/** Detail panel shown when a user selects a request row. Read-only. */
export function RequestDetailPanel({ request, onClose }: RequestDetailPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the close button whenever a new request is opened.
  useEffect(() => {
    if (request !== null) {
      closeButtonRef.current?.focus();
    }
  }, [request]);

  // Close on Escape while the panel is open.
  useEffect(() => {
    if (request === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [request, onClose]);

  if (request === null) return null;

  return (
    <aside className={styles.panel} aria-labelledby="detail-panel-title">
      <div className={styles.panelHeader}>
        <h2 id="detail-panel-title" className={styles.panelTitle}>
          {request.requesterName}
        </h2>
        <button
          ref={closeButtonRef}
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close detail panel"
        >
          ✕
        </button>
      </div>

      <div className={styles.panelBody}>
        {/* Requester identity */}
        <section className={styles.section}>
          <h3 className={styles.sectionHeading}>Requester</h3>
          <dl className={styles.detailList}>
            <div className={styles.detailRow}>
              <dt className={styles.detailLabel}>Name</dt>
              <dd className={styles.detailValue}>{request.requesterName}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt className={styles.detailLabel}>Email</dt>
              <dd className={styles.detailValue}>
                <a
                  href={`mailto:${request.requesterEmail}`}
                  className={styles.emailLink}
                >
                  {request.requesterEmail}
                </a>
              </dd>
            </div>
            <div className={styles.detailRow}>
              <dt className={styles.detailLabel}>Team</dt>
              <dd className={styles.detailValue}>{request.team}</dd>
            </div>
          </dl>
        </section>

        {/* Request details */}
        <section className={styles.section}>
          <h3 className={styles.sectionHeading}>Request</h3>
          <dl className={styles.detailList}>
            <div className={styles.detailRow}>
              <dt className={styles.detailLabel}>API</dt>
              <dd className={styles.detailValue}>{request.apiName}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt className={styles.detailLabel}>Environment</dt>
              <dd className={`${styles.detailValue} ${styles.capitalize}`}>
                {request.environment}
              </dd>
            </div>
            <div className={styles.detailRow}>
              <dt className={styles.detailLabel}>Access level</dt>
              <dd className={`${styles.detailValue} ${styles.capitalize}`}>
                {request.accessLevel}
              </dd>
            </div>
            <div className={styles.detailRow}>
              <dt className={styles.detailLabel}>Status</dt>
              <dd className={styles.detailValue}>
                <StatusBadge status={request.status} />
              </dd>
            </div>
            <div className={styles.detailRow}>
              <dt className={styles.detailLabel}>Submitted</dt>
              <dd className={styles.detailValue}>
                <time dateTime={request.submittedAt}>
                  {formatDetailDate(request.submittedAt)}
                </time>
              </dd>
            </div>
          </dl>
        </section>

        {/* Justification — always present */}
        <section className={styles.section}>
          <h3 className={styles.sectionHeading}>Justification</h3>
          <p className={styles.bodyText}>{request.justification}</p>
        </section>

        {/* Reviewer notes — only if present */}
        {request.reviewerNotes !== undefined && (
          <section className={styles.section}>
            <h3 className={styles.sectionHeading}>Reviewer notes</h3>
            <p className={styles.bodyText}>{request.reviewerNotes}</p>
          </section>
        )}

        {/* Decision metadata — only if present */}
        {request.decision !== undefined && (
          <section className={styles.section}>
            <h3 className={styles.sectionHeading}>Decision</h3>
            <dl className={styles.detailList}>
              <div className={styles.detailRow}>
                <dt className={styles.detailLabel}>Reviewed by</dt>
                <dd className={styles.detailValue}>
                  {request.decision.reviewedBy}
                </dd>
              </div>
              <div className={styles.detailRow}>
                <dt className={styles.detailLabel}>Reviewed at</dt>
                <dd className={styles.detailValue}>
                  <time dateTime={request.decision.reviewedAt}>
                    {formatDetailDate(request.decision.reviewedAt)}
                  </time>
                </dd>
              </div>
            </dl>
          </section>
        )}

        {/* Actions placeholder — approve/reject will go here in a future issue */}
      </div>
    </aside>
  );
}
