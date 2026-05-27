import type { AccessRequest } from "../types";
import { RequestsTable } from "./RequestsTable";
import styles from "./RequestsDashboard.module.css";

type RequestsDashboardProps = {
  requests: readonly AccessRequest[];
};

export function RequestsDashboard({ requests }: RequestsDashboardProps) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>API Access Requests</h1>
        <p className={styles.description}>
          Review current requests across teams and environments.
        </p>
      </header>

      <section className={styles.summary} aria-label="Request summary">
        <p className={styles.summaryLabel}>Total requests</p>
        <p className={styles.summaryValue}>{requests.length}</p>
      </section>

      <section className={styles.tableCard} aria-label="Access request table">
        <RequestsTable requests={requests} />
      </section>
    </main>
  );
}
