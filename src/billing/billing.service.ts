import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Response } from 'express';
import { Payment, PaymentStatus } from '../database/entities/payment.entity';
import { Organization } from '../database/entities/organization.entity';
import { Package } from '../database/entities/package.entity';
import { OrganizationMember, OrganizationMemberStatus } from '../database/entities/organization-member.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

export interface InvoiceData {
  invoice_number: string;
  organization_name: string;
  organization_email: string;
  organization_address: string | null;
  date: string;
  due_date: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string;
  transaction_id: string;
  status: string;
}

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Package)
    private packageRepository: Repository<Package>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    private auditLogsService: AuditLogsService,
  ) {}

  /**
   * Get billing history for organization
   */
  async getBillingHistory(
    organizationId: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    // Verify user has permission
    const membership = await this.memberRepository.findOne({
      where: {
        organization_id: organizationId,
        user_id: userId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role', 'role.role_permissions', 'role.role_permissions.permission'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Only owners and admins can view billing
    const hasPermission = membership.role.is_organization_owner || 
      membership.role.role_permissions?.some((rp) => rp.permission.slug === 'packages.view');
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to view billing history');
    }

    const [payments, total] = await this.paymentRepository.findAndCount({
      where: {
        organization_id: organizationId,
      },
      relations: ['organization', 'user'],
      order: {
        created_at: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      payments: payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        gateway: payment.gateway,
        payment_type: payment.payment_type,
        transaction_id: payment.transaction_id,
        created_at: payment.created_at,
        completed_at: payment.completed_at,
        package_name: payment.metadata?.package_name || null,
        period_months: payment.metadata?.period_months || null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Generate invoice for a payment
   */
  async generateInvoice(
    organizationId: string,
    userId: string,
    paymentId: string,
  ): Promise<InvoiceData> {
    // Verify user has permission
    const membership = await this.memberRepository.findOne({
      where: {
        organization_id: organizationId,
        user_id: userId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role', 'role.role_permissions', 'role.role_permissions.permission'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const hasPermission = membership.role.is_organization_owner || 
      membership.role.role_permissions?.some((rp) => rp.permission.slug === 'packages.view');
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to view invoices');
    }

    const payment = await this.paymentRepository.findOne({
      where: {
        id: paymentId,
        organization_id: organizationId,
      },
      relations: ['organization', 'user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const organization = payment.organization;
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Generate invoice number
    const invoiceNumber = `INV-${payment.id.substring(0, 8).toUpperCase()}-${payment.created_at.getFullYear()}`;

    // Calculate dates
    const invoiceDate = payment.created_at;
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms

    // Build invoice items
    const packageName = payment.metadata?.package_name || 'Package Subscription';
    const periodMonths = payment.metadata?.period_months || 1;
    const items = [{
      description: packageName,
      quantity: periodMonths,
      unit_price: parseFloat(payment.amount.toString()) / periodMonths,
      total: parseFloat(payment.amount.toString()),
    }];

    const subtotal = parseFloat(payment.amount.toString());
    const tax = 0; // Add tax calculation if needed
    const total = subtotal + tax;

    return {
      invoice_number: invoiceNumber,
      organization_name: organization.name,
      organization_email: organization.email,
      organization_address: organization.address || null,
      date: invoiceDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      items,
      subtotal,
      tax,
      total,
      payment_method: payment.gateway,
      transaction_id: payment.transaction_id || payment.id,
      status: payment.status,
    };
  }

  /**
   * Export invoice as CSV
   */
  async exportInvoice(
    organizationId: string,
    userId: string,
    paymentId: string,
  ): Promise<string> {
    const invoice = await this.generateInvoice(organizationId, userId, paymentId);

    const csvLines = [
      'Invoice Number,Date,Due Date,Organization,Amount,Status,Transaction ID',
      [
        invoice.invoice_number,
        invoice.date,
        invoice.due_date,
        invoice.organization_name,
        invoice.total,
        invoice.status,
        invoice.transaction_id,
      ].join(','),
      '',
      'Items:',
      'Description,Quantity,Unit Price,Total',
      ...invoice.items.map(item => [
        item.description,
        item.quantity,
        item.unit_price,
        item.total,
      ].join(',')),
      '',
      `Subtotal,${invoice.subtotal}`,
      `Tax,${invoice.tax}`,
      `Total,${invoice.total}`,
    ];

    return csvLines.join('\n');
  }

  /**
   * Get subscription details
   */
  async getSubscriptionDetails(organizationId: string, userId: string) {
    // Verify user has permission
    const membership = await this.memberRepository.findOne({
      where: {
        organization_id: organizationId,
        user_id: userId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['package'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Get latest payment
    const latestPayment = await this.paymentRepository.findOne({
      where: {
        organization_id: organizationId,
        status: PaymentStatus.COMPLETED,
      },
      order: {
        created_at: 'DESC',
      },
    });

    // Get payment history
    const paymentHistory = await this.paymentRepository.find({
      where: {
        organization_id: organizationId,
        status: PaymentStatus.COMPLETED,
      },
      order: {
        created_at: 'DESC',
      },
      take: 10,
    });

    return {
      current_package: {
        id: organization.package_id,
        name: organization.package?.name || 'Unknown',
        price: organization.package?.price || 0,
      },
      package_expires_at: organization.package_expires_at,
      auto_renew: organization.package_auto_renew,
      latest_payment: latestPayment ? {
        id: latestPayment.id,
        amount: latestPayment.amount,
        date: latestPayment.completed_at || latestPayment.created_at,
        gateway: latestPayment.gateway,
      } : null,
      payment_history: paymentHistory.map(p => ({
        id: p.id,
        amount: p.amount,
        date: p.completed_at || p.created_at,
        gateway: p.gateway,
        invoice_number: `INV-${p.id.substring(0, 8).toUpperCase()}-${p.created_at.getFullYear()}`,
      })),
    };
  }

  /**
   * Cancel subscription (disable auto-renewal)
   */
  async cancelSubscription(organizationId: string, userId: string) {
    // Verify user is owner
    const membership = await this.memberRepository.findOne({
      where: {
        organization_id: organizationId,
        user_id: userId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    if (!membership.role.is_organization_owner) {
      throw new ForbiddenException('Only organization owner can cancel subscription');
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    organization.package_auto_renew = false;
    await this.organizationRepository.save(organization);

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'billing.subscription_cancelled',
      'organization',
      organizationId,
      { package_auto_renew: true },
      { package_auto_renew: false },
    );

    return {
      message: 'Subscription auto-renewal cancelled',
      auto_renew: false,
    };
  }

  /**
   * Resume subscription (enable auto-renewal)
   */
  async resumeSubscription(organizationId: string, userId: string) {
    // Verify user is owner
    const membership = await this.memberRepository.findOne({
      where: {
        organization_id: organizationId,
        user_id: userId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    if (!membership.role.is_organization_owner) {
      throw new ForbiddenException('Only organization owner can resume subscription');
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    organization.package_auto_renew = true;
    await this.organizationRepository.save(organization);

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'billing.subscription_resumed',
      'organization',
      organizationId,
      { package_auto_renew: false },
      { package_auto_renew: true },
    );

    return {
      message: 'Subscription auto-renewal resumed',
      auto_renew: true,
    };
  }
}

