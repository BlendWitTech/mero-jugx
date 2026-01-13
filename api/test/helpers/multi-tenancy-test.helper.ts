import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

/**
 * Helper functions for multi-tenancy isolation tests
 */
export class MultiTenancyTestHelper {
  /**
   * Create an organization and return auth token
   */
  static async createOrganizationAndLogin(
    app: INestApplication,
    orgData: {
      name: string;
      email: string;
      ownerEmail: string;
      ownerPassword: string;
      ownerFirstName?: string;
      ownerLastName?: string;
    },
  ): Promise<{
    organizationId: string;
    userId: string;
    token: string;
  }> {
    // Register organization
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/organization/register')
      .send({
        name: orgData.name,
        email: orgData.email,
        owner_email: orgData.ownerEmail,
        owner_password: orgData.ownerPassword,
        owner_first_name: orgData.ownerFirstName || 'Test',
        owner_last_name: orgData.ownerLastName || 'User',
      })
      .expect(201);

    const organizationId = registerResponse.body.organization_id;
    const userId = registerResponse.body.user_id;

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post(`/api/v1/auth/login?organization_id=${organizationId}`)
      .send({
        email: orgData.ownerEmail,
        password: orgData.ownerPassword,
      })
      .expect(200);

    const token = loginResponse.body.access_token;

    return {
      organizationId,
      userId,
      token,
    };
  }

  /**
   * Create a ticket for an organization
   */
  static async createTicket(
    app: INestApplication,
    token: string,
    ticketData: {
      title: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      status?: string;
    },
  ): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: ticketData.title,
        description: ticketData.description || '',
        priority: ticketData.priority || 'medium',
        ...ticketData,
      })
      .expect(201);

    return response.body.id;
  }

  /**
   * Create a chat for an organization
   */
  static async createChat(
    app: INestApplication,
    token: string,
    chatData: {
      type: 'direct' | 'group';
      name?: string;
      description?: string;
      memberIds?: string[];
    },
  ): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/chats')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: chatData.type,
        name: chatData.name,
        description: chatData.description,
        member_ids: chatData.memberIds || [],
      })
      .expect(201);

    return response.body.id;
  }

  /**
   * Verify that a resource belongs to the specified organization
   */
  static verifyOrganizationOwnership(resource: any, organizationId: string): void {
    expect(resource).toHaveProperty('organization_id');
    expect(resource.organization_id).toBe(organizationId);
  }

  /**
   * Verify that an array of resources all belong to the specified organization
   */
  static verifyAllBelongToOrganization(resources: any[], organizationId: string): void {
    resources.forEach((resource) => {
      this.verifyOrganizationOwnership(resource, organizationId);
    });
  }

  /**
   * Verify that two arrays have no overlapping IDs
   */
  static verifyNoOverlap(array1: any[], array2: any[], idField = 'id'): void {
    const ids1 = array1.map((item) => item[idField]);
    const ids2 = array2.map((item) => item[idField]);
    const overlap = ids1.filter((id) => ids2.includes(id));
    expect(overlap.length).toBe(0);
  }
}

