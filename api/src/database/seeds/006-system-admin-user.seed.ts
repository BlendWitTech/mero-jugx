import { DataSource } from 'typeorm';
import { User, UserStatus } from '../entities/users.entity';
import * as bcrypt from 'bcrypt';

export async function seedSystemAdminUser(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  // Default superadmin credentials (should be changed after first login)
  const superAdminEmail = 'superadmin@merojugx.com';
  const superAdminPassword = 'SuperAdmin@123'; // Default password - should be changed immediately
  const superAdminFirstName = 'Super';
  const superAdminLastName = 'Admin';

  // Check if superadmin already exists
  const existingAdmin = await userRepository.findOne({
    where: { email: superAdminEmail },
  });

  if (existingAdmin) {
    // Update existing admin to ensure is_system_admin flag is set
    if (!existingAdmin.is_system_admin || existingAdmin.system_admin_role !== 'super_admin') {
      existingAdmin.is_system_admin = true;
      existingAdmin.system_admin_role = 'super_admin';
      existingAdmin.email_verified = true;
      existingAdmin.status = UserStatus.ACTIVE;
      await userRepository.save(existingAdmin);
      console.log('✓ Updated existing user to superadmin');
    } else {
      console.log('- Superadmin user already exists');
    }
    return;
  }

  // Create superadmin user
  const passwordHash = await bcrypt.hash(superAdminPassword, 10);

  const superAdmin = userRepository.create({
    email: superAdminEmail,
    password_hash: passwordHash,
    first_name: superAdminFirstName,
    last_name: superAdminLastName,
    email_verified: true,
    email_verified_at: new Date(),
    status: UserStatus.ACTIVE,
    is_system_admin: true,
    system_admin_role: 'super_admin',
  });

  await userRepository.save(superAdmin);
  console.log('✓ Seeded superadmin user');
  console.log(`  Email: ${superAdminEmail}`);
  console.log(`  Password: ${superAdminPassword}`);
  console.log('  ⚠️  WARNING: Change the default password immediately after first login!');
}

