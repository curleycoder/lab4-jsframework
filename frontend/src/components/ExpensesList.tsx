import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Expense = {
  id: number;
  title: string;
  amount: number;
  fileUrl: string | null;
};

export default function ExpensesList() {
  const qc = useQueryClient();

  // fetch all expenses
  const { data, isLoading, isError } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const res = await fetch("/api/expenses", { credentials: "include" });
      if (!res.ok) throw new Error("Could not load expenses");
      return (await res.json()) as { expenses: Expense[] };
    },
  });

  // optimistic delete mutation
  const deleteExpense = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete expense");
      return id;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["expenses"] });
      const prev = qc.getQueryData<{ expenses: Expense[] }>(["expenses"]);
      if (prev) {
        qc.setQueryData(["expenses"], {
          expenses: prev.expenses.filter((e) => e.id !== id),
        });
      }
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["expenses"], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  if (isLoading) return <p>Loading…</p>;
  if (isError) return <p>Error loading expenses.</p>;

  const items = data?.expenses ?? [];

  if (items.length === 0) {
    return <p>No expenses yet.</p>;
  }

  return (
    <ul className="mt-4 space-y-2">
      {items.map((expense) => (
        <li
          key={expense.id}
          className="flex items-center justify-between rounded border p-2"
        >
          <div>
            <p className="font-medium">{expense.title}</p>
            <p className="text-sm text-gray-500">${expense.amount}</p>
          </div>

          <div className="flex items-center gap-3">
            {expense.fileUrl && (
              <a
                href={expense.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline text-sm"
              >
                Download
              </a>
            )}
            <button
              onClick={() => deleteExpense.mutate(expense.id)}
              disabled={deleteExpense.isPending}
              className="text-red-600 underline text-sm disabled:opacity-50"
            >
              {deleteExpense.isPending ? "Removing…" : "Delete"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
