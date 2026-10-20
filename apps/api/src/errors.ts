export class HttpError extends Error {
  readonly status: 400 | 404 | 502

  constructor(status: HttpError['status'], message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = new.target.name
    this.status = status
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(400, message)
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message)
  }
}

export class EspnError extends HttpError {
  constructor(message: string, options?: ErrorOptions) {
    super(502, message, options)
  }
}
