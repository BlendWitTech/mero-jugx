import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { BoardsService } from '../services/boards.service';
import { CreateBoardDto, UpdateBoardDto } from '../dto/boards.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('boards')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BoardsController {
    constructor(private readonly boardsService: BoardsService) { }

    @Post()
    @Permissions('boards.create')
    create(@Body() createBoardDto: CreateBoardDto, @Request() req) {
        return this.boardsService.create(createBoardDto, req.user.organizationId, req.user.id);
    }

    @Get()
    @Permissions('boards.view')
    findAll(@Request() req, @Query('projectId') projectId?: string) {
        return this.boardsService.findAll(req.user.organizationId, projectId);
    }

    @Get(':id')
    @Permissions('boards.view')
    findOne(@Param('id') id: string, @Request() req) {
        return this.boardsService.findOne(id, req.user.organizationId);
    }

    @Patch(':id')
    @Permissions('boards.update')
    update(@Param('id') id: string, @Body() updateBoardDto: UpdateBoardDto, @Request() req) {
        return this.boardsService.update(id, updateBoardDto, req.user.organizationId);
    }

    @Delete(':id')
    @Permissions('boards.delete')
    remove(@Param('id') id: string, @Request() req) {
        return this.boardsService.remove(id, req.user.organizationId);
    }
}
