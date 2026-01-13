import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { CrmAppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '@src/auth/guards/jwt-auth.guard';
import helmet from 'helmet';

async function bootstrap() {
    const app = await NestFactory.create(CrmAppModule);
    const configService = app.get(ConfigService);

    // Security
    app.use(helmet());

    // CORS
    const frontendUrl = configService.get<string>('CRM_FRONTEND_URL', 'http://localhost:3004');
    app.enableCors({
        origin: [frontendUrl],
        credentials: true,
    });

    // Global prefix
    const apiPrefix = configService.get<string>('API_PREFIX', 'api');
    const apiVersion = configService.get<string>('API_VERSION', 'v1');
    app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Global JWT guard
    const reflector = app.get(Reflector);
    app.useGlobalGuards(new JwtAuthGuard(reflector));

    // Swagger documentation
    if (configService.get<string>('NODE_ENV') !== 'production') {
        const config = new DocumentBuilder()
            .setTitle('Mero CRM API')
            .setDescription('CRM API for Mero Jugx Platform')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api-docs', app, document);
    }

    const port = configService.get<number>('CRM_PORT', 3005);
    await app.listen(port);
    console.log(`🚀 Mero CRM API is running on: http://localhost:${port}/${apiPrefix}/${apiVersion}`);
}

bootstrap();
