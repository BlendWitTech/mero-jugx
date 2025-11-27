import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { initializeDatabase } from './database/init-database';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Initialize database (run migrations and seeds if needed)
  // Only runs if AUTO_INIT_DB is set to 'true' in .env
  // Run asynchronously to not block server startup
  if (configService.get<string>('AUTO_INIT_DB', 'false') === 'true') {
    // Run initialization in background to not block server startup
    initializeDatabase().catch((error) => {
      console.error('⚠️  Database auto-initialization failed:', error?.message || error);
      console.error('⚠️  You may need to run migrations and seeds manually:');
      console.error('   npm run migration:run');
      console.error('   npm run seed:run');
      console.error('   or');
      console.error('   npm run db:reset\n');
    });
  }

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

  // Global exception filter to catch all errors
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global guards
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // CORS configuration
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3001'),
    credentials: true,
  });

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Mero Jugx API')
    .setDescription('Organization-based authentication and user management system API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('organizations', 'Organization management')
    .addTag('users', 'User management')
    .addTag('invitations', 'Invitation system')
    .addTag('roles', 'Role management')
    .addTag('permissions', 'Permission management')
    .addTag('packages', 'Package management')
    .addTag('mfa', 'Multi-factor authentication')
    .addTag('notifications', 'Notifications')
    .addTag('audit-logs', 'Audit logs')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
