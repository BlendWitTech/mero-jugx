import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@src/common/guards/permissions.guard';
import { Permissions } from '@src/common/decorators/permissions.decorator';
import { CurrentUser } from '@src/common/decorators/current-user.decorator';
import { ClientsService } from '../services/clients.service';
import { CreateClientDto, UpdateClientDto } from '../dto/client.dto';

@ApiTags('CRM - Clients')
@Controller('crm/clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ClientsController {
    constructor(private clientsService: ClientsService) { }

    @Post()
    @Permissions('crm.clients.create')
    @ApiOperation({ summary: 'Create a new client' })
    @ApiResponse({ status: 201, description: 'Client created successfully' })
    async create(
        @CurrentUser('userId') userId: string,
        @CurrentUser('organizationId') organizationId: string,
        @Body() createClientDto: CreateClientDto,
    ) {
        return this.clientsService.create(userId, organizationId, createClientDto);
    }

    @Get()
    @Permissions('crm.clients.view')
    @ApiOperation({ summary: 'Get all clients' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Clients retrieved successfully' })
    async findAll(
        @CurrentUser('organizationId') organizationId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('search') search?: string,
    ) {
        return this.clientsService.findAll(
            organizationId,
            page ? parseInt(String(page), 10) : 1,
            limit ? parseInt(String(limit), 10) : 10,
            search,
        );
    }

    @Get(':id')
    @Permissions('crm.clients.view')
    @ApiOperation({ summary: 'Get client by ID' })
    @ApiResponse({ status: 200, description: 'Client retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Client not found' })
    async findOne(
        @Param('id') id: string,
        @CurrentUser('organizationId') organizationId: string,
    ) {
        return this.clientsService.findOne(id, organizationId);
    }

    @Put(':id')
    @Permissions('crm.clients.edit')
    @ApiOperation({ summary: 'Update client' })
    @ApiResponse({ status: 200, description: 'Client updated successfully' })
    @ApiResponse({ status: 404, description: 'Client not found' })
    async update(
        @Param('id') id: string,
        @CurrentUser('organizationId') organizationId: string,
        @Body() updateClientDto: UpdateClientDto,
    ) {
        return this.clientsService.update(id, organizationId, updateClientDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Permissions('crm.clients.delete')
    @ApiOperation({ summary: 'Soft delete client' })
    @ApiResponse({ status: 204, description: 'Client deleted successfully' })
    @ApiResponse({ status: 404, description: 'Client not found' })
    async remove(
        @Param('id') id: string,
        @CurrentUser('organizationId') organizationId: string,
    ) {
        await this.clientsService.remove(id, organizationId);
    }

    @Post(':id/restore')
    @Permissions('crm.clients.edit')
    @ApiOperation({ summary: 'Restore soft-deleted client' })
    @ApiResponse({ status: 200, description: 'Client restored successfully' })
    async restore(
        @Param('id') id: string,
        @CurrentUser('organizationId') organizationId: string,
    ) {
        return this.clientsService.restore(id, organizationId);
    }
}
