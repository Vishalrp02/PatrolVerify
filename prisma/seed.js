const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("guard123", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);

  // 1. Create an Admin user
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "System Administrator",
      username: "admin",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  console.log("✅ Created Admin User:", admin.username);

  // 2. Create a Guard with a FIXED ID so we can use it in the app
  const guard = await prisma.user.upsert({
    where: { id: "guard-123" },
    update: {},
    create: {
      id: "guard-123",
      name: "Officer John",
      username: "guard1",
      password: hashedPassword,
      role: "GUARD",
    },
  });

  console.log("✅ Created Guard User:", guard.username);

  // 3. Check if Test Site & Checkpoint exist (Optional but helpful)
  try {
    const existingSite = await prisma.site.findFirst();
    if (existingSite) {
      console.log("✅ Site already exists, skipping site creation");
    } else {
      const site = await prisma.site.create({
        data: {
          name: "Main HQ",
          checkpoints: {
            create: {
              id: "chk-1",
              name: "Main Entrance",
              latitude: 0, // Replace with real lat/long if you want
              longitude: 0,
            },
          },
        },
      });
      console.log("✅ Created Site & Checkpoint");
    }
  } catch (error) {
    console.log("⚠️ Site creation skipped (may already exist)");
  }

  // 3. Create default patrol routes
  try {
    // Get the checkpoint we just created
    const checkpoint = await prisma.checkpoint.findFirst();
    
    if (checkpoint) {
      // Create a default patrol route
      const defaultRoute = await prisma.patrolRoute.upsert({
        where: { name: "Default Patrol Route" },
        update: {},
        create: {
          name: "Default Patrol Route",
          isDefault: true,
          routeCheckpoints: {
            create: {
              checkpointId: checkpoint.id,
              order: 1
            }
          }
        },
        include: {
          routeCheckpoints: true
        }
      });

      console.log("✅ Created Default Patrol Route");
    }
  } catch (error) {
    console.log("⚠️ Route creation skipped (may already exist)");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
