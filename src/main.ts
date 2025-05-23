import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FormatResponseInterceptor } from './format-reponse.interceptor'
import { InvokeRecordInterceptor } from './invoke-record.interceptor'
// import { UnloginFilter } from './unlogin.filter'
import { CustomExceptionFilter } from './custom-exception.filter'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe())
  app.useGlobalInterceptors(new FormatResponseInterceptor())
  app.useGlobalInterceptors(new InvokeRecordInterceptor())
  // app.useGlobalFilters(new UnloginFilter())
  app.useGlobalFilters(new CustomExceptionFilter())

  const config = new DocumentBuilder()
    .setTitle('会议室预定系统')
    .setDescription('会议室预定系统 API 文档')
    .setVersion('1.0')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api-doc', app, document)
  const configService = app.get(ConfigService)
  // 开启 CORS，并只允许来自 http://localhost:3001 的请求
  app.enableCors({
    origin: 'http://localhost:3001', // 或者用 ['http://localhost:3001', 'http://yourdomain.com']
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // 如果前端需要发送或接收 Cookie
    allowedHeaders: 'Content-Type, Authorization',
  })
  await app.listen(configService.get('nest_server_port') as string)
}
bootstrap()
