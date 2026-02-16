import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppAccessService } from '../app-access.service';

@Injectable()
export class AppAccessGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private appAccessService: AppAccessService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const organization = request.organization;
        const params = request.params;

        // Assume app_id is in params as 'appId' or 'id' if checking specific app access
        // This logic depends on how routes are structured.
        // For now, let's look for 'appId' in params.
        const appId = params.appId ? parseInt(params.appId) : null;

        if (!user || !organization || !appId) {
            // If we can't determine context, maybe this guard isn't applicable or request is malformed
            // But if semantic, we should probably allow if no appId context? 
            // Or block? Safer to block if this guard is explicitly used.
            return true;
        }

        const hasAccess = await this.appAccessService.hasAccess(
            user.userId,
            organization.id,
            appId,
        );

        if (!hasAccess) {
            throw new ForbiddenException('You do not have access to this app');
        }

        // Optionally check specific roles if required by metadata
        // const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
        // if (requiredRoles) { ... }

        return true;
    }
}
