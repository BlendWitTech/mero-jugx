import { SetMetadata } from '@nestjs/common';

export const APP_SLUG_KEY = 'appSlug';
export const AppSlug = (slug: string) => SetMetadata(APP_SLUG_KEY, slug);
