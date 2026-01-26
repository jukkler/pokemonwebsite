/**
 * API: Avatar-Upload
 * POST /api/admin/avatars/upload
 * Ermöglicht das Hochladen eigener Avatar-Bilder
 */

import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { withAdminAuth, success, badRequest, internalError } from '@/lib/api-utils';

// Maximale Dateigröße: 500KB
const MAX_FILE_SIZE = 500 * 1024;

// Erlaubte Dateitypen
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

export async function POST(request: NextRequest) {
  return withAdminAuth(async () => {
    try {
      const formData = await request.formData();
      const file = formData.get('avatar') as File | null;

      if (!file) {
        return badRequest('Keine Datei hochgeladen');
      }

      // Dateityp prüfen
      if (!ALLOWED_TYPES.includes(file.type)) {
        return badRequest('Ungültiger Dateityp. Erlaubt: PNG, JPEG, GIF, WebP');
      }

      // Dateigröße prüfen
      if (file.size > MAX_FILE_SIZE) {
        return badRequest('Datei zu groß. Maximum: 500KB');
      }

      // Upload-Verzeichnis erstellen falls nicht vorhanden
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Einzigartigen Dateinamen generieren
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filename = `avatar-${timestamp}-${randomStr}.${ext}`;

      // Datei speichern
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);

      // URL zurückgeben
      const url = `/uploads/avatars/${filename}`;

      return success({ url, filename });
    } catch (err) {
      console.error('Avatar upload error:', err);
      return internalError('Fehler beim Hochladen');
    }
  });
}

// Liste hochgeladene Avatare
export async function GET() {
  return withAdminAuth(async () => {
    try {
      const { readdir } = await import('fs/promises');
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');

      if (!existsSync(uploadDir)) {
        return success({ avatars: [] });
      }

      const files = await readdir(uploadDir);
      const avatars = files
        .filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f))
        .map(filename => ({
          filename,
          url: `/uploads/avatars/${filename}`,
        }));

      return success({ avatars });
    } catch (err) {
      console.error('Error listing avatars:', err);
      return internalError('Fehler beim Laden der Avatare');
    }
  });
}
