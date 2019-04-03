import { errorToJsonApi, CombinedJsonApiError, JsonApiError } from '../index';

describe('toJsonApiError', () => {
  it('should include jsonapi version if provided', () => {
    expect(
      errorToJsonApi(new CombinedJsonApiError({ status: 400, errors: [] }), { version: '1.1' }),
    ).toEqual({
      errors: [],
      jsonapi: {
        version: '1.1',
      },
    });
  });

  it('should include meta information if provided', () => {
    expect(
      errorToJsonApi(new CombinedJsonApiError({ status: 400, errors: [] }), {
        meta: { maintainer: 'Drew' },
      }),
    ).toEqual({
      errors: [],
      meta: {
        maintainer: 'Drew',
      },
    });
  });

  describe('multiple error', () => {
    it('should capture status', () => {
      expect(new CombinedJsonApiError({ status: 400, errors: [] }).status).toBe(400);
    });

    it('should serialize multiple errors', () => {
      expect(
        errorToJsonApi(
          new CombinedJsonApiError({
            status: 400,
            errors: [
              new JsonApiError({
                id: 'id1',
                status: 100,
                title: 'title1',
                description: 'description1',
                pointer: 'pointer1',
              }),
              new JsonApiError({
                id: 'id2',
                status: 200,
                title: 'title2',
                description: 'description2',
              }),
            ],
          }),
        ),
      ).toEqual({
        errors: [
          {
            id: 'id1',
            status: '100',
            title: 'title1',
            description: 'description1',
            source: {
              pointer: 'pointer1',
            },
          },
          {
            id: 'id2',
            status: '200',
            title: 'title2',
            description: 'description2',
          },
        ],
      });
    });
  });

  describe('single error', () => {
    it('should serialize a single error', () => {
      expect(
        errorToJsonApi(
          new JsonApiError({
            id: 'id',
            status: 400,
            title: 'title',
            description: 'description',
            pointer: 'pointer',
          }),
        ),
      ).toEqual({
        errors: [
          {
            id: 'id',
            status: '400',
            title: 'title',
            description: 'description',
            source: {
              pointer: 'pointer',
            },
          },
        ],
      });
    });

    it('should serialize a single error without a pointer', () => {
      expect(
        errorToJsonApi(
          new JsonApiError({
            id: 'id',
            status: 400,
            title: 'title',
            description: 'description',
          }),
        ),
      ).toEqual({
        errors: [
          {
            id: 'id',
            status: '400',
            title: 'title',
            description: 'description',
          },
        ],
      });
    });
  });
});
