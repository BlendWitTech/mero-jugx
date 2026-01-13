import { Injectable } from '@nestjs/common';
import { CustomPermissionsService } from './custom-permissions.service';
import { TimeBasedPermissionsService } from './time-based-permissions.service';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly customPermissionsService: CustomPermissionsService,
    private readonly timeBasedPermissionsService: TimeBasedPermissionsService,
  ) {}
}

