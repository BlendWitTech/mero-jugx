import { SetMetadata } from '@nestjs/common';

export const SYSTEM_ADMIN_KEY = 'system_admin';
export const SystemAdmin = () => SetMetadata(SYSTEM_ADMIN_KEY, true);

