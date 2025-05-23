import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { Observable } from 'rxjs'
import { Permission } from './user/entities/permission.entity'
import { UnLoginException } from './unlogin.filter'
interface JwtUserData {
  userId: number
  username: string
  roles: string[]
  permissions: Permission[]
}

declare module 'express' {
  interface Request {
    user: JwtUserData
  }
}

@Injectable()
export class LoginGuard implements CanActivate {
  private logger = new Logger()
  @Inject()
  private reflector: Reflector

  @Inject(JwtService)
  private jwtService: JwtService
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest()

    const requireLogin: boolean = this.reflector.getAllAndOverride(
      'require-login',
      [context.getClass(), context.getHandler()],
    )

    if (!requireLogin) {
      return true
    }

    const authorization = request.headers.authorization
    // console.log('🚀 ~ LoginGuard ~ authorization:', authorization)

    if (!authorization) {
      throw new UnauthorizedException('用户未登录')
    }

    try {
      const token = authorization.split(' ')[1]
      // this.logger.debug('🚀 ~ LoginGuard ~ token:', token)
      const data = this.jwtService.verify<JwtUserData>(token)
      request.user = {
        userId: data.userId,
        username: data.username,
        roles: data.roles,
        permissions: data.permissions,
      }
      return true
    } catch (e) {
      // this.logger.debug('🚀 ~ LoginGuard ~ e:', e)

      throw new UnLoginException()
    }
  }
}
