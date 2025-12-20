import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';
import { Board } from '../database/entities/boards.entity';
import { Project } from '../database/entities/projects.entity';
import { Epic } from '../database/entities/epics.entity';
import { Task } from '../database/entities/tasks.entity';
import { Ticket } from '../database/entities/tickets.entity';
import { OrganizationMember } from '../database/entities/organization_members.entity';
import { UserAppAccess } from '../database/entities/user_app_access.entity';
import { App } from '../database/entities/apps.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Board,
      Project,
      Epic,
      Task,
      Ticket,
      OrganizationMember,
      UserAppAccess,
      App,
    ]),
  ],
  controllers: [BoardsController],
  providers: [BoardsService],
  exports: [BoardsService],
})
export class BoardsModule {}

