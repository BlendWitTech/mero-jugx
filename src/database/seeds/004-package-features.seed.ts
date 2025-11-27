import { DataSource } from 'typeorm';
import { PackageFeature, PackageFeatureType } from '../entities/package-feature.entity';

export async function seedPackageFeatures(dataSource: DataSource): Promise<void> {
  const featureRepository = dataSource.getRepository(PackageFeature);

  const features = [
    {
      name: '500 Users',
      slug: '500-users',
      type: PackageFeatureType.USER_UPGRADE,
      value: 500,
      price: 49.99,
      description: 'Upgrade to 500 maximum users',
      is_active: true,
    },
    {
      name: 'Unlimited Users',
      slug: 'unlimited-users',
      type: PackageFeatureType.USER_UPGRADE,
      value: null, // null = unlimited
      price: 99.99,
      description: 'Upgrade to unlimited users',
      is_active: true,
    },
    {
      name: 'Unlimited Roles',
      slug: 'unlimited-roles',
      type: PackageFeatureType.ROLE_UPGRADE,
      value: null, // null = unlimited
      price: 29.99,
      description: 'Upgrade to unlimited roles',
      is_active: true,
    },
    {
      name: 'Chat System',
      slug: 'chat-system',
      type: PackageFeatureType.SUPPORT,
      value: null, // null = unlimited
      price: 49.99,
      description: 'Enable team chat, group messaging, audio and video calls',
      is_active: true,
    },
  ];

  for (const feature of features) {
    const existingFeature = await featureRepository.findOne({
      where: { slug: feature.slug },
    });

    if (!existingFeature) {
      await featureRepository.save(featureRepository.create(feature));
      console.log(`✓ Seeded package feature: ${feature.name}`);
    } else {
      console.log(`- Package feature already exists: ${feature.name}`);
    }
  }
}
