const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

if (!process.env.MONGO_URL) {
  throw new Error('MONGO_URL must be set before running the seed script.');
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.MONGO_URL },
  },
});

async function main() {
  console.log("Seeding avatars to the database...");
  
  // Clear old avatars to prevent duplicates
  await prisma.avatar.deleteMany({});
  
  const avatars = [
    { name: "Male Warrior", imageUrl: "procedural:male_1" },
    { name: "Male Rogue", imageUrl: "procedural:male_2" },
    { name: "Male Mage", imageUrl: "procedural:male_3" },
    { name: "Male Cleric", imageUrl: "procedural:male_4" },
    { name: "Male Ranger", imageUrl: "procedural:male_5" },
    { name: "Female Knight", imageUrl: "procedural:female_1" },
    { name: "Female Assassin", imageUrl: "procedural:female_2" },
    { name: "Female Sorceress", imageUrl: "procedural:female_3" },
    { name: "Female Priestess", imageUrl: "procedural:female_4" },
    { name: "Female Archer", imageUrl: "procedural:female_5" },
  ];

  for (const avatar of avatars) {
    await prisma.avatar.create({ data: avatar });
    console.log(`Created avatar: ${avatar.name}`);
  }
  
  console.log("All avatars created successfully! You can refresh your frontend now.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
