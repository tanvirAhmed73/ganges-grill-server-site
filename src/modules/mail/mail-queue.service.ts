import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { JobsOptions, Queue } from 'bullmq';
import { MAIL_QUEUE_NAME } from './mail.constants';
import { MailJobName, MailJobPayload, VerificationMailPayload } from './mail.types';

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 4000 },
  removeOnComplete: 1000,
};

/**
 * Queue outbound mail so HTTP handlers stay fast and failures retry via BullMQ.
 * Any feature module can inject this to enqueue different job types.
 */
@Injectable()
export class MailQueueService {
  constructor(@InjectQueue(MAIL_QUEUE_NAME) private readonly queue: Queue) {}

  async queueVerificationEmail(to: string, name: string, code: string): Promise<void> {
    const payload: VerificationMailPayload = { to, name, code };
    await this.enqueue(MailJobName.VERIFICATION, payload);
  }

  /**
   * Enqueue a mail job by name. Extend {@link MailJobName} and {@link MailJobPayload}
   * when you add templates (e.g. password reset, order confirmation).
   */
  async enqueue(name: MailJobName, payload: MailJobPayload, options?: JobsOptions): Promise<void> {
    await this.queue.add(name, payload, { ...DEFAULT_JOB_OPTIONS, ...options });
  }
}
