import { ExpensesList } from "./components/ExpensesList";
import { AddExpenseForm } from "./components/AddExpenseForm";
import { ThemeToggle } from "./components/theme-toggle";

export default function App() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-3xl p-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Expenses App</h1>
          <nav className="flex items-center gap-4">
            <ThemeToggle />
          </nav>
        </header>
        <AddExpenseForm />
        <ExpensesList />
      </div>
    </main>
  );
}
