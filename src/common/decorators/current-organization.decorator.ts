import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentOrganization = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;
  
  // Prioritize organizationId from JWT (string) over organization object
  const organizationId = user?.organizationId;
  const organization = user?.membership?.organization;
  
  // If a property name is provided, extract that property
  if (data) {
    if (data === 'id') {
      // Return organizationId string if available, otherwise extract from organization object
      if (organizationId) {
        return organizationId;
      }
      if (organization) {
        return organization.id || organization.organizationId;
      }
      return null;
    }
    // For other properties, use the organization object
    if (organization) {
      return organization[data];
    }
    return null;
  }
  
  // If no property requested, return organization object if available, otherwise organizationId
  return organization || organizationId || null;
});
