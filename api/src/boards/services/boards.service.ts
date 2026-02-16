import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from '../../database/entities/boards.entity';
import { CreateBoardDto, UpdateBoardDto } from '../dto/boards.dto';

@Injectable()
export class BoardsService {
    constructor(
        @InjectRepository(Board)
        private boardsRepository: Repository<Board>,
    ) { }

    async create(createBoardDto: CreateBoardDto, organizationId: string, userId: string): Promise<Board> {
        const board = this.boardsRepository.create({
            ...createBoardDto,
            project_id: createBoardDto.projectId,
            organization_id: organizationId,
            created_by: userId,
        });
        return this.boardsRepository.save(board);
    }

    async findAll(organizationId: string, projectId?: string): Promise<{ data: Board[]; meta: any }> {
        const where: any = { organization_id: organizationId };
        if (projectId) {
            where.project_id = projectId;
        }

        const boards = await this.boardsRepository.find({
            where,
            order: { created_at: 'DESC' },
        });

        return {
            data: boards,
            meta: { total: boards.length },
        };
    }

    async findOne(id: string, organizationId: string): Promise<Board> {
        const board = await this.boardsRepository.findOne({
            where: { id, organization_id: organizationId },
            relations: ['columns'],
        });

        if (!board) {
            throw new NotFoundException(`Board with ID ${id} not found`);
        }

        return board;
    }

    async update(id: string, updateBoardDto: UpdateBoardDto, organizationId: string): Promise<Board> {
        const board = await this.findOne(id, organizationId);
        Object.assign(board, updateBoardDto);
        return this.boardsRepository.save(board);
    }

    async remove(id: string, organizationId: string): Promise<void> {
        const result = await this.boardsRepository.delete({ id, organization_id: organizationId });
        if (result.affected === 0) {
            throw new NotFoundException(`Board with ID ${id} not found`);
        }
    }
}
