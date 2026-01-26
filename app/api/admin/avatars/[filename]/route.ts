/**
 * API: Avatar löschen
 * DELETE /api/admin/avatars/[filename]
 */

import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { withAdminAuth, success, badRequest, notFound, internalError } from '@/lib/api-utils';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  return withAdminAuth(async () => {
    try {
      const { filename } = await params;

      // Sicherheitscheck: Keine Path-Traversal-Angriffe
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return badRequest('Ungültiger Dateiname');
      }

      const filepath = path.join(process.cwd(), 'public', 'uploads', 'avatars', filename);

      if (!existsSync(filepath)) {
        return notFound('Datei nicht gefunden');
      }

      await unlink(filepath);

      return success({ message: 'Avatar gelöscht' });
    } catch (err) {
      console.error('Error deleting avatar:', err);
      return internalError('Fehler beim Löschen');
    }
  });
}
