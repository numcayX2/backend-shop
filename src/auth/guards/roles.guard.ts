// src/auth/guards/roles.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

// สร้าง Interface ง่ายๆ เพื่อบอกโครงสร้างของ Request ที่มี User
interface RequestWithUser {
  user?: {
    role: string;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // [จุดที่แก้ไข]: ใส่ Generic Type <RequestWithUser> ให้ getRequest()
    const { user } = context.switchToHttp().getRequest<RequestWithUser>();

    // ตอนนี้ TypeScript รู้จัก user.role แล้ว จึงไม่แจ้ง Error
    if (!user || !user.role) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
