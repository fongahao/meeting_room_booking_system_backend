import { Injectable } from '@nestjs/common'
import { createTransport, Transporter } from 'nodemailer'

@Injectable()
export class EmailService {
  transporter: Transporter

  constructor() {
    this.transporter = createTransport({
      host: 'smtp.qq.com',
      port: 465,
      secure: true,
      auth: {
        user: '1427962248@qq.com',
        pass: 'zgajzdxxjcohhjff',
      },
    })
  }

  async sendMail({ to, subject, html }) {
    await this.transporter.sendMail({
      from: {
        name: '会议室预定系统',
        address: '你的邮箱地址',
      },
      to,
      subject,
      html,
    })
  }
}
