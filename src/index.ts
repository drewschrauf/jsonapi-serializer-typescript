import 'reflect-metadata';

export { default as toJsonApi, errorToJsonApi } from './marshall/toJsonApi';
export { default as fromJsonApi, fromJsonApiArray } from './marshall/fromJsonApi';
export { default as resource, resourceId } from './decorators/resource';
export { default as attribute } from './decorators/attribute';
export { default as relationship } from './decorators/relationship';
export { CombinedJsonApiError, JsonApiError } from './errors';
