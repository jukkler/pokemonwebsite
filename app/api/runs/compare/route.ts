import { NextRequest, NextResponse } from 'next/server';
import {
  createRunComparison,
  parseRunComparisonRequest,
} from '@/lib/run-comparison';
import { loadRunComparisonSides } from '@/lib/run-comparison-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const parsed = parseRunComparisonRequest(
      request.nextUrl.searchParams.get('left'),
      request.nextUrl.searchParams.get('right')
    );

    if (!parsed.ok) {
      const error = parsed.reason === 'same-run'
        ? 'Bitte zwei unterschiedliche Runs auswählen'
        : parsed.reason === 'missing'
          ? 'left und right sind erforderlich'
          : 'left und right müssen positive Run-IDs sein';
      return NextResponse.json({ error }, { status: 400 });
    }

    const sides = await loadRunComparisonSides(parsed.leftId, parsed.rightId);
    if (!sides) {
      return NextResponse.json(
        { error: 'Mindestens einer der Runs wurde nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(createRunComparison(sides.left, sides.right), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Error comparing runs:', error);
    return NextResponse.json(
      { error: 'Fehler beim Vergleichen der Runs' },
      { status: 500 }
    );
  }
}
