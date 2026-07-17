import styles from "./loading.module.css";

/**
 * Route-level loading state shown by Next.js while the requests dashboard's
 * server data is being fetched. Mirrors the dashboard's layout (heading,
 * toolbar, summary, and request rows) as a skeleton so the page doesn't
 * jump when real content arrives.
 */
export default function Loading() {
  return (
    <main className={styles.page} aria-busy="true">
      <span className={styles.visuallyHidden} role="status">
        Loading access requests&hellip;
      </span>

      <div aria-hidden="true">
        <div className={styles.header}>
          <div className={`${styles.skeleton} ${styles.title}`} />
          <div className={`${styles.skeleton} ${styles.description}`} />
        </div>

        <div className={styles.toolbar}>
          <div
            className={`${styles.skeleton} ${styles.toolbarControl} ${styles.toolbarControlSearch}`}
          />
          <div
            className={`${styles.skeleton} ${styles.toolbarControl} ${styles.toolbarControlSelect}`}
          />
          <div
            className={`${styles.skeleton} ${styles.toolbarControl} ${styles.toolbarControlSelect}`}
          />
          <div
            className={`${styles.skeleton} ${styles.toolbarControl} ${styles.toolbarControlSelect}`}
          />
        </div>

        <div className={styles.summary}>
          <div className={`${styles.skeleton} ${styles.summaryLabel}`} />
          <div className={`${styles.skeleton} ${styles.summaryValue}`} />
        </div>

        <div className={styles.tableCard}>
          <div className={styles.desktopRows}>
            {Array.from({ length: 5 }).map((_, index) => (
              <div className={styles.row} key={index}>
                <div
                  className={`${styles.skeleton} ${styles.rowCell} ${styles.rowCellRequester}`}
                />
                <div
                  className={`${styles.skeleton} ${styles.rowCell} ${styles.rowCellTeam}`}
                />
                <div
                  className={`${styles.skeleton} ${styles.rowCell} ${styles.rowCellApi}`}
                />
                <div
                  className={`${styles.skeleton} ${styles.rowCell} ${styles.rowCellDate}`}
                />
                <div
                  className={`${styles.skeleton} ${styles.rowCell} ${styles.rowCellStatus}`}
                />
              </div>
            ))}
          </div>

          <div className={styles.mobileCards}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div className={styles.mobileCard} key={index}>
                <div className={styles.mobileCardHeader}>
                  <div className={styles.mobileCardRequester}>
                    <div
                      className={`${styles.skeleton} ${styles.mobileCardName}`}
                    />
                    <div
                      className={`${styles.skeleton} ${styles.mobileCardEmail}`}
                    />
                  </div>
                  <div
                    className={`${styles.skeleton} ${styles.mobileCardStatus}`}
                  />
                </div>
                <div className={styles.mobileCardDetails}>
                  {Array.from({ length: 3 }).map((__, detailIndex) => (
                    <div
                      className={styles.mobileCardDetailRow}
                      key={detailIndex}
                    >
                      <div
                        className={`${styles.skeleton} ${styles.mobileCardDetailLabel}`}
                      />
                      <div
                        className={`${styles.skeleton} ${styles.mobileCardDetailValue}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
