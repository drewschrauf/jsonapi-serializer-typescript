import { ResourceConstructor } from './resource';
import { isValidMemberName } from './validations';

const relationshipMetadataKey = Symbol();
const relationshipListMetadataKey = Symbol();

type RelationshipProperty<T> = Extract<keyof T, string>;
type RelationshipList<T> = RelationshipProperty<T>[];

interface BaseRelationshipOptions {
  selfLink?: boolean;
  relatedLink?: boolean;
  as?: string;
  required?: boolean;
}

type Constructor = ResourceConstructor<any>;

interface ToOneRelationshipOptions extends BaseRelationshipOptions {
  toOne: Constructor;
}

interface ToManyRelationshipOptions extends BaseRelationshipOptions {
  toMany: Constructor;
}

type RelationshipOptions = ToOneRelationshipOptions | ToManyRelationshipOptions;

function isToOneRelationshipOptions(
  options: BaseRelationshipOptions,
): options is ToOneRelationshipOptions {
  return !!(options as any).toOne;
}

interface RelationshipMetadata {
  selfLink?: boolean;
  relatedLink?: boolean;
  as?: string;
  RelatedClass: Constructor;
  type: RelationshipType;
  required?: boolean;
}

interface RelationshipInfo {
  type: RelationshipType;
  RelatedClass: Constructor;
  name: string;
  selfLink: boolean;
  relatedLink: boolean;
  required: boolean;
}

export enum RelationshipType {
  ToOne,
  ToMany,
}

export default function relationship(options: RelationshipOptions) {
  return (target: any, property: string) => {
    const relationshipName = options.as || property;
    if (!isValidMemberName(relationshipName)) {
      throw new Error(`${relationshipName} is not a valid relationship name`);
    }

    Reflect.defineMetadata(
      relationshipMetadataKey,
      {
        ...options,
        RelatedClass: isToOneRelationshipOptions(options) ? options.toOne : options.toMany,
        type: isToOneRelationshipOptions(options)
          ? RelationshipType.ToOne
          : RelationshipType.ToMany,
      },
      target,
      property,
    );

    const existingRelationships: RelationshipList<any> =
      Reflect.getMetadata(relationshipListMetadataKey, target) || [];
    Reflect.defineMetadata(
      relationshipListMetadataKey,
      [...existingRelationships, property],
      target,
    );
  };
}

export function getRelationshipInfo<T>(
  target: T,
  property: RelationshipProperty<T>,
): RelationshipInfo {
  const info: RelationshipMetadata = Reflect.getMetadata(relationshipMetadataKey, target, property);
  return {
    type: info.type,
    RelatedClass: info.RelatedClass,
    name: info.as || property,
    selfLink: info.selfLink || false,
    relatedLink: info.relatedLink || false,
    required: info.required || false,
  };
}

export function getRelationshipList<T>(target: T): RelationshipList<T> {
  return Reflect.getMetadata(relationshipListMetadataKey, target) || [];
}
