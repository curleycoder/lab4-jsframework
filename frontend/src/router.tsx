// router.tsx
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
} from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router"; // ✅ correct import
import App from "./App";
import ExpensesListPage from "./routes/expenses.list";
import ExpenseDetailPage from "./routes/expenses.detail";
import ExpenseNewPage from "./routes/expenses.new";

const rootRoute = createRootRoute({ component: () => <App /> });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <p>Home Page</p>,
});

const expensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/expenses",
  component: () => (
    <section>
      <Outlet /> {/* ✅ children render here */}
    </section>
  ),
});

// children under /expenses
const expensesIndexRoute = createRoute({
  getParentRoute: () => expensesRoute,
  path: "/",
  component: () => <ExpensesListPage />,
});

const expensesDetailRoute = createRoute({
  getParentRoute: () => expensesRoute,
  path: "$id",
  component: () => <ExpenseDetailPage />,
});

const expensesNewRoute = createRoute({
  getParentRoute: () => expensesRoute,
  path: "new", // ✅ no leading slash
  component: () => <ExpenseNewPage />,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  expensesRoute.addChildren([
    expensesIndexRoute,
    expensesDetailRoute,
    expensesNewRoute,
  ]),
]);

export const router = createRouter({ routeTree });
export function AppRouter() {
  return <RouterProvider router={router} />;
}
