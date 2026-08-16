import * as dotenv from 'dotenv';
import * as path from 'path';

// Load the .env file from the http app directory
dotenv.config({ path: path.join(__dirname, '../../../apps/http/.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_AVATARS = [
  { name: "Red Hero", imageUrl: "procedural:red" },
  { name: "Blue Mage", imageUrl: "procedural:blue" },
  { name: "Green Rogue", imageUrl: "procedural:green" },
  { name: "Yellow Knight", imageUrl: "procedural:yellow" },
  { name: "Purple Ninja", imageUrl: "procedural:purple" },
  { name: "Orange Monk", imageUrl: "procedural:orange" },
  { name: "Pink Bard", imageUrl: "procedural:pink" },
  { name: "Cyan Cleric", imageUrl: "procedural:cyan" },
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
