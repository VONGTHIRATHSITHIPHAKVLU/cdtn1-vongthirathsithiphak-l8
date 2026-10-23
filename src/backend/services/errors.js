export class AppError extends Error {
  constructor(status, code, message, fields = {}) {
    super(message); Object.assign(this, { status, code, fields });
  }
}
export function invalid(field, message) {
  throw new AppError(400, 'VALIDATION_ERROR', message, { [field]: message });
}
