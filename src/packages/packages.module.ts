import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackagesController, OrganizationPackagesController } from './packages.controller';
import { PackagesService } from './packages.service';
import { Package } from '../database/entities/package.entity';
import { PackageFeature } from '../database/entities/package-feature.entity';
import { OrganizationPackageFeature } from '../database/entities/organization-package-feature.entity';
import { Organization } from '../database/entities/organization.entity';
import { OrganizationMember } from '../database/entities/organization-member.entity';
import { Role } from '../database/entities/role.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Package,
      PackageFeature,
      OrganizationPackageFeature,
      Organization,
      OrganizationMember,
      Role,
    ]),
    CommonModule,
  ],
  controllers: [PackagesController, OrganizationPackagesController],
  providers: [PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {}

