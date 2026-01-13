import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { initializeDatabase } from './database/init-database';
import helmet from 'helmet';

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

  // Prometheus metrics endpoint (no prefix, after global prefix setup)
  try {
    const { PrometheusService } = await import('./monitoring/prometheus.service');
    const prometheusService = app.get(PrometheusService);
    if (prometheusService) {
      const httpAdapter = app.getHttpAdapter();
      httpAdapter.get('/metrics', async (req, res) => {
        res.set('Content-Type', 'text/plain');
        res.send(await prometheusService.getMetrics());
      });
    }
  } catch (error) {
    console.warn('Prometheus metrics not available:', error);
  }

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

  // Global exception filter is registered via APP_FILTER in AppModule

  // Global guards
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS configuration
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // In development, allow multiple origins (localhost, IPs, and dev.merojugx.com)
  const allowedOrigins = nodeEnv === 'development'
    ? [
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://dev.merojugx.com:3001',
      'http://mero-crm.dev.merojugx.com:3001',
      /^http:\/\/.*\.dev\.merojugx\.com(:\d+)?$/, // Allow all subdomains on any port
      /^http:\/\/(\d+\.){3}\d+(:\d+)?$/, // Allow IP addresses on any port
    ]
    : [frontendUrl];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin matches any allowed origin
      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        if (typeof allowedOrigin === 'string') {
          return origin === allowedOrigin;
        }
        if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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
