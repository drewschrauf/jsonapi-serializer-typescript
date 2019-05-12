import Ajv, { ErrorObject, EnumParams } from 'ajv';
import { getResourceInfo, ResourceConstructor } from '../decorators/resource';
import { getAttributeList, getAttributeInfo } from '../decorators/attribute';
import {
  getRelationshipList,
  getRelationshipInfo,
  RelationshipType,
} from '../decorators/relationship';

interface ValidationError {
  message: string;
  pointer: string;
}
type ValidationResult = { valid: true } | { valid: false; errors: ValidationError[] };

function messageFromError(error: ErrorObject): string {
  if (error.keyword === 'enum') {
    const { allowedValues } = error.params as EnumParams;
    if (allowedValues.length > 1) {
      return `should be one of [${allowedValues.map(v => `'${v}'`).join(', ')}]`;
    }
    return `should be '${allowedValues[0]}'`;
  }
  return error.message as string;
}

function pointerFromPath(path: string): string {
  if (!path) {
    return '/';
  }
  return path
    .replace(/(\.|\['|'\]|\[|\])/g, '/')
    .replace(/\/\//g, '/')
    .replace(/\/$/, '');
}

export default function validateRequest<T>(
  request: unknown,
  TargetClass: ResourceConstructor<T>,
  { array = false, enforceRequired }: { array?: boolean; enforceRequired: boolean },
): ValidationResult {
  const ajv = new Ajv({ allErrors: true });

  const target = new TargetClass();
  const { type } = getResourceInfo(new TargetClass());
  const attributes = getAttributeList(target);
  const relationships = getRelationshipList(target);

  const requiredAttributes = enforceRequired
    ? attributes.filter(attribute => getAttributeInfo(target, attribute).required)
    : [];
  const requiredRelationships = enforceRequired
    ? relationships.filter(relationship => getRelationshipInfo(target, relationship).required)
    : [];

  const resourceSchema = {
    type: 'object',
    required: [
      'type',
      ...(requiredAttributes.length > 0 ? ['attributes'] : []),
      ...(requiredRelationships.length > 0 ? ['relationships'] : []),
    ],
    properties: {
      id: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: [type],
      },
      attributes: {
        type: 'object',
        required: requiredAttributes,
        properties: attributes.reduce((acc, attribute) => {
          const { name, schema: attributeSchema } = getAttributeInfo(target, attribute);
          return {
            ...acc,
            [name]: attributeSchema ? { oneOf: [attributeSchema, { type: 'null' }] } : {},
          };
        }, {}),
      },
      relationships: {
        type: 'object',
        required: requiredRelationships,
        properties: relationships.reduce((acc, relationship) => {
          const { name, type: relationshipType, RelatedClass } = getRelationshipInfo(
            target,
            relationship,
          );
          const relatedTarget = new RelatedClass();
          const { type: relatedType } = getResourceInfo(relatedTarget);

          const relatedSchema = {
            type: 'object',
            required: ['id', 'type'],
            properties: {
              id: {
                type: 'string',
              },
              type: {
                type: 'string',
                enum: [relatedType],
              },
            },
          };

          if (relationshipType === RelationshipType.ToOne) {
            return {
              ...acc,
              [name]: {
                oneOf: [
                  {
                    type: 'object',
                    required: ['data'],
                    properties: {
                      data: relatedSchema,
                    },
                  },
                  { type: 'null' },
                ],
              },
            };
          }
          return {
            ...acc,
            [name]: {
              oneOf: [
                {
                  type: 'object',
                  required: ['data'],
                  properties: {
                    data: {
                      type: 'array',
                      items: relatedSchema,
                    },
                  },
                },
                { type: 'null' },
              ],
            },
          };
        }, {}),
      },
    },
  };

  const schema = !array
    ? {
        type: 'object',
        required: ['data'],
        properties: {
          data: resourceSchema,
        },
      }
    : {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'array',
            items: resourceSchema,
          },
        },
      };

  const validate = ajv.compile(schema);
  const valid = validate(request);

  if (!valid) {
    return {
      valid: false,
      errors: validate
        .errors!.filter(error => error.keyword !== 'oneOf' && error.message !== 'should be null')
        .map(error => ({
          message: messageFromError(error),
          pointer: pointerFromPath(error.dataPath),
        })),
    };
  }
  return { valid: true };
}
