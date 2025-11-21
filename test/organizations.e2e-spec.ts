import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Organizations (e2e)', () => {
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
        name: 'Test Organization',
        email: 'testorg@test.com',
        owner_email: 'owner@test.com',
        owner_password: 'TestPassword123!',
        owner_first_name: 'Test',
        owner_last_name: 'Owner',
      });

    organizationId = registerResponse.body.organization_id;

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post(`/auth/login?organization_id=${organizationId}`)
      .send({
        email: 'owner@test.com',
        password: 'TestPassword123!',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /organizations/me', () => {
    it('should get current organization', () => {
      return request(app.getHttpServer())
        .get('/organizations/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name');
          expect(res.body.name).toBe('Test Organization');
        });
    });
  });

  describe('PUT /organizations/me', () => {
    it('should update organization', () => {
      return request(app.getHttpServer())
        .put('/organizations/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Organization Name',
          phone: '+1234567890',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name');
          expect(res.body.name).toBe('Updated Organization Name');
        });
    });
  });

  describe('PUT /organizations/me/settings', () => {
    it('should update organization settings', () => {
      return request(app.getHttpServer())
        .put('/organizations/me/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mfa_enabled: true,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('mfa_enabled');
          expect(res.body.mfa_enabled).toBe(true);
        });
    });
  });
});

