import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import { MAIL_QUEUE_NAME } from './mail.constants';
import { MailService } from './mail.service';
import { MailJobName, VerificationMailPayload } from './mail.types';

@Processor(MAIL_QUEUE_NAME, { concurrency: 4 })
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    try {
      switch (job.name) {
        case MailJobName.VERIFICATION: {
          const data = job.data as VerificationMailPayload;
          await this.mailService.sendVerificationEmail(data.to, data.name, data.code);
          return;
        }
        default:
          throw new UnrecoverableError(`No mail handler registered for job name="${job.name}"`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(
        `Mail job failed name=${job.name} id=${job.id} attempt=${job.attemptsMade + 1}: ${message}`,
        stack,
      );
      throw err;
    }
  }
}
