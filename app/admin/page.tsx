export const dynamic = 'force-dynamic';
export const revalidate = 0;

import AdminOperationsDashboard from '@/components/admin/AdminOperationsDashboard';
import { getAdminDashboardData } from './dashboard-data';

export default async function AdminDashboard() {
  const data = await getAdminDashboardData();

  return <AdminOperationsDashboard data={data} />;
}

