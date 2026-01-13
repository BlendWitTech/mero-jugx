import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/users.entity';

@Injectable()
export class SystemAdminGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user is system admin
    const dbUser = await this.userRepository.findOne({
      where: { id: user.userId },
      select: ['id', 'is_system_admin', 'system_admin_role'],
    });

    if (!dbUser || !dbUser.is_system_admin) {
      throw new ForbiddenException('System administrator access required');
    }

    // Attach system admin info to request for use in controllers
    request.systemAdmin = {
      isSystemAdmin: true,
      role: dbUser.system_admin_role,
    };

    return true;
  }
}

