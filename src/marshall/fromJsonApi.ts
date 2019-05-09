import { v4 as uuid } from 'uuid';
import { ResourceConstructor } from '../decorators/resource';
import { getAttributeList, getAttributeInfo } from '../decorators/attribute';
import {
  getRelationshipList,
  getRelationshipInfo,
  RelationshipType,
} from '../decorators/relationship';
import { JsonApiError, CombinedJsonApiError } from '../errors';
import validate from './validate';

interface SerializedRelationship {
  id: string;
  type: string;
}

interface SerializedResource {
  id?: string;
  type: string;
  attributes?: {
    [name: string]: any;
  };
  relationships?: {
    [name: string]: {
      data: SerializedRelationship | SerializedRelationship[];
    };
  };
}

function classFromJsonApi<T>(resource: SerializedResource, TargetClass: ResourceConstructor<T>): T {
  const result = new TargetClass(resource.id);

  if (resource.attributes) {
    for (const attribute of getAttributeList(result)) {
      const { name } = getAttributeInfo(result, attribute);
      result[attribute] = resource.attributes[name];
    }
  }

  if (resource.relationships) {
    for (const relationship of getRelationshipList(result)) {
      const {
        type: relationshipType,
        name: relationshipName,
        RelatedClass: RelationshipTargetClass,
      } = getRelationshipInfo(result, relationship);

      if (relationshipName in resource.relationships) {
        if (relationshipType === RelationshipType.ToOne) {
          const serializedRelationship = resource.relationships[relationshipName];
          result[relationship] = serializedRelationship
            ? new RelationshipTargetClass(
                (resource.relationships[relationshipName].data as SerializedRelationship).id,
              )
            : null;
        } else {
          (result as any)[relationship] = (resource.relationships[relationshipName]
            .data as SerializedRelationship[]).map(item => new RelationshipTargetClass(item.id));
        }
      }
    }
  }
  return result;
}

export function fromJsonApiArray<T>(request: unknown, TargetClass: ResourceConstructor<T>): T[] {
  const valid = validate(request, TargetClass, { array: true });

  if (!valid.valid) {
    throw new CombinedJsonApiError({
      status: 400,
      errors: valid.errors.map(
        error =>
          new JsonApiError({
            id: uuid(),
            title: 'Validation Error',
            description: error.message,
            status: 400,
            pointer: error.pointer,
          }),
      ),
    });
  }

  const { data: resources } = request as { data: SerializedResource[] };
  return resources.map(resource => classFromJsonApi(resource, TargetClass));
}

function fromJsonApi<T>(request: unknown, TargetClass: ResourceConstructor<T>): T {
  const valid = validate(request, TargetClass);

  if (!valid.valid) {
    throw new CombinedJsonApiError({
      status: 400,
      errors: valid.errors.map(
        error =>
          new JsonApiError({
            id: uuid(),
            title: 'Validation Error',
            description: error.message,
            status: 400,
            pointer: error.pointer,
          }),
      ),
    });
  }

  const { data: resource } = request as { data: SerializedResource };
  return classFromJsonApi(resource, TargetClass);
}
export default fromJsonApi;
