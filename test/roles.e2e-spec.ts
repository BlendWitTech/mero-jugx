import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Roles (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let organizationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Register organization
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/organization/register')
      .send({
        name: 'Roles Test Org',
        email: 'rolesorg@test.com',
        owner_email: 'rolesowner@test.com',
        owner_password: 'TestPassword123!',
        owner_first_name: 'Roles',
        owner_last_name: 'Owner',
      });

    organizationId = registerResponse.body.organization_id;

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post(`/auth/login?organization_id=${organizationId}`)
      .send({
        email: 'rolesowner@test.com',
        password: 'TestPassword123!',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /roles', () => {
    it('should list organization roles', () => {
      return request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /roles/permissions', () => {
    it('should list all permissions', () => {
      return request(app.getHttpServer())
        .get('/roles/permissions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});

