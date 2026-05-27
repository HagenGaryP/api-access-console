import type { AccessStatus } from "../types";
import styles from "./StatusBadge.module.css";

type StatusBadgeProps = {
  status: AccessStatus;
};

const STATUS_LABELS: Record<AccessStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_CLASS_NAMES: Record<AccessStatus, string> = {
  pending: styles.pending,
  approved: styles.approved,
  rejected: styles.rejected,
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${STATUS_CLASS_NAMES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
