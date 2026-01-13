import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/organization/register', () => {
    it('should register a new organization with new user', () => {
      return request(app.getHttpServer())
        .post('/auth/organization/register')
        .send({
          name: 'Test Organization',
          email: 'org@test.com',
          owner_email: 'owner@test.com',
          owner_password: 'TestPassword123!',
          owner_first_name: 'Test',
          owner_last_name: 'Owner',
          is_existing_user: false,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('organization_id');
          expect(res.body).toHaveProperty('user_id');
        });
    });

    it('should fail with duplicate organization name', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/organization/register')
        .send({
          name: 'Duplicate Org',
          email: 'dup1@test.com',
          owner_email: 'owner1@test.com',
          owner_password: 'TestPassword123!',
          owner_first_name: 'Test',
          owner_last_name: 'Owner',
        });

      // Second registration with same name
      return request(app.getHttpServer())
        .post('/auth/organization/register')
        .send({
          name: 'Duplicate Org',
          email: 'dup2@test.com',
          owner_email: 'owner2@test.com',
          owner_password: 'TestPassword123!',
          owner_first_name: 'Test',
          owner_last_name: 'Owner',
        })
        .expect(409);
    });
  });

  describe('POST /auth/login', () => {
    it('should fail with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login?organization_id=test-org-id')
        .send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should require organization_id', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@test.com',
          password: 'password',
        })
        .expect(400);
    });
  });
});

