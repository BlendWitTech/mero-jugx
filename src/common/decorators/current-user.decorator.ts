import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const CurrentUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;
  
  // Ensure user exists - if JWT guard passed, user should be set
  if (!user) {
    throw new UnauthorizedException('User not authenticated');
  }
  
  // If a property name is provided, extract that property
  if (data && user) {
    // Handle both 'id' and 'userId' properties
    if (data === 'id') {
      return user.id || user.userId;
    }
    return user[data];
  }
  
  return user;
});
