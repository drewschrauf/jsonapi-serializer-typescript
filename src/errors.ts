interface ValidationErrorParams {
  id: string;
  title: string;
  description: string;
  status: string;
  pointer?: string;
}

export class JsonApiError extends Error {
  public id: string;
  public title: string;
  public description: string;
  public status: string;
  public pointer?: string;

  constructor({ id, title, description, status, pointer }: ValidationErrorParams) {
    super(description) /* istanbul ignore next */;
    this.id = id;
    this.title = title;
    this.description = description;
    this.status = status;
    this.pointer = pointer;

    Object.setPrototypeOf(this, JsonApiError.prototype);
  }
}

export class CombinedJsonApiError extends Error {
  public status: string;
  public errors: JsonApiError[];

  constructor({ status, errors }: { status: string; errors: JsonApiError[] }) {
    super('JsonApiError') /* istanbul ignore next */;
    this.status = status;
    this.errors = errors;

    Object.setPrototypeOf(this, CombinedJsonApiError.prototype);
  }
}
