import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common'
import { Response } from 'express'
export class UnLoginException {
  message: string | undefined
  constructor(message?: string) {
    this.message = message
  }
}
@Catch(UnLoginException)
export class UnloginFilter implements ExceptionFilter {
  catch(exception: UnLoginException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>()

    response
      .json({
        code: HttpStatus.UNAUTHORIZED,
        message: 'fail',
        data: exception.message || '用户未登录',
      })
      .end()
  }
}
