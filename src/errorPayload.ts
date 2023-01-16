export default class ErrorPayload {
  code: number;

  message: string | undefined;

  constructor(code: number, message: string | undefined) {
    this.code = code;
    this.message = message;
  }
}
