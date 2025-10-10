// /frontend/src/routes/expenses.detail.tsx
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";

type Expense = { id: number; title: string; amount: number };
const API = "http://localhost:3000/api"; // or '/api' if you use a proxy

export default function ExpenseDetailPage() {
  const { id } = useParams({ from: "/expenses/$id" });
  const expenseId = Number(id);
  if (Number.isNaN(expenseId)) {
    return <p className="p-6 text-sm text-red-600">Invalid id</p>;
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["expenses"], // reuse the list cache
    queryFn: async () => {
      const res = await fetch(`${API}/expenses`);
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
      }
      return (await res.json()) as { expenses: Expense[] };
    },
    staleTime: 5_000,
  });

  if (isLoading)
    return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
  if (isError)
    return (
      <p className="p-6 text-sm text-red-600">{(error as Error).message}</p>
    );

  const item = data?.expenses.find((e) => e.id === expenseId);
  if (!item)
    return (
      <p className="p-6 text-sm text-muted-foreground">Expense not found.</p>
    );

  return (
    <section className="mx-auto max-w-3xl p-6">
      <div className="rounded border bg-background text-foreground p-6">
        <h2 className="text-xl font-semibold">{item.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Amount</p>
        <p className="text-lg tabular-nums">${item.amount}</p>
      </div>
    </section>
  );
}
