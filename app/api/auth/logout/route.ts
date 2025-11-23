/**
 * POST /api/auth/logout
 * Admin-Logout Endpoint
 */

import { logoutAdmin } from '@/lib/auth';
import { withErrorHandling, success } from '@/lib/api-utils';

export async function POST() {
  return withErrorHandling(async () => {
    await logoutAdmin();
    return success({ message: 'Logout erfolgreich' });
  }, 'logout');
}

