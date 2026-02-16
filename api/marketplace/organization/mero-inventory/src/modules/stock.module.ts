import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from '../entities/stock.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { StockService } from '../services/stock.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Stock, StockMovement]),
    ],
    providers: [StockService],
    exports: [StockService],
})
export class StockModule { }
