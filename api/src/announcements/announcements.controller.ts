import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@src/common/decorators/public.decorator';

@ApiTags('announcements')
@Controller('announcements')
export class AnnouncementsController {
    constructor() { }

    @Public()
    @Get('active')
    @ApiOperation({ summary: 'Get active announcements' })
    @ApiResponse({ status: 200, description: 'Return all active announcements' })
    async getActiveAnnouncements() {
        return {
            success: true,
            announcements: []
        };
    }
}
