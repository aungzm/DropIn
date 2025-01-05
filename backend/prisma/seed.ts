import { PrismaClient} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Define admin credentials
  const adminUsername = 'admin';
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin'; // In production, use a strong password

  // Hash the password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Check if an admin user already exists and not seed if it does
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'admin' },
  });

  if (!existingAdmin) {
    // Create the admin user
    await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      },
    });
    console.log('Admin user created successfully.');
  } else {
    console.log('Admin user already exists. Skipping creation.');
  }
}

main()
  .catch((e) => {
    console.error('Error seeding the database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
});