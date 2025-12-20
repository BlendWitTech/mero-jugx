import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddCommentDto {
  @IsNotEmpty()
  @IsString()
  body: string;

  @IsOptional()
  attachment_urls?: string[];
}

