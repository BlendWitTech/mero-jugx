import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5433),
      username: this.configService.get<string>('DB_USER', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'postgres'),
      database: this.configService.get<string>('DB_NAME', 'mero_jugx'),
      entities: [__dirname + '/../database/entities/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../database/migrations/**/*{.ts,.js}'],
      migrationsTableName: 'migrations',
      synchronize: false, // Always false when using migrations to avoid conflicts
      logging: this.configService.get<boolean>('DB_LOGGING', true),
      migrationsRun: false,
      autoLoadEntities: true,
    };
  }
}

