import { isValidMemberName } from './validations';

const attributeMetadataKey = Symbol();
const attributeListMetadataKey = Symbol();

type AttributeProperty<T> = Extract<keyof T, string>;
type AttributeList<T> = AttributeProperty<T>[];

interface AttributeOptions {
  as?: string;
  schema?: object;
  required?: boolean;
}

interface AttributeInfo {
  name: string;
  schema?: object;
  required: boolean;
}

export default function attribute(options: AttributeOptions = {}) {
  return (target: any, property: string) => {
    const attributeName = options.as || property;
    if (!isValidMemberName(attributeName)) {
      throw new Error(`${attributeName} is not a valid attribute name`);
    }

    Reflect.defineMetadata(attributeMetadataKey, options, target, property);

    const existingAttributes: AttributeList<any> =
      Reflect.getMetadata(attributeListMetadataKey, target) || [];
    Reflect.defineMetadata(attributeListMetadataKey, [...existingAttributes, property], target);
  };
}

export function getAttributeInfo<T>(target: T, property: AttributeProperty<T>): AttributeInfo {
  const info: AttributeOptions = Reflect.getMetadata(attributeMetadataKey, target, property);
  return {
    name: info.as || property,
    schema: info.schema,
    required: info.required || false,
  };
}

export function getAttributeList<T>(target: T): AttributeList<T> {
  return Reflect.getMetadata(attributeListMetadataKey, target) || [];
}
