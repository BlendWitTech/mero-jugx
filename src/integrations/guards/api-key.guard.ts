import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyService } from '../api-key.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Get API key from header
    const apiKey = request.headers['x-api-key'] as string;
    
    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Verify API key
    const key = await this.apiKeyService.verifyApiKey(apiKey);
    
    if (!key) {
      throw new UnauthorizedException('Invalid or expired API key');
    }

    // Attach API key info to request
    (request as any).apiKey = key;
    (request as any).organizationId = key.organization_id;
    (request as any).userId = key.created_by; // Use creator as user context

    return true;
  }
}

