import * as dotenv from 'dotenv';
import * as path from 'path';

// Load the .env file from the http app directory
dotenv.config({ path: path.join(__dirname, '../../../apps/http/.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_AVATARS = [
  { name: "Red Crewmate", imageUrl: "procedural:red" },
  { name: "Blue Crewmate", imageUrl: "procedural:blue" },
  { name: "Yellow Crewmate", imageUrl: "procedural:yellow" },
  { name: "Orange Crewmate", imageUrl: "procedural:orange" },
  { name: "Green Crewmate", imageUrl: "procedural:green" },
  { name: "Cyan Crewmate", imageUrl: "procedural:cyan" },
  { name: "Purple Crewmate", imageUrl: "procedural:purple" },
  { name: "Pink Crewmate", imageUrl: "procedural:pink" },
];

async function main() {
  console.log("Seeding avatars...");
  // Clear old duplicate/confusing avatars
  await prisma.avatar.deleteMany({});
  
  for (const avatar of DEFAULT_AVATARS) {
    await prisma.avatar.create({
      data: avatar
    });
    console.log(`Created avatar: ${avatar.name}`);
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
