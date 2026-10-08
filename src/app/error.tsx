"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="empty">
      <h1>We couldn’t load this page</h1>
      <p role="alert">
        The connection or database request failed. Your existing data is
        unchanged.
      </p>
      <button onClick={reset}>Try again</button>
    </section>
  );
}
