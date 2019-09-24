/* eslint-disable import/no-unresolved,no-unused-vars */
import { ValidationError as JoiValidationError } from '@hapi/joi';
/* eslint-enable import/no-unresolved,no-unused-vars */

export default class ValidationError extends Error {
  details: JoiValidationError;

  constructor(message: string, details: JoiValidationError) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}
