import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleDto {
  @ApiProperty({ description: 'Role ID to assign' })
  @IsInt()
  @IsNotEmpty()
  role_id: number;
}
