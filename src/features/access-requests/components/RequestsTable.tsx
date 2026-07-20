import type { AccessRequest } from "../types";
import { StatusBadge } from "./StatusBadge";
import styles from "./RequestsTable.module.css";

type RequestsTableProps = {
  requests: readonly AccessRequest[];
  selectedRequestId?: string | null;
  onSelectRequest?: (id: string, trigger: HTMLButtonElement) => void;
  /** Id of the currently rendered detail panel, for aria-controls on the selected row's button. */
  panelId?: string;
};

const submittedDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatSubmittedDate(submittedAt: string): string {
  const date = new Date(submittedAt);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }
  return submittedDateFormatter.format(date);
}

export function RequestsTable({
  requests,
  selectedRequestId,
  onSelectRequest,
  panelId,
}: RequestsTableProps) {
  return (
    <>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <caption className={styles.visuallyHidden}>
            API access requests by requester, team, API, environment, access level,
            submitted date, and status.
          </caption>
          <thead>
            <tr>
              <th scope="col">Requester</th>
              <th scope="col">Team</th>
              <th scope="col">API</th>
              <th scope="col">Environment</th>
              <th scope="col">Access</th>
              <th scope="col">Submitted</th>
              <th scope="col">Status</th>
              {onSelectRequest !== undefined && (
                <th scope="col" className={styles.visuallyHidden}>
                  Details
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr
                key={request.id}
                className={
                  request.id === selectedRequestId
                    ? styles.rowSelected
                    : undefined
                }
              >
                <td>
                  <div className={styles.requesterBlock}>
                    <span className={styles.requesterName}>
                      {request.requesterName}
                    </span>
                    <span className={styles.requesterEmail}>
                      {request.requesterEmail}
                    </span>
                  </div>
                </td>
                <td>{request.team}</td>
                <td>{request.apiName}</td>
                <td className={styles.capitalize}>{request.environment}</td>
                <td className={styles.capitalize}>{request.accessLevel}</td>
                <td>
                  <time dateTime={request.submittedAt}>
                    {formatSubmittedDate(request.submittedAt)}
                  </time>
                </td>
                <td>
                  <StatusBadge status={request.status} />
                </td>
                {onSelectRequest !== undefined && (
                  <td className={styles.actionCell}>
                    <button
                      type="button"
                      className={
                        request.id === selectedRequestId
                          ? `${styles.viewButton} ${styles.viewButtonActive}`
                          : styles.viewButton
                      }
                      onClick={(event) =>
                        onSelectRequest(request.id, event.currentTarget)
                      }
                      aria-label={`View details for ${request.requesterName}`}
                      aria-expanded={request.id === selectedRequestId}
                      aria-controls={
                        request.id === selectedRequestId ? panelId : undefined
                      }
                    >
                      View
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.mobileCards} aria-label="Access requests">
        {requests.map((request) => (
          <article
            key={request.id}
            className={
              request.id === selectedRequestId
                ? `${styles.mobileCard} ${styles.mobileCardSelected}`
                : styles.mobileCard
            }
          >
            <div className={styles.mobileCardHeader}>
              <div className={styles.requesterBlock}>
                <span className={styles.requesterName}>
                  {request.requesterName}
                </span>
                <span className={styles.requesterEmail}>
                  {request.requesterEmail}
                </span>
              </div>
              <StatusBadge status={request.status} />
            </div>

            <dl className={styles.mobileDetails}>
              <div className={styles.mobileDetailRow}>
                <dt>Team</dt>
                <dd>{request.team}</dd>
              </div>
              <div className={styles.mobileDetailRow}>
                <dt>API</dt>
                <dd>{request.apiName}</dd>
              </div>
              <div className={styles.mobileDetailRow}>
                <dt>Environment</dt>
                <dd className={styles.capitalize}>{request.environment}</dd>
              </div>
              <div className={styles.mobileDetailRow}>
                <dt>Access</dt>
                <dd className={styles.capitalize}>{request.accessLevel}</dd>
              </div>
              <div className={styles.mobileDetailRow}>
                <dt>Submitted</dt>
                <dd>
                  <time dateTime={request.submittedAt}>
                    {formatSubmittedDate(request.submittedAt)}
                  </time>
                </dd>
              </div>
            </dl>
            {onSelectRequest !== undefined && (
              <button
                type="button"
                className={styles.mobileViewButton}
                onClick={(event) =>
                  onSelectRequest(request.id, event.currentTarget)
                }
                aria-label={`View details for ${request.requesterName}`}
                aria-expanded={request.id === selectedRequestId}
                aria-controls={
                  request.id === selectedRequestId ? panelId : undefined
                }
              >
                View details
              </button>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
