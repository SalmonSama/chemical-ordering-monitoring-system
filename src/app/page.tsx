import { redirect } from "next/navigation";

// Root page — redirect all visitors to the main dashboard.
// The middleware will handle unauthenticated redirects to /login.
export default function RootPage() {
  redirect("/dashboard");
}
