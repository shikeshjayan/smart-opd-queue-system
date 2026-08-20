"use client";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <h1 className="text-2xl font-bold">Critical error</h1>
          <p className="text-ink-500">{error.message}</p>
        </div>
      </body>
    </html>
  );
}
