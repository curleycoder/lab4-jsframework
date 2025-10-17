// /frontend/src/routes/expenses.list.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

export type Expense = { id: number; title: string; amount: number };

// Use "/api" if Vite proxy is configured
const API = "/api";

export default function ExpensesListPage() {
  const qc = useQueryClient();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const res = await fetch(`${API}/expenses`, { credentials: "include" });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
      }
      return (await res.json()) as { expenses: Expense[] };
    },
    staleTime: 5_000,
    retry: 1,
  });

  // --- NEW: optimistic delete mutation ---
  const deleteExpense = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/expenses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(
          `Delete failed (${res.status}): ${txt || res.statusText}`
        );
      }
      return id;
    },
    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: ["expenses"] });
      const previous = qc.getQueryData<{ expenses: Expense[] }>(["expenses"]);
      if (previous) {
        qc.setQueryData(["expenses"], {
          expenses: previous.expenses.filter((e) => e.id !== id),
        });
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(["expenses"], ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
  // ---------------------------------------

  if (isLoading) {
    return (
      <section className="mx-auto max-w-3xl p-6">
        <header className="mb-4">
          <h2 className="text-xl font-semibold">Expenses</h2>
        </header>

        <ul className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="animate-pulse rounded border bg-background p-3"
            >
              <div className="h-4 w-44 bg-slate-200 rounded" />
              <div className="mt-2 h-3 w-24 bg-slate-200 rounded" />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (isError)
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">
          Failed to fetch: {(error as Error).message}
        </p>
        <button
          className="mt-3 rounded border px-3 py-1"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          Retry
        </button>
      </div>
    );

  const items = data?.expenses ?? [];

  return (
    <section className="mx-auto max-w-3xl p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Expenses</h2>
        <button
          className="rounded border px-3 py-1 text-sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {items.length === 0 ? (
        <div className="rounded border bg-background p-6">
          <p className="text-sm text-muted-foreground">No expenses yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between rounded border bg-background text-foreground p-3 shadow-sm"
            >
              <div className="min-w-0">
                <Link
                  to="/expenses/$id"
                  params={{ id: String(e.id) }}
                  className="font-medium underline hover:text-primary"
                >
                  {e.title}
                </Link>
                <span className="ml-3 text-sm text-muted-foreground tabular-nums">
                  ${e.amount}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (confirm("Delete this expense?")) {
                      deleteExpense.mutate(e.id);
                    }
                  }}
                  disabled={deleteExpense.isPending}
                  className="text-red-600 underline text-sm disabled:opacity-50"
                >
                  {deleteExpense.isPending ? "Removing…" : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
