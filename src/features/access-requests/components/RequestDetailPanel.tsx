"use client";

import { useEffect, useRef, useState } from "react";
import type { AccessRequest } from "../types";
import type { DecisionAction } from "../mock-data";
import { submitDecision } from "../mock-data";
import { StatusBadge } from "./StatusBadge";
import styles from "./RequestDetailPanel.module.css";

type RequestDetailPanelProps = {
  request: AccessRequest | null;
  onClose: () => void;
  onDecision: (updatedRequest: AccessRequest) => void;
};

type ActionState =
  | { status: "idle" }
  | { status: "submitting"; action: DecisionAction }
  | { status: "success"; action: DecisionAction }
  | { status: "error"; action: DecisionAction; message: string };

const DECISION_LABELS: Record<DecisionAction, string> = {
  approve: "Approve",
  reject: "Reject",
};

const DECISION_PENDING_LABELS: Record<DecisionAction, string> = {
  approve: "Approving…",
  reject: "Rejecting…",
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

/** Detail panel shown when a user selects a request row. Read-only except for approve/reject actions. */
export function RequestDetailPanel({
  request,
  onClose,
  onDecision,
}: RequestDetailPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [actionState, setActionState] = useState<ActionState>({ status: "idle" });

  const requestId = request?.id ?? null;

  // Focus the close button whenever a new request is opened.
  useEffect(() => {
    if (requestId !== null) {
      closeButtonRef.current?.focus();
    }
  }, [requestId]);

  // Close on Escape while the panel is open.
  useEffect(() => {
    if (requestId === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [requestId, onClose]);

  if (request === null) return null;

  const isSubmitting = actionState.status === "submitting";

  async function handleDecisionClick(action: DecisionAction) {
    if (request === null) return;
    setActionState({ status: "submitting", action });
    const result = await submitDecision(request.id, action);
    if (result.ok) {
      setActionState({ status: "success", action });
      onDecision(result.request);
    } else {
      setActionState({ status: "error", action, message: result.error });
    }
  }


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

        {/* Approve/reject actions and decision feedback */}
        {(request.status === "pending" || actionState.status !== "idle") && (
          <section className={styles.section}>
            <h3 className={styles.sectionHeading}>Actions</h3>

            {request.status === "pending" && (
              <div className={styles.actions}>
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.approveButton}`}
                  onClick={() => handleDecisionClick("approve")}
                  disabled={isSubmitting}
                  aria-label="Approve request"
                >
                  {actionState.status === "submitting" && actionState.action === "approve"
                    ? DECISION_PENDING_LABELS.approve
                    : DECISION_LABELS.approve}
                </button>
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.rejectButton}`}
                  onClick={() => handleDecisionClick("reject")}
                  disabled={isSubmitting}
                  aria-label="Reject request"
                >
                  {actionState.status === "submitting" && actionState.action === "reject"
                    ? DECISION_PENDING_LABELS.reject
                    : DECISION_LABELS.reject}
                </button>
              </div>
            )}

            {actionState.status === "success" && (
              <p role="status" className={styles.successMessage}>
                Request {actionState.action === "approve" ? "approved" : "rejected"}.
              </p>
            )}

            {actionState.status === "error" && (
              <p role="alert" className={styles.errorMessage}>
                {actionState.message}
              </p>
            )}
          </section>
        )}
      </div>
    </aside>
  );
}
