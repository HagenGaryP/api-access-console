import { AccessStatus, Environment } from "../types";
import styles from "./RequestsToolbar.module.css";

export type SortOrder = "newest" | "oldest";

type RequestsToolbarProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: AccessStatus | "";
  onStatusChange: (status: AccessStatus | "") => void;
  environmentFilter: Environment | "";
  onEnvironmentChange: (env: Environment | "") => void;
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
};

export function RequestsToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  environmentFilter,
  onEnvironmentChange,
  sortOrder,
  onSortChange,
}: RequestsToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={`${styles.control} ${styles.controlSearch}`}>
        <label htmlFor="search-query" className={styles.label}>
          Search
        </label>
        <input
          type="search"
          id="search-query"
          className={styles.input}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Name, email, team, or API…"
        />
      </div>

      <div className={styles.control}>
        <label htmlFor="status-filter" className={styles.label}>
          Status
        </label>
        <select
          id="status-filter"
          className={styles.select}
          value={statusFilter}
          onChange={(e) => {
            const value = e.target.value;
            onStatusChange(value === "" ? "" : (value as AccessStatus));
          }}
        >
          <option value="">All statuses</option>
          <option value={AccessStatus.pending}>Pending</option>
          <option value={AccessStatus.approved}>Approved</option>
          <option value={AccessStatus.rejected}>Rejected</option>
        </select>
      </div>

      <div className={styles.control}>
        <label htmlFor="env-filter" className={styles.label}>
          Environment
        </label>
        <select
          id="env-filter"
          className={styles.select}
          value={environmentFilter}
          onChange={(e) => {
            const value = e.target.value;
            onEnvironmentChange(value === "" ? "" : (value as Environment));
          }}
        >
          <option value="">All environments</option>
          <option value={Environment.development}>Development</option>
          <option value={Environment.staging}>Staging</option>
          <option value={Environment.production}>Production</option>
        </select>
      </div>

      <div className={styles.control}>
        <label htmlFor="sort-order" className={styles.label}>
          Sort
        </label>
        <select
          id="sort-order"
          className={styles.select}
          value={sortOrder}
          onChange={(e) => {
            const value = e.target.value;
            onSortChange(value === "oldest" ? "oldest" : "newest");
          }}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>
    </div>
  );
}
