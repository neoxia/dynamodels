import { ValidationError as JoiValidationError } from 'joi';

export default class ValidationError extends Error {
  details: JoiValidationError;

  constructor(message: string, details: JoiValidationError) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}
