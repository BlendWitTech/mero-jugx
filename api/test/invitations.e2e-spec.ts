import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Invitations (e2e)', () => {
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
        name: 'Invitation Test Org',
        email: 'invorg@test.com',
        owner_email: 'invowner@test.com',
        owner_password: 'TestPassword123!',
        owner_first_name: 'Invitation',
        owner_last_name: 'Owner',
      });

    organizationId = registerResponse.body.organization_id;

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post(`/auth/login?organization_id=${organizationId}`)
      .send({
        email: 'invowner@test.com',
        password: 'TestPassword123!',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /invitations', () => {
    it('should create invitation for new user', () => {
      return request(app.getHttpServer())
        .post('/invitations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newuser@test.com',
          role_id: 2, // Assuming Admin role ID is 2
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body.email).toBe('newuser@test.com');
        });
    });

    it('should fail with duplicate invitation', async () => {
      // Create first invitation
      await request(app.getHttpServer())
        .post('/invitations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'duplicate@test.com',
          role_id: 2,
        });

      // Try to create duplicate
      return request(app.getHttpServer())
        .post('/invitations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'duplicate@test.com',
          role_id: 2,
        })
        .expect(409);
    });
  });

  describe('GET /invitations', () => {
    it('should list invitations', () => {
      return request(app.getHttpServer())
        .get('/invitations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('invitations');
          expect(Array.isArray(res.body.invitations)).toBe(true);
        });
    });
  });
});

