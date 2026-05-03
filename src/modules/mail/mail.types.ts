/** Registered job names handled by `MailProcessor`. Add new names here as you add flows. */
export enum MailJobName {
  VERIFICATION = 'verification',
}

export type VerificationMailPayload = {
  to: string;
  name: string;
  code: string;
};

/** Extend this union when adding new job types + handlers. */
export type MailJobPayload = VerificationMailPayload;
