// Stage 09
// Step 09
//
// Purpose: entry route for the admin dashboard — a distinct utility screen
// for staff, separate from the citizen-facing map (which has no landing
// page). AdminDashboard itself handles auth/role gating.

import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  return <AdminDashboard />;
}
