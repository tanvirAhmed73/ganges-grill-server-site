import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MAIL_QUEUE_NAME } from './mail.constants';
import { MailProcessor } from './mail.processor';
import { MailQueueService } from './mail-queue.service';
import { MailService } from './mail.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: MAIL_QUEUE_NAME,
    }),
  ],
  providers: [MailService, MailQueueService, MailProcessor],
  exports: [MailService, MailQueueService],
})
export class MailModule {}
