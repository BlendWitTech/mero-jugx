import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UsersService } from './users.service';
import { User } from '../database/entities/user.entity';
import { OrganizationMember } from '../database/entities/organization-member.entity';
import { Role } from '../database/entities/role.entity';
import { Session } from '../database/entities/session.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { Notification } from '../database/entities/notification.entity';
import { EmailService } from '../common/services/email.service';
import { UserStatus } from '../database/entities/user.entity';
import { OrganizationMemberStatus } from '../database/entities/organization-member.entity';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: any;
  let memberRepository: any;
  let roleRepository: any;
  let sessionRepository: any;
  let auditLogRepository: any;
  let notificationRepository: any;
  let emailService: EmailService;
  let dataSource: DataSource;

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockMemberRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockRoleRepository = {
    findOne: jest.fn(),
  };

  const mockSessionRepository = {
    update: jest.fn(),
  };

  const mockAuditLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockNotificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockEmailService = {
    sendAccessRevokedEmail: jest.fn(),
    sendDataTransferredEmail: jest.fn(),
  };

  const mockDataSource: any = {
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    })),
    getRepository: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(OrganizationMember),
          useValue: mockMemberRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: getRepositoryToken(Session),
          useValue: mockSessionRepository,
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    memberRepository = module.get(getRepositoryToken(OrganizationMember));
    roleRepository = module.get(getRepositoryToken(Role));
    sessionRepository = module.get(getRepositoryToken(Session));
    auditLogRepository = module.get(getRepositoryToken(AuditLog));
    notificationRepository = module.get(getRepositoryToken(Notification));
    emailService = module.get<EmailService>(EmailService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCurrentUser', () => {
    it('should return current user when member exists', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
      };

      const mockMembership = {
        id: 'member-id',
        user_id: 'user-id',
        organization_id: 'org-id',
        user: mockUser,
      };

      memberRepository.findOne.mockResolvedValue(mockMembership);

      const result = await service.getCurrentUser('user-id', 'org-id');

      expect(result).toEqual(mockUser);
      expect(memberRepository.findOne).toHaveBeenCalledWith({
        where: {
          user_id: 'user-id',
          organization_id: 'org-id',
          status: OrganizationMemberStatus.ACTIVE,
        },
        relations: ['user'],
      });
    });

    it('should throw ForbiddenException when user is not a member', async () => {
      memberRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getCurrentUser('user-id', 'org-id'),
      ).rejects.toThrow('You are not a member of this organization');
    });
  });

  describe('revokeAccess', () => {
    it('should successfully revoke user access', async () => {
      const mockRequestingUser = {
        id: 'requester-id',
        email: 'requester@example.com',
      };

      const mockTargetUser = {
        id: 'target-id',
        email: 'target@example.com',
        first_name: 'Target',
        last_name: 'User',
      };

      const mockRequestingMembership = {
        id: 'requester-member-id',
        user_id: 'requester-id',
        organization_id: 'org-id',
        role_id: 1,
        role: {
          id: 1,
          is_organization_owner: true,
        },
      };

      const mockTargetMembership = {
        id: 'target-member-id',
        user_id: 'target-id',
        organization_id: 'org-id',
        role_id: 2,
        status: OrganizationMemberStatus.ACTIVE,
        role: {
          id: 2,
          is_organization_owner: false,
        },
        user: mockTargetUser,
      };

      const mockOrganization = {
        id: 'org-id',
        name: 'Test Organization',
      };

      memberRepository.findOne
        .mockResolvedValueOnce(mockRequestingMembership)
        .mockResolvedValueOnce(mockTargetMembership);

      // Mock organization repository
      const mockOrgRepository = {
        findOne: jest.fn().mockResolvedValue(mockOrganization),
      };
      mockDataSource.getRepository = jest.fn().mockReturnValue(mockOrgRepository);

      sessionRepository.update.mockResolvedValue({ affected: 1 });
      memberRepository.save.mockResolvedValue({
        ...mockTargetMembership,
        status: OrganizationMemberStatus.REVOKED,
      });
      auditLogRepository.create.mockReturnValue({});
      auditLogRepository.save.mockResolvedValue({});
      notificationRepository.create.mockReturnValue({});
      notificationRepository.save.mockResolvedValue({});
      mockEmailService.sendAccessRevokedEmail.mockResolvedValue(undefined);

      const queryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };
      mockDataSource.createQueryRunner.mockReturnValue(queryRunner);

      const result = await service.revokeAccess(
        'requester-id',
        'org-id',
        'target-id',
        { transfer_data: false },
      );

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('revoked_user');
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw error when trying to revoke own access', async () => {
      const mockMembership = {
        id: 'member-id',
        user_id: 'user-id',
        organization_id: 'org-id',
        role_id: 1,
        role: {
          id: 1,
          is_organization_owner: true,
        },
      };

      memberRepository.findOne.mockResolvedValue(mockMembership);

      const queryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };
      mockDataSource.createQueryRunner.mockReturnValue(queryRunner);

      await expect(
        service.revokeAccess('user-id', 'org-id', 'user-id', {
          transfer_data: false,
        }),
      ).rejects.toThrow('You cannot revoke your own access');
    });
  });
});

