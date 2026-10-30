export class AppError extends Error {
  constructor(code, message, fields = {}) {
    super(message); Object.assign(this, { code, fields });
  }
}
export function invalid(field, message) {
  throw new AppError('VALIDATION_ERROR', message, { [field]: message });
}
