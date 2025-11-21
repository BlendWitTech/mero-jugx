import {
  Controller,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AssignRoleDto } from './dto/assign-role.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UserRolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Put(':id/role')
  @HttpCode(HttpStatus.OK)
  @Permissions('roles.assign')
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Role assigned successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User or role not found' })
  @ApiResponse({ status: 400, description: 'Cannot change organization owner role' })
  async assignRoleToUser(
    @CurrentUser() user: any,
    @Param('id') targetUserId: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.rolesService.assignRoleToUser(
      user.userId,
      user.organizationId,
      targetUserId,
      dto,
    );
  }
}


