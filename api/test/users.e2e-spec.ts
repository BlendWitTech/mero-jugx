import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let organizationId: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Register organization and get token
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/organization/register')
      .send({
        name: 'Test Org for Users',
        email: 'testorg@test.com',
        owner_email: 'testuser@test.com',
        owner_password: 'TestPassword123!',
        owner_first_name: 'Test',
        owner_last_name: 'User',
      });

    organizationId = registerResponse.body.organization_id;
    userId = registerResponse.body.user_id;

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post(`/auth/login?organization_id=${organizationId}`)
      .send({
        email: 'testuser@test.com',
        password: 'TestPassword123!',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users/me', () => {
    it('should get current user profile', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body.email).toBe('testuser@test.com');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });
  });

  describe('GET /users', () => {
    it('should list organization users', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('users');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.users)).toBe(true);
        });
    });
  });
});

