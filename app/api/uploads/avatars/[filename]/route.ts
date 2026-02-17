/**
 * API: Avatar-Dateien ausliefern
 * GET /api/uploads/avatars/[filename]
 *
 * Next.js standalone mode serviert keine zur Laufzeit hinzugefügten
 * Dateien aus public/. Diese Route liefert hochgeladene Avatare aus.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Sicherheit: path.basename entfernt Traversal-Versuche (auch URL-encoded)
  const safeName = path.basename(filename);
  if (!safeName || safeName !== filename) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
  const filepath = path.resolve(uploadDir, safeName);

  // Sicherheit: Aufgelöster Pfad muss innerhalb des Upload-Verzeichnisses liegen
  if (!filepath.startsWith(uploadDir)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  if (!existsSync(filepath)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    const buffer = await readFile(filepath);

    // Content-Type anhand der Dateiendung
    const ext = path.extname(filename).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.webp': 'image/webp',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
    };

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentTypes[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
