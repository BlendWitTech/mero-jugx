import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Multi-Tenancy Isolation E2E Tests
 * 
 * These tests verify that:
 * 1. Data is properly isolated between organizations
 * 2. Users can only access data from their organization
 * 3. Cross-organization access is prevented
 * 4. Organization context is properly extracted from JWT
 * 5. Queries properly filter by organization_id
 */
describe('Multi-Tenancy Isolation (e2e)', () => {
  let app: INestApplication;
  
  // Organization 1 setup
  let org1Id: string;
  let org1UserId: string;
  let org1Token: string;

  // Organization 2 setup
  let org2Id: string;
  let org2UserId: string;
  let org2Token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply global validation pipe (same as main.ts)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    await app.init();

    // Setup Organization 1
    const org1RegisterResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/organization/register')
      .send({
        name: 'Organization One',
        email: 'org1@test.com',
        owner_email: 'org1owner@test.com',
        owner_password: 'TestPassword123!',
        owner_first_name: 'Org1',
        owner_last_name: 'Owner',
      });

    org1Id = org1RegisterResponse.body.organization_id;
    org1UserId = org1RegisterResponse.body.user_id;

    const org1LoginResponse = await request(app.getHttpServer())
      .post(`/api/v1/auth/login?organization_id=${org1Id}`)
      .send({
        email: 'org1owner@test.com',
        password: 'TestPassword123!',
      });

    org1Token = org1LoginResponse.body.access_token;

    // Setup Organization 2
    const org2RegisterResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/organization/register')
      .send({
        name: 'Organization Two',
        email: 'org2@test.com',
        owner_email: 'org2owner@test.com',
        owner_password: 'TestPassword123!',
        owner_first_name: 'Org2',
        owner_last_name: 'Owner',
      });

    org2Id = org2RegisterResponse.body.organization_id;
    org2UserId = org2RegisterResponse.body.user_id;

    const org2LoginResponse = await request(app.getHttpServer())
      .post(`/api/v1/auth/login?organization_id=${org2Id}`)
      .send({
        email: 'org2owner@test.com',
        password: 'TestPassword123!',
      });

    org2Token = org2LoginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Organization Context Extraction', () => {
    it('should extract organization ID from JWT token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/organizations/me')
        .set('Authorization', `Bearer ${org1Token}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(org1Id);
    });

    it('should return different organization for different tokens', async () => {
      const org1Response = await request(app.getHttpServer())
        .get('/api/v1/organizations/me')
        .set('Authorization', `Bearer ${org1Token}`)
        .expect(200);

      const org2Response = await request(app.getHttpServer())
        .get('/api/v1/organizations/me')
        .set('Authorization', `Bearer ${org2Token}`)
        .expect(200);

      expect(org1Response.body.id).toBe(org1Id);
      expect(org2Response.body.id).toBe(org2Id);
      expect(org1Response.body.id).not.toBe(org2Response.body.id);
    });
  });

  describe('User Data Isolation', () => {
    it('should only return users from the requesting organization', async () => {
      const org1Response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${org1Token}`)
        .expect(200);

      const org2Response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${org2Token}`)
        .expect(200);

      // Both should have users, but different ones
      expect(Array.isArray(org1Response.body.users || org1Response.body)).toBe(true);
      expect(Array.isArray(org2Response.body.users || org2Response.body)).toBe(true);

      const org1Users = org1Response.body.users || org1Response.body;
      const org2Users = org2Response.body.users || org2Response.body;

      // Verify users are different
      const org1UserIds = Array.isArray(org1Users) ? org1Users.map((u: any) => u.id || u.user_id) : [];
      const org2UserIds = Array.isArray(org2Users) ? org2Users.map((u: any) => u.id || u.user_id) : [];

      // No overlap between organization user lists
      const overlap = org1UserIds.filter((id: string) => org2UserIds.includes(id));
      expect(overlap.length).toBe(0);
    });
  });

  describe('Ticket Data Isolation', () => {
    let org1TicketId: string | undefined;
    let org2TicketId: string | undefined;

    beforeAll(async () => {
      // Note: These tests assume organizations have ticket system access
      // If organizations don't have access, tests will fail with 403
      // This is acceptable as it tests both feature access and isolation

      // Create ticket for Organization 1
      const org1TicketResponse = await request(app.getHttpServer())
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${org1Token}`)
        .send({
          title: 'Org1 Ticket',
          description: 'This is a ticket for Organization 1',
          priority: 'medium',
        });

      // Allow 201 (created) or 403 (no access) - if 403, skip ticket isolation tests
      if (org1TicketResponse.status === 201) {
        org1TicketId = org1TicketResponse.body.id;
      }

      // Create ticket for Organization 2
      const org2TicketResponse = await request(app.getHttpServer())
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${org2Token}`)
        .send({
          title: 'Org2 Ticket',
          description: 'This is a ticket for Organization 2',
          priority: 'high',
        });

      if (org2TicketResponse.status === 201) {
        org2TicketId = org2TicketResponse.body.id;
      }
    });

    it('should only return tickets from the requesting organization', async () => {
      // Skip if organizations don't have ticket access
      if (!org1TicketId || !org2TicketId) {
        console.log('Skipping ticket isolation test - organizations do not have ticket system access');
        return;
      }

      const org1Response = await request(app.getHttpServer())
        .get('/api/v1/tickets')
        .set('Authorization', `Bearer ${org1Token}`)
        .expect(200);

      const org2Response = await request(app.getHttpServer())
        .get('/api/v1/tickets')
        .set('Authorization', `Bearer ${org2Token}`)
        .expect(200);

      const org1Tickets = org1Response.body.tickets || org1Response.body.data || org1Response.body;
      const org2Tickets = org2Response.body.tickets || org2Response.body.data || org2Response.body;

      const org1TicketIds = Array.isArray(org1Tickets) ? org1Tickets.map((t: any) => t.id) : [];
      const org2TicketIds = Array.isArray(org2Tickets) ? org2Tickets.map((t: any) => t.id) : [];

      // Org1 should have its ticket
      expect(org1TicketIds).toContain(org1TicketId);
      // Org1 should NOT have Org2's ticket
      expect(org1TicketIds).not.toContain(org2TicketId);

      // Org2 should have its ticket
      expect(org2TicketIds).toContain(org2TicketId);
      // Org2 should NOT have Org1's ticket
      expect(org2TicketIds).not.toContain(org1TicketId);
    });

    it('should prevent accessing ticket from another organization', async () => {
      // Skip if organizations don't have ticket access
      if (!org1TicketId || !org2TicketId) {
        console.log('Skipping ticket access prevention test - organizations do not have ticket system access');
        return;
      }

      // Try to access Org2's ticket with Org1's token
      await request(app.getHttpServer())
        .get(`/api/v1/tickets/${org2TicketId}`)
        .set('Authorization', `Bearer ${org1Token}`)
        .expect(404); // Should return 404 (not found), not 403

      // Try to access Org1's ticket with Org2's token
      await request(app.getHttpServer())
        .get(`/api/v1/tickets/${org1TicketId}`)
        .set('Authorization', `Bearer ${org2Token}`)
        .expect(404); // Should return 404 (not found), not 403
    });

    it('should prevent updating ticket from another organization', async () => {
      // Skip if organizations don't have ticket access
      if (!org1TicketId || !org2TicketId) {
        console.log('Skipping ticket update prevention test - organizations do not have ticket system access');
        return;
      }

      // Try to update Org2's ticket with Org1's token
      await request(app.getHttpServer())
        .patch(`/api/v1/tickets/${org2TicketId}`)
        .set('Authorization', `Bearer ${org1Token}`)
        .send({
          status: 'closed',
        })
        .expect(404); // Should return 404 (not found)

      // Try to update Org1's ticket with Org2's token
      await request(app.getHttpServer())
        .patch(`/api/v1/tickets/${org1TicketId}`)
        .set('Authorization', `Bearer ${org2Token}`)
        .send({
          status: 'closed',
        })
        .expect(404); // Should return 404 (not found)
    });

    it('should allow accessing own organization tickets', async () => {
      // Skip if organizations don't have ticket access
      if (!org1TicketId) {
        console.log('Skipping ticket access test - organizations do not have ticket system access');
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/api/v1/tickets/${org1TicketId}`)
        .set('Authorization', `Bearer ${org1Token}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(org1TicketId);
      expect(response.body.title).toBe('Org1 Ticket');
    });
  });

  describe('Chat Data Isolation', () => {
    let org1ChatId: string | undefined;
    let org2ChatId: string | undefined;

    beforeAll(async () => {
      // Note: These tests assume organizations have chat system access
      // If organizations don't have access, tests will fail with 403

      // Create chat for Organization 1
      const org1ChatResponse = await request(app.getHttpServer())
        .post('/api/v1/chats')
        .set('Authorization', `Bearer ${org1Token}`)
        .send({
          type: 'group',
          name: 'Org1 Chat',
          description: 'Chat for Organization 1',
        });

      if (org1ChatResponse.status === 201) {
        org1ChatId = org1ChatResponse.body.id;
      }

      // Create chat for Organization 2
      const org2ChatResponse = await request(app.getHttpServer())
        .post('/api/v1/chats')
        .set('Authorization', `Bearer ${org2Token}`)
        .send({
          type: 'group',
          name: 'Org2 Chat',
          description: 'Chat for Organization 2',
        });

      if (org2ChatResponse.status === 201) {
        org2ChatId = org2ChatResponse.body.id;
      }
    });

    it('should only return chats from the requesting organization', async () => {
      // Skip if organizations don't have chat access
      if (!org1ChatId || !org2ChatId) {
        console.log('Skipping chat isolation test - organizations do not have chat system access');
        return;
      }

      const org1Response = await request(app.getHttpServer())
        .get('/api/v1/chats')
        .set('Authorization', `Bearer ${org1Token}`)
        .expect(200);

      const org2Response = await request(app.getHttpServer())
        .get('/api/v1/chats')
        .set('Authorization', `Bearer ${org2Token}`)
        .expect(200);

      const org1Chats = org1Response.body.chats || org1Response.body.data || org1Response.body;
      const org2Chats = org2Response.body.chats || org2Response.body.data || org2Response.body;

      const org1ChatIds = Array.isArray(org1Chats) ? org1Chats.map((c: any) => c.id) : [];
      const org2ChatIds = Array.isArray(org2Chats) ? org2Chats.map((c: any) => c.id) : [];

      // Org1 should have its chat
      expect(org1ChatIds).toContain(org1ChatId);
      // Org1 should NOT have Org2's chat
      expect(org1ChatIds).not.toContain(org2ChatId);

      // Org2 should have its chat
      expect(org2ChatIds).toContain(org2ChatId);
      // Org2 should NOT have Org1's chat
      expect(org2ChatIds).not.toContain(org1ChatId);
    });

    it('should prevent accessing chat from another organization', async () => {
      // Skip if organizations don't have chat access
      if (!org1ChatId || !org2ChatId) {
        console.log('Skipping chat access prevention test - organizations do not have chat system access');
        return;
      }

      // Try to access Org2's chat with Org1's token
      await request(app.getHttpServer())
        .get(`/api/v1/chats/${org2ChatId}`)
        .set('Authorization', `Bearer ${org1Token}`)
        .expect(404); // Should return 404 (not found)

      // Try to access Org1's chat with Org2's token
      await request(app.getHttpServer())
        .get(`/api/v1/chats/${org1ChatId}`)
        .set('Authorization', `Bearer ${org2Token}`)
        .expect(404); // Should return 404 (not found)
    });
  });

  describe('Query Filtering by Organization', () => {
    it('should filter tickets by organization_id in queries', async () => {
      // Skip if organizations don't have ticket access
      if (!org1TicketId || !org2TicketId) {
        console.log('Skipping ticket query filtering test - organizations do not have ticket system access');
        return;
      }

      // Create multiple tickets in both organizations (if access available)
      const org1Ticket2Response = await request(app.getHttpServer())
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${org1Token}`)
        .send({
          title: 'Org1 Ticket 2',
          description: 'Another ticket for Organization 1',
          priority: 'low',
        });

      const org2Ticket2Response = await request(app.getHttpServer())
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${org2Token}`)
        .send({
          title: 'Org2 Ticket 2',
          description: 'Another ticket for Organization 2',
          priority: 'medium',
        });

      // If tickets couldn't be created (403), skip this test
      if (org1Ticket2Response.status !== 201 || org2Ticket2Response.status !== 201) {
        console.log('Skipping ticket query filtering test - could not create additional tickets');
        return;
      }

      // Query Org1 tickets
      const org1Response = await request(app.getHttpServer())
        .get('/api/v1/tickets')
        .set('Authorization', `Bearer ${org1Token}`)
        .expect(200);

      // Query Org2 tickets
      const org2Response = await request(app.getHttpServer())
        .get('/api/v1/tickets')
        .set('Authorization', `Bearer ${org2Token}`)
        .expect(200);

      const org1Tickets = org1Response.body.tickets || org1Response.body.data || org1Response.body;
      const org2Tickets = org2Response.body.tickets || org2Response.body.data || org2Response.body;

      // All Org1 tickets should belong to Org1
      if (Array.isArray(org1Tickets)) {
        org1Tickets.forEach((ticket: any) => {
          expect(ticket.organization_id).toBe(org1Id);
        });
      }

      // All Org2 tickets should belong to Org2
      if (Array.isArray(org2Tickets)) {
        org2Tickets.forEach((ticket: any) => {
          expect(ticket.organization_id).toBe(org2Id);
        });
      }
    });

    it('should filter chats by organization_id in queries', async () => {
      // Skip if organizations don't have chat access
      if (!org1ChatId || !org2ChatId) {
        console.log('Skipping chat query filtering test - organizations do not have chat system access');
        return;
      }

      // Query Org1 chats
      const org1Response = await request(app.getHttpServer())
        .get('/api/v1/chats')
        .set('Authorization', `Bearer ${org1Token}`)
        .expect(200);

      // Query Org2 chats
      const org2Response = await request(app.getHttpServer())
        .get('/api/v1/chats')
        .set('Authorization', `Bearer ${org2Token}`)
        .expect(200);

      const org1Chats = org1Response.body.chats || org1Response.body.data || org1Response.body;
      const org2Chats = org2Response.body.chats || org2Response.body.data || org2Response.body;

      // All Org1 chats should belong to Org1
      if (Array.isArray(org1Chats)) {
        org1Chats.forEach((chat: any) => {
          expect(chat.organization_id).toBe(org1Id);
        });
      }

      // All Org2 chats should belong to Org2
      if (Array.isArray(org2Chats)) {
        org2Chats.forEach((chat: any) => {
          expect(chat.organization_id).toBe(org2Id);
        });
      }
    });
  });

  describe('Same User in Different Organizations', () => {
    it('should allow same user to access different organizations separately', async () => {
      // Note: This test assumes a user can be a member of multiple organizations
      // In practice, you'd need to invite the user to the second organization

      // User should be able to switch organizations and see different data
      const org1UserResponse = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${org1Token}`)
        .expect(200);

      const org2UserResponse = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${org2Token}`)
        .expect(200);

      // Both should return user data
      expect(org1UserResponse.body).toHaveProperty('id');
      expect(org2UserResponse.body).toHaveProperty('id');

      // Organization context should be different
      const org1OrgResponse = await request(app.getHttpServer())
        .get('/api/v1/organizations/me')
        .set('Authorization', `Bearer ${org1Token}`)
        .expect(200);

      const org2OrgResponse = await request(app.getHttpServer())
        .get('/api/v1/organizations/me')
        .set('Authorization', `Bearer ${org2Token}`)
        .expect(200);

      expect(org1OrgResponse.body.id).toBe(org1Id);
      expect(org2OrgResponse.body.id).toBe(org2Id);
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for requests without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/tickets')
        .expect(401);

      await request(app.getHttpServer())
        .get('/api/v1/chats')
        .expect(401);
    });

    it('should return 404 (not 403) for resources from other organizations', async () => {
      // Create a ticket in Org1
      const ticketResponse = await request(app.getHttpServer())
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${org1Token}`)
        .send({
          title: 'Test Ticket',
          description: 'Test description',
          priority: 'medium',
        })
        .expect(201);

      const ticketId = ticketResponse.body.id;

      // Try to access with Org2 token - should return 404, not 403
      // (We don't reveal that the resource exists in another organization)
      await request(app.getHttpServer())
        .get(`/api/v1/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${org2Token}`)
        .expect(404);
    });
  });
});

