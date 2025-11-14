/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Füge die fehlenden Spalten hinzu
    await prisma.$executeRaw`
      ALTER TABLE Encounter ADD COLUMN isNotCaught BOOLEAN DEFAULT 0;
    `;
    console.log('✓ isNotCaught Spalte hinzugefügt');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✓ isNotCaught Spalte existiert bereits');
    } else {
      console.error('Fehler bei isNotCaught:', error.message);
    }
  }

  try {
    await prisma.$executeRaw`
      ALTER TABLE Encounter ADD COLUMN notCaughtBy TEXT;
    `;
    console.log('✓ notCaughtBy Spalte hinzugefügt');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✓ notCaughtBy Spalte existiert bereits');
    } else {
      console.error('Fehler bei notCaughtBy:', error.message);
    }
  }

  try {
    await prisma.$executeRaw`
      ALTER TABLE Encounter ADD COLUMN notCaughtReason TEXT;
    `;
    console.log('✓ notCaughtReason Spalte hinzugefügt');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✓ notCaughtReason Spalte existiert bereits');
    } else {
      console.error('Fehler bei notCaughtReason:', error.message);
    }
  }

  try {
    await prisma.$executeRaw`
      ALTER TABLE Encounter ADD COLUMN notCaughtDate DATETIME;
    `;
    console.log('✓ notCaughtDate Spalte hinzugefügt');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✓ notCaughtDate Spalte existiert bereits');
    } else {
      console.error('Fehler bei notCaughtDate:', error.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

