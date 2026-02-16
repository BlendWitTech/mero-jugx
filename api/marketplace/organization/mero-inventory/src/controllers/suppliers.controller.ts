import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { SuppliersService } from '../services/suppliers.service';
import { JwtAuthGuard } from '../../../../../src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../../../src/common/guards/permissions.guard';
import { AppAccessGuard } from '../../../../../src/common/guards/app-access.guard';
import { AppSlug } from '../../../../../src/common/decorators/app-slug.decorator';

@Controller('inventory/suppliers')
@UseGuards(JwtAuthGuard, AppAccessGuard, PermissionsGuard)
@AppSlug('mero-inventory')
export class SuppliersController {
    constructor(private readonly suppliersService: SuppliersService) { }

    @Post()
    create(@Request() req, @Body() body: any) {
        return this.suppliersService.create(req.organization.id, body);
    }

    @Get()
    findAll(@Request() req) {
        return this.suppliersService.findAll(req.organization.id);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.suppliersService.findOne(req.organization.id, id);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() body: any) {
        return this.suppliersService.update(req.organization.id, id, body);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.suppliersService.remove(req.organization.id, id);
    }
}
