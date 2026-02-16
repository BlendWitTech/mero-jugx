import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCommentDto {
    @ApiProperty({ example: 'This is a comment' })
    @IsString()
    @IsNotEmpty()
    body: string;

    @ApiProperty({ example: 'parent-comment-id', required: false })
    @IsOptional()
    @IsUUID()
    parent_comment_id?: string;
}
