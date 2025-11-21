import { IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateRoleFromTemplateDto {
  @IsNumber()
  template_id: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  additional_permission_ids?: number[];
}

