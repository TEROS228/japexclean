import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function migratePasswords() {
  console.log('Starting password migration...');

  try {
    // Получаем всех пользователей
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    console.log(`Found ${users.length} users to migrate`);

    for (const user of users) {
      // Проверяем, является ли пароль уже хешем bcrypt
      const isBcryptHash = user.password.startsWith('$2');

      if (isBcryptHash) {
        console.log(`✓ ${user.email} - already hashed, skipping`);
        continue;
      }

      // Хешируем plain text пароль
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Обновляем в базе
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      console.log(`✓ ${user.email} - migrated successfully`);
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migratePasswords();
