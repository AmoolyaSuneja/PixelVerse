import * as dotenv from 'dotenv';
import * as path from 'path';

// Load the .env file from the http app directory
dotenv.config({ path: path.join(__dirname, '../../../apps/http/.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_AVATARS = [
  { name: "Pink Hero", imageUrl: "procedural:male_1" },
  { name: "White Mage", imageUrl: "procedural:male_2" },
  { name: "Gold Rogue", imageUrl: "procedural:male_3" },
  { name: "Orange Knight", imageUrl: "procedural:male_4" },
  { name: "Neon Monk", imageUrl: "procedural:male_5" },
  { name: "Cyan Cleric", imageUrl: "procedural:female_1" },
  { name: "Purple Bard", imageUrl: "procedural:female_2" },
  { name: "Deep Pink Ninja", imageUrl: "procedural:female_3" },
];

async function main() {
  console.log("Seeding avatars...");
  for (const avatar of DEFAULT_AVATARS) {
    const existing = await prisma.avatar.findFirst({
      where: { imageUrl: avatar.imageUrl }
    });
    if (!existing) {
      await prisma.avatar.create({
        data: avatar
      });
      console.log(`Created avatar: ${avatar.name}`);
    } else {
      console.log(`Avatar already exists: ${avatar.name}`);
    }
  }
  console.log("Done seeding.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
