import { DataSource } from 'typeorm';
import { Package } from '../entities/package.entity';

export async function seedPackages(dataSource: DataSource): Promise<void> {
  const packageRepository = dataSource.getRepository(Package);

  const packages = [
    {
      name: 'Freemium',
      slug: 'freemium',
      description: 'Free tier with basic features',
      base_user_limit: 10,
      base_role_limit: 2,
      additional_role_limit: 0,
      price: 0.0,
      is_active: true,
      sort_order: 1,
    },
    {
      name: 'Basic',
      slug: 'basic',
      description: 'Basic package with additional features',
      base_user_limit: 25,
      base_role_limit: 2,
      additional_role_limit: 3,
      price: 29.99,
      is_active: true,
      sort_order: 2,
    },
    {
      name: 'Platinum',
      slug: 'platinum',
      description: 'Platinum package with advanced features',
      base_user_limit: 50,
      base_role_limit: 2,
      additional_role_limit: 5,
      price: 79.99,
      is_active: true,
      sort_order: 3,
    },
    {
      name: 'Diamond',
      slug: 'diamond',
      description: 'Diamond package with premium features',
      base_user_limit: 100,
      base_role_limit: 2,
      additional_role_limit: 8,
      price: 199.99,
      is_active: true,
      sort_order: 4,
    },
  ];

  for (const pkg of packages) {
    const existingPackage = await packageRepository.findOne({
      where: { slug: pkg.slug },
    });

    if (!existingPackage) {
      await packageRepository.save(packageRepository.create(pkg));
      console.log(`✓ Seeded package: ${pkg.name}`);
    } else {
      console.log(`- Package already exists: ${pkg.name}`);
    }
  }
}
