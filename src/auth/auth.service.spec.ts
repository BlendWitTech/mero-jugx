import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from '../database/entities/user.entity';
import { Organization } from '../database/entities/organization.entity';
import { OrganizationMember } from '../database/entities/organization-member.entity';
import { Role } from '../database/entities/role.entity';
import { Package } from '../database/entities/package.entity';
import { EmailVerification } from '../database/entities/email-verification.entity';
import { Session } from '../database/entities/session.entity';
import { EmailService } from '../common/services/email.service';
import { RedisService } from '../common/services/redis.service';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { LoginDto } from './dto/login.dto';
import { UserStatus } from '../database/entities/user.entity';
import { OrganizationStatus } from '../database/entities/organization.entity';
import { OrganizationMemberStatus } from '../database/entities/organization-member.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let organizationRepository: any;
  let memberRepository: any;
  let roleRepository: any;
  let packageRepository: any;
  let emailVerificationRepository: any;
  let sessionRepository: any;
  let jwtService: JwtService;
  let emailService: EmailService;
  let redisService: RedisService;
  let dataSource: DataSource;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockOrganizationRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockMemberRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRoleRepository = {
    findOne: jest.fn(),
  };

  const mockPackageRepository = {
    findOne: jest.fn(),
  };

  const mockEmailVerificationRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockSessionRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrganizationRepository,
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
          provide: getRepositoryToken(Package),
          useValue: mockPackageRepository,
        },
        {
          provide: getRepositoryToken(EmailVerification),
          useValue: mockEmailVerificationRepository,
        },
        {
          provide: getRepositoryToken(Session),
          useValue: mockSessionRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                JWT_EXPIRES_IN: '15m',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_REFRESH_EXPIRES_IN: '7d',
                FRONTEND_URL: 'http://localhost:3000',
                APP_NAME: 'Mero Jugx',
              };
              return config[key] || defaultValue;
            }),
          },
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    organizationRepository = module.get(getRepositoryToken(Organization));
    memberRepository = module.get(getRepositoryToken(OrganizationMember));
    roleRepository = module.get(getRepositoryToken(Role));
    packageRepository = module.get(getRepositoryToken(Package));
    emailVerificationRepository = module.get(getRepositoryToken(EmailVerification));
    sessionRepository = module.get(getRepositoryToken(Session));
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
    redisService = module.get<RedisService>(RedisService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        password_hash: '$2b$10$hashedpassword',
        status: UserStatus.ACTIVE,
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com', status: UserStatus.ACTIVE },
      });
    });

    it('should return null when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        password_hash: '$2b$10$hashedpassword',
        status: UserStatus.ACTIVE,
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should successfully login user', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        password_hash: '$2b$10$hashedpassword',
        first_name: 'Test',
        last_name: 'User',
        email_verified: true,
        status: UserStatus.ACTIVE,
      };

      const mockOrganization = {
        id: 'org-id',
        name: 'Test Org',
        mfa_enabled: false,
      };

      const mockRole = {
        id: 1,
        name: 'Admin',
      };

      const mockMembership = {
        id: 'member-id',
        user_id: 'user-id',
        organization_id: 'org-id',
        role_id: 1,
        status: OrganizationMemberStatus.ACTIVE,
        role: mockRole,
        organization: mockOrganization,
      };

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-refresh-token');

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      memberRepository.findOne.mockResolvedValue(mockMembership);
      mockJwtService.sign.mockReturnValue('access-token');
      sessionRepository.create.mockReturnValue({ id: 'session-id' });
      sessionRepository.save.mockResolvedValue({});

      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };

      const result = await service.login(loginDto, 'org-id');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(mockJwtService.sign).toHaveBeenCalled();
    });

    it('should return requires_mfa_setup when MFA is required but not set up', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        password_hash: '$2b$10$hashedpassword',
        email_verified: true,
        mfa_enabled: false,
        mfa_setup_completed_at: null,
        status: UserStatus.ACTIVE,
      };

      const mockOrganization = {
        id: 'org-id',
        name: 'Test Org',
        mfa_enabled: true,
      };

      const mockMembership = {
        id: 'member-id',
        user_id: 'user-id',
        organization_id: 'org-id',
        role_id: 1,
        status: OrganizationMemberStatus.ACTIVE,
        organization: mockOrganization,
      };

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      userRepository.findOne.mockResolvedValue(mockUser);
      memberRepository.findOne.mockResolvedValue(mockMembership);

      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };

      const result = await service.login(loginDto, 'org-id');

      expect(result).toHaveProperty('requires_mfa_setup', true);
    });
  });
});
