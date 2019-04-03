import uniqWith from 'lodash/uniqWith';
import set from 'lodash/set';

import { isResource, getResourceId, getResourceInfo } from '../decorators/resource';
import { getAttributeInfo, getAttributeList } from '../decorators/attribute';
import {
  getRelationshipList,
  getRelationshipInfo,
  RelationshipType,
} from '../decorators/relationship';
import { JsonApiError, CombinedJsonApiError } from '../errors';

type JsonApiVersion = '1.0' | '1.1';

interface SerializationResult {
  data: SerializedResource | SerializedResource[];
  included?: SerializedResource[];
  jsonapi?: { version: JsonApiVersion };
  meta?: {};
}

interface ErrorSerializationResult {
  errors: {
    id: string;
    status: string;
    title: string;
    description: string;
    source?: {
      pointer?: string;
    };
  }[];
  jsonapi?: { version: JsonApiVersion };
  meta?: {};
}

interface SerializedRelationship {
  id: string;
  type: string;
}

interface SerializedResource {
  id: string;
  type: string;
  attributes?: {
    [name: string]: any;
  };
  relationships?: {
    [name: string]: {
      data: SerializedRelationship | SerializedRelationship[] | null;
      links?: { [name: string]: string };
    };
  };
  links?: {
    [name: string]: string;
  };
}

function relationshipToJsonApi(
  resource: any,
  { relationshipType }: { relationshipType: RelationshipType },
): SerializedRelationship | SerializedRelationship[] | null {
  if (relationshipType === RelationshipType.ToOne) {
    return resource ? { id: getResourceId(resource), type: getResourceInfo(resource).type } : null;
  }
  return (resource || []).map((res: any) => ({
    id: getResourceId(res),
    type: getResourceInfo(res).type,
  }));
}

function resourceToJsonApi(
  resource: any,
  {
    baseUrl,
    include,
    fields,
  }: { baseUrl: string; include: string[]; fields: { [resource: string]: string[] } },
): { data: SerializedResource; included: SerializedResource[] } {
  if (!isResource(resource)) {
    throw new Error('Only resources can be serialized (use the @resource decorator)');
  }

  const { type, path } = getResourceInfo(resource);
  const id = getResourceId(resource);

  const result: SerializedResource = {
    id,
    type,
  };
  const included: SerializedResource[] = [];

  for (const key of getAttributeList(resource)) {
    const { name } = getAttributeInfo(resource, key);
    if (!fields[type] || fields[type].indexOf(name) !== -1) {
      set(result, ['attributes', name], resource[key] || null);
    }
  }

  for (const key of getRelationshipList(resource)) {
    const {
      name: relationshipName,
      type: relationshipType,
      relatedLink,
      selfLink,
    } = getRelationshipInfo(resource, key);
    const relatedResource = resource[key];

    if (!fields[type] || fields[type].indexOf(relationshipName) !== -1) {
      const relationship: any = {
        data: relationshipToJsonApi(relatedResource, {
          relationshipType,
        }),
      };
      if (relatedLink) {
        set(
          relationship,
          ['links', 'related'],
          `${baseUrl}${path}/${getResourceId(resource)}/${relationshipName}`,
        );
      }
      if (selfLink) {
        set(
          relationship,
          ['links', 'self'],
          `${baseUrl}${path}/${getResourceId(resource)}/relationships/${relationshipName}`,
        );
      }
      set(result, ['relationships', relationshipName], relationship);

      const includeRelated = include.filter(i => i.startsWith(relationshipName)).length > 0;
      if (includeRelated && relatedResource) {
        const relatedResources =
          relationshipType === RelationshipType.ToOne ? [relatedResource] : relatedResource;
        const nestedInclude = include
          .filter(i => i.startsWith(`${relationshipName}.`))
          .map(i => i.substring(`${relationshipName}.`.length));

        for (const res of relatedResources) {
          const { data: relatedData, included: relatedIncluded } = resourceToJsonApi(res, {
            baseUrl,
            include: nestedInclude,
            fields,
          });
          included.push(relatedData);
          included.push(...relatedIncluded);
        }
      }
    }
  }

  result.links = {
    self: `${baseUrl}${path}/${getResourceId(resource)}`,
  };

  return { data: result, included };
}

export default function toJsonApi(
  resource: any,
  {
    baseUrl = '',
    include = [],
    fields = {},
    version,
    meta,
  }: {
    baseUrl?: string;
    include?: string[];
    fields?: { [resource: string]: string[] };
    version?: JsonApiVersion;
    meta?: {};
  } = {},
): SerializationResult {
  let included: SerializedResource[];
  let data: SerializedResource | SerializedResource[];

  if (Array.isArray(resource)) {
    data = [];
    included = [];
    for (const res of resource) {
      const { data: singleData, included: singleIncluded } = resourceToJsonApi(res, {
        baseUrl,
        include,
        fields,
      });
      data.push(singleData);
      included.push(...singleIncluded);
    }
  } else {
    ({ data, included } = resourceToJsonApi(resource, { baseUrl, include, fields }));
  }

  const result: SerializationResult = { data };

  if (included.length > 0) {
    result.included = uniqWith(
      included,
      (resA, resB) => resA.id === resB.id && resA.type === resB.type,
    );
  }

  if (version) {
    result.jsonapi = { version };
  }

  if (meta) {
    result.meta = meta;
  }

  return result;
}

export function errorToJsonApi(
  error: JsonApiError | CombinedJsonApiError,
  {
    version,
    meta,
  }: {
    version?: JsonApiVersion;
    meta?: {};
  } = {},
): ErrorSerializationResult {
  const result: ErrorSerializationResult = {
    errors: (error instanceof CombinedJsonApiError ? error.errors : [error]).map(err => ({
      id: err.id,
      status: err.status.toString(),
      title: err.title,
      description: err.description,
      ...(err.pointer
        ? {
            source: {
              pointer: err.pointer,
            },
          }
        : {}),
    })),
  };

  if (version) {
    result.jsonapi = { version };
  }

  if (meta) {
    result.meta = meta;
  }

  return result;
}
