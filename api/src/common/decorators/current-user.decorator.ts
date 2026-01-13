import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const CurrentUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;
  
  // Ensure user exists - if JWT guard passed, user should be set
  if (!user) {
    // Check if there's an authorization header
    const authHeader = request.headers?.authorization || request.headers?.Authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No authorization token provided. Please log in again.');
    }
    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization token format. Expected Bearer token.');
    }
    throw new UnauthorizedException('User not authenticated. Token may be invalid or expired. Please log in again.');
  }
  
  // If a property name is provided, extract that property
  if (data && user) {
    // Handle both 'id' and 'userId' properties
    if (data === 'id') {
      const userId = user.id || user.userId;
      if (!userId) {
        throw new UnauthorizedException('User ID not found in token. Please log in again.');
      }
      return userId;
    }
    return user[data];
  }
  
  return user;
});
