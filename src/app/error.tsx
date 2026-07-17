"use client";

import { useEffect } from "react";
import styles from "./error.module.css";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Route-level error boundary. Logs the underlying error for debugging but
 * only ever shows a generic recovery message in the UI.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div role="alert">
          <h1 className={styles.title}>Something went wrong</h1>
          <p className={styles.description}>
            We ran into a problem loading this page. You can try again, and if
            the issue continues, come back a little later.
          </p>
        </div>
        <button type="button" className={styles.retryButton} onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
