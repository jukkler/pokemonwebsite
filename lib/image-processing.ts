/**
 * Bildverarbeitungs-Utilities für Avatar-Uploads
 * Verwendet sharp für serverseitiges Image Processing
 */

import sharp from 'sharp';

/**
 * Crop-Koordinaten für Bildausschnitt
 * Koordinaten sind in Pixeln des Originalbildes
 */
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Konstanten für Avatar-Verarbeitung
 */
const AVATAR_SIZE = 512; // 512x512px
const OUTPUT_FORMAT = 'webp';
const OUTPUT_QUALITY = 85; // WebP Qualität (0-100)

/**
 * Verarbeitet ein Avatar-Bild: Crop, Resize und WebP-Konvertierung
 *
 * @param buffer - Original-Bilddaten als Buffer
 * @param cropArea - Optional: Crop-Koordinaten vom Client
 * @returns Verarbeitetes Bild als Buffer (WebP, 512x512px)
 * @throws Error bei ungültigen Crop-Koordinaten oder Verarbeitungsfehlern
 */
export async function processAvatar(
  buffer: Buffer,
  cropArea?: CropArea
): Promise<Buffer> {
  try {
    // Sharp-Pipeline starten
    let pipeline = sharp(buffer);

    // Wenn Crop-Koordinaten vorhanden: Validieren und anwenden
    if (cropArea) {
      // Validierung
      if (
        cropArea.x < 0 ||
        cropArea.y < 0 ||
        cropArea.width <= 0 ||
        cropArea.height <= 0
      ) {
        throw new Error('Invalid crop coordinates: values must be positive');
      }

      // Crop extrahieren
      pipeline = pipeline.extract({
        left: Math.round(cropArea.x),
        top: Math.round(cropArea.y),
        width: Math.round(cropArea.width),
        height: Math.round(cropArea.height),
      });
    }

    // Resize auf 512x512px
    // fit: 'cover' = Bild füllt gesamten Bereich, wird gecroppt wenn nötig
    // position: 'center' = Bei Auto-Crop wird Bild zentriert
    pipeline = pipeline.resize(AVATAR_SIZE, AVATAR_SIZE, {
      fit: 'cover',
      position: 'centre',
    });

    // WebP-Konvertierung mit Qualität 85
    pipeline = pipeline.webp({
      quality: OUTPUT_QUALITY,
      effort: 4, // Kompression-Aufwand (0-6, höher = kleinere Datei, langsamer)
    });

    // Pipeline ausführen und Buffer zurückgeben
    const processedBuffer = await pipeline.toBuffer();

    return processedBuffer;
  } catch (error) {
    // Fehlerbehandlung
    if (error instanceof Error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
    throw new Error('Image processing failed: Unknown error');
  }
}
