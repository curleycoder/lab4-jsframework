import * as React from "react";

type Props = {
  expenseId: number;
  onUpload?: () => void; // optional callback to refresh UI
};

export function UploadExpenseForm({ expenseId, onUpload }: Props) {
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setBusy(true);
    setErr(null);

    // safer Content-Type fallback
    const contentType = file.type || "application/octet-stream";

    try {
      // 1) Ask backend for signed URL
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ filename: file.name, type: contentType }),
      });
      if (!signRes.ok) throw new Error(`sign failed ${signRes.status}`);
      const { uploadUrl, key } = await signRes.json();

      // 2) PUT file directly to S3 (Content-Type must match what was signed)
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (!putRes.ok) throw new Error(`s3 put failed ${putRes.status}`);

      // 3) Tell backend which expense owns the file
      const updRes = await fetch(`/api/expenses/${expenseId}`, {
        method: "PATCH", // use PUT if your server uses PUT with updateExpenseSchema
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fileKey: key }), // server maps fileKey -> fileUrl
      });
      if (!updRes.ok) throw new Error(`update expense failed ${updRes.status}`);

      setFile(null);
      onUpload?.(); // e.g. invalidate query or reload
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-3">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button
        disabled={!file || busy}
        className="rounded bg-primary px-3 py-1 text-white"
      >
        {busy ? "Uploading…" : "Upload receipt"}
      </button>
      {err && <span className="text-red-600 text-sm">{err}</span>}
    </form>
  );
}
