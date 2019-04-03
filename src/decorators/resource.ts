import { isValidMemberName } from './validations';

const resourceMetadataKey = Symbol();
const resourceIdMetadataKey = Symbol();

interface ResourceOptions {
  type: string;
  path: string;
}

interface ResourceInfo {
  type: string;
  path: string;
}

export interface ResourceConstructor<T> {
  new (id?: string, ...args: any[]): T;
}

export default function resource(options: ResourceOptions) {
  return (target: any) => {
    if (!isValidMemberName(options.type)) {
      throw new Error(`${options.type} is not a valid type name`);
    }
    Reflect.defineMetadata(resourceMetadataKey, options, target);
  };
}

export function resourceId() {
  return (target: any, property: string) => {
    if (Reflect.getMetadata('design:type', target, property) !== String) {
      throw new Error('resourceId() must be used on a string member');
    }
    Reflect.defineMetadata(resourceIdMetadataKey, property, target);
  };
}

export function isResource(target: any): boolean {
  return Reflect.hasMetadata(resourceMetadataKey, target.constructor);
}

export function getResourceInfo(target: any): ResourceInfo {
  const info: ResourceOptions = Reflect.getMetadata(resourceMetadataKey, target.constructor);
  return info;
}

export function getResourceId(target: any) {
  const idProperty = Reflect.getMetadata(resourceIdMetadataKey, target);
  return idProperty ? target[idProperty] : target.id;
}
