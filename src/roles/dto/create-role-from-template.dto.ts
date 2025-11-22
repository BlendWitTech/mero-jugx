import { IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateRoleFromTemplateDto {
  @IsNumber()
  template_id: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  additional_permission_ids?: number[];

  // If provided, these permissions will completely replace template permissions
  // This allows organizations to fully customize permissions for their custom roles
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  custom_permission_ids?: number[];
}
