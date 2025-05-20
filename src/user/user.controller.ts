import {
  Controller,
  Post,
  Body,
  Inject,
  Get,
  Query,
  // Param,
  // Patch,
  // Delete,
  // SetMetadata,
  UnauthorizedException,
} from '@nestjs/common'
import { UserService } from './user.service'
import { RegisterUserDto } from './dto/register-user.dto'
import { EmailService } from '../email/email.service'
import { RedisService } from '../redis/redis.service'
import { LoginUserDto } from './dto/login-user.dto'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { RequireLogin, UserInfo, RequirePermission } from 'src/custom.decorator'
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  // @Post('login')
  // async login(@Body() body: any) {

  // }

  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    console.log(registerUser)
    return await this.userService.register(registerUser)
  }

  @Inject(EmailService)
  private emailService: EmailService

  @Inject(RedisService)
  private redisService: RedisService
  @Inject(JwtService)
  private jwtService: JwtService
  @Inject(ConfigService)
  private configService: ConfigService
  @Get('register-captcha')
  async captcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8)

    await this.redisService.set(`captcha_${address}`, code, 5 * 60)

    await this.emailService.sendMail({
      to: address,
      subject: '注册验证码',
      html: `<p>你的注册验证码是 ${code}</p>`,
    })
    return '发送成功'
  }
  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    const vo = await this.userService.login(loginUserDto, false)

    vo.accessToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
        username: vo.userInfo.username,
        roles: vo.userInfo.roles,
        permissions: vo.userInfo.permissions,
      },
      {
        expiresIn:
          this.configService.get('jwt_access_token_expires_time') || '30m',
      },
    )

    vo.refreshToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
      },
      {
        expiresIn:
          this.configService.get('jwt_refresh_token_expres_time') || '7d',
      },
    )

    return vo
  }
  @Post('admin/login')
  async adminLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, true)
    vo.accessToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
        username: vo.userInfo.username,
        roles: vo.userInfo.roles,
        permissions: vo.userInfo.permissions,
      },
      {
        expiresIn:
          this.configService.get('jwt_access_token_expires_time') || '30m',
      },
    )

    vo.refreshToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
      },
      {
        expiresIn:
          this.configService.get('jwt_refresh_token_expres_time') || '7d',
      },
    )
    return vo
  }
  @Get('init-data')
  async initData() {
    await this.userService.initData()
    return '初始化成功'
  }

  @Get('refresh')
  async refresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data: { userId: number } = this.jwtService.verify(refreshToken)

      const user = await this.userService.findUserById(data.userId, false)

      const access_token = this.jwtService.sign(
        {
          userId: user.id,
          username: user.username,
          roles: user.roles,
          permissions: user.permissions,
        },
        {
          expiresIn:
            this.configService.get('jwt_access_token_expires_time') || '30m',
        },
      )

      const refresh_token = this.jwtService.sign(
        {
          userId: user.id,
        },
        {
          expiresIn:
            this.configService.get('jwt_refresh_token_expres_time') || '7d',
        },
      )

      return {
        access_token,
        refresh_token,
      }
    } catch (e) {
      throw new UnauthorizedException('token 已失效，请重新登录')
    }
  }

  @Get('admin/refresh')
  async adminRefresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data: { userId: number } = this.jwtService.verify(refreshToken)

      const user = await this.userService.findUserById(data.userId, true)

      const access_token = this.jwtService.sign(
        {
          userId: user.id,
          username: user.username,
          roles: user.roles,
          permissions: user.permissions,
        },
        {
          expiresIn:
            this.configService.get('jwt_access_token_expires_time') || '30m',
        },
      )

      const refresh_token = this.jwtService.sign(
        {
          userId: user.id,
        },
        {
          expiresIn:
            this.configService.get('jwt_refresh_token_expres_time') || '7d',
        },
      )

      return {
        access_token,
        refresh_token,
      }
    } catch (e) {
      throw new UnauthorizedException('token 已失效，请重新登录')
    }
  }

  @Get('aaa')
  @RequireLogin()
  @RequirePermission('aaa')
  aaa(@UserInfo() username: string, @UserInfo() userInfo) {
    console.log(username, userInfo)
    return 'aaa'
  }

  // @Get('aaa')
  // @SetMetadata('require-login', true)
  // @SetMetadata('require-permission', ['ddd'])
  // aaaa() {
  //   return 'aaa'
  // }
}
