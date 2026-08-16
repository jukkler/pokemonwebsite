import { NextResponse } from 'next/server';
import { withAdminAuthAndErrorHandling } from '@/lib/api-utils';
import { getEncounterLinkAudit } from '@/lib/encounter-link-admin.server';

export async function GET() {
  return withAdminAuthAndErrorHandling(async () => {
    const report = await getEncounterLinkAudit();
    return NextResponse.json(report, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }, 'auditing encounter links');
}
