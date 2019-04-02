import {
  fromJsonApi,
  fromJsonApiArray,
  resource,
  attribute,
  relationship,
  errorToJsonApi,
} from '../index';

describe('fromJsonApi', () => {
  describe('successful', () => {
    it('should instantiate an empty resource', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {}

      const person = fromJsonApi({ data: { type: 'person' } }, Person);
      expect(person).toBeInstanceOf(Person);
    });

    it('should instantiate a resource with an id', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        constructor(public id?: string) {}
      }

      const person = fromJsonApi({ data: { id: 'abc-123', type: 'person' } }, Person);
      expect(person.id).toBe('abc-123');
    });

    it('should populate an attribute', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        @attribute()
        public name?: string;

        constructor(public id?: string) {}
      }

      const person = fromJsonApi(
        {
          data: {
            id: 'abc-123',
            type: 'person',
            attributes: {
              name: 'Drew',
            },
          },
        },
        Person,
      );
      expect(person.name).toBe('Drew');
    });

    it('should populate a renamed attribute', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        @attribute({ as: 'fullName' })
        public name?: string;

        constructor(public id?: string) {}
      }

      const person = fromJsonApi(
        {
          data: {
            id: 'abc-123',
            type: 'person',
            attributes: {
              fullName: 'Drew',
            },
          },
        },
        Person,
      );
      expect(person.name).toBe('Drew');
    });

    it('should leave a missing attribute undefined', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        @attribute()
        public name?: string;

        @attribute()
        public bio?: string;

        constructor(public id?: string) {}
      }

      const person = fromJsonApi(
        {
          data: {
            id: 'abc-123',
            type: 'person',
            attributes: {
              name: 'Drew',
            },
          },
        },
        Person,
      );
      expect(person.bio).toBeUndefined();
    });

    it('should populate a relationship', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        constructor(public id?: string) {}
      }

      @resource({ type: 'post', path: '/posts' })
      class Post {
        constructor(public id?: string) {}

        @relationship({ toOne: Person })
        public author?: Person;
      }

      const post = fromJsonApi(
        {
          data: {
            id: 'abc-123',
            type: 'post',
            relationships: { author: { data: { id: 'def-456', type: 'person' } } },
          },
        },
        Post,
      );

      expect(post.author).toBeInstanceOf(Person);
      expect(post.author!.id).toBe('def-456');
    });

    it('should populate a renamed relationship', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        constructor(public id?: string) {}
      }

      @resource({ type: 'post', path: '/posts' })
      class Post {
        constructor(public id?: string) {}

        @relationship({ toOne: Person, as: 'writer' })
        public author?: Person;
      }

      const post = fromJsonApi(
        {
          data: {
            id: 'abc-123',
            type: 'post',
            relationships: { writer: { data: { id: 'def-456', type: 'person' } } },
          },
        },
        Post,
      );

      expect(post.author).toBeInstanceOf(Person);
      expect(post.author!.id).toBe('def-456');
    });

    it('it should populate a relationship array', () => {
      @resource({ type: 'comment', path: '/comments' })
      class Comment {
        constructor(public id?: string) {}
      }

      @resource({ type: 'post', path: '/posts' })
      class Post {
        @relationship({ toMany: Comment })
        public comments?: Comment[];

        constructor(public id?: string) {}
      }

      const post = fromJsonApi(
        {
          data: {
            id: 'abc-123',
            type: 'post',
            relationships: {
              comments: {
                data: [{ id: 'def-456', type: 'comment' }, { id: 'ghi-789', type: 'comment' }],
              },
            },
          },
        },
        Post,
      );

      expect(post.comments).toHaveLength(2);
      expect(post.comments![0]).toBeInstanceOf(Comment);
      expect(post.comments![0].id).toBe('def-456');
      expect(post.comments![1]).toBeInstanceOf(Comment);
      expect(post.comments![1].id).toBe('ghi-789');
    });

    it('should leave an empty relationship undefined', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        constructor(public id?: string) {}
      }

      @resource({ type: 'post', path: '/posts' })
      class Post {
        constructor(public id?: string) {}

        @relationship({ toOne: Person })
        public author?: Person;

        @relationship({ toOne: Person })
        public coauthor?: Person;
      }

      const post = fromJsonApi(
        {
          data: {
            id: 'abc-123',
            type: 'post',
            relationships: {
              author: {
                data: { id: 'def-456', type: 'person' },
              },
            },
          },
        },
        Post,
      );

      expect(post.coauthor).toBeUndefined();
    });

    it('should leave an empty relationship array undefined', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        constructor(public id?: string) {}
      }

      @resource({ type: 'post', path: '/posts' })
      class Post {
        constructor(public id?: string) {}

        @relationship({ toOne: Person })
        public author?: Person;

        @relationship({ toMany: Person })
        public contributors?: Person[];
      }

      const post = fromJsonApi(
        {
          data: {
            id: 'abc-123',
            type: 'post',
            relationships: {
              author: {
                data: { id: 'def-456', type: 'person' },
              },
            },
          },
        },
        Post,
      );

      expect(post.contributors).toBeUndefined();
    });

    it('it should populate an array', () => {
      @resource({ type: 'post', path: '/posts' })
      class Post {
        constructor(public id?: string) {}
      }

      const posts = fromJsonApiArray(
        {
          data: [
            {
              id: 'abc-123',
              type: 'post',
            },
            { id: 'def-456', type: 'post' },
          ],
        },
        Post,
      );

      expect(posts).toHaveLength(2);
    });
  });

  describe('failure', () => {
    const convertError = errorToJsonApi;

    @resource({ type: 'person', path: '/people' })
    class Person {
      constructor(public id?: string) {}
    }

    @resource({ type: 'comment', path: '/comments' })
    class Comment {
      constructor(public id?: string) {}
    }

    @resource({ type: 'post', path: '/posts' })
    class Post {
      @attribute({ schema: { type: 'string' } })
      public title?: string | null;

      @attribute()
      public deck?: string | null;

      @attribute({ schema: { type: 'string', enum: ['jsonapi', 'typescript', 'api'] } })
      public topic?: string | null;

      @relationship({ toOne: Person })
      public author?: Person | null;

      @relationship({ toMany: Comment })
      public comments?: Comment[] | null;

      constructor(public id?: string) {}
    }

    it('should throw if request is not an object', () => {
      let result: any;
      try {
        fromJsonApi(false, Post);
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: 'should be object',
            source: { pointer: '/' },
          },
        ],
      });
    });

    it('should throw if request object does not have data property', () => {
      let result: any;
      try {
        fromJsonApi({}, Post);
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: "should have required property 'data'",
            source: { pointer: '/' },
          },
        ],
      });
    });

    it('should throw if data is not an object', () => {
      let result: any;
      try {
        fromJsonApi({ data: false }, Post);
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: 'should be object',
            source: { pointer: '/data' },
          },
        ],
      });
    });

    it('should throw if type is not defined', () => {
      let result: any;
      try {
        fromJsonApi({ data: {} }, Post);
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: "should have required property 'type'",
            source: { pointer: '/data' },
          },
        ],
      });
    });

    it('should throw if type does not match expected', () => {
      let result: any;
      try {
        fromJsonApi({ data: { type: 'garbage' } }, Post);
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: "should be 'post'",
            source: { pointer: '/data/type' },
          },
        ],
      });
    });

    it('should throw if attributes is not an object', () => {
      let result: any;
      try {
        fromJsonApi({ data: { type: 'post', attributes: false } }, Post);
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: 'should be object',
            source: { pointer: '/data/attributes' },
          },
        ],
      });
    });

    it('should throw if attribute does not match custom schema', () => {
      let result: any;
      try {
        fromJsonApi({ data: { type: 'post', attributes: { title: false } } }, Post);
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: 'should be string',
            source: { pointer: '/data/attributes/title' },
          },
        ],
      });
    });

    it('should show all options if custom schema uses enum', () => {
      let result: any;
      try {
        fromJsonApi({ data: { type: 'post', attributes: { topic: 'garbage' } } }, Post);
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: "should be one of ['jsonapi', 'typescript', 'api']",
            source: { pointer: '/data/attributes/topic' },
          },
        ],
      });
    });

    it('should not throw if attribute without custom schema set to null', () => {
      expect(() => {
        fromJsonApi({ data: { type: 'post', attributes: { deck: null } } }, Post);
      }).not.toThrow();
    });

    it('should not throw if attribute with custom schema set to null', () => {
      expect(() => {
        fromJsonApi({ data: { type: 'post', attributes: { title: null } } }, Post);
      }).not.toThrow();
    });

    it('should throw if relationships is not an object', () => {
      let result: any;
      try {
        fromJsonApi({ data: { type: 'post', relationships: false } }, Post);
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: 'should be object',
            source: { pointer: '/data/relationships' },
          },
        ],
      });
    });

    it('should not throw if relationship is null', () => {
      expect(() => {
        fromJsonApi({ data: { type: 'post', relationships: { author: null } } }, Post);
      }).not.toThrow();
    });

    it('should throw if relationship is not an object', () => {
      let result: any;
      try {
        fromJsonApi({ data: { type: 'post', relationships: { author: false } } }, Post);
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: 'should be object',
            source: { pointer: '/data/relationships/author' },
          },
        ],
      });
    });

    it('should throw if relationship is missing id', () => {
      let result: any;
      try {
        fromJsonApi(
          { data: { type: 'post', relationships: { author: { data: { type: 'person' } } } } },
          Post,
        );
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: "should have required property 'id'",
            source: { pointer: '/data/relationships/author/data' },
          },
        ],
      });
    });

    it('should throw if relationship is missing type', () => {
      let result: any;
      try {
        fromJsonApi(
          { data: { type: 'post', relationships: { author: { data: { id: 'abc-123' } } } } },
          Post,
        );
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: "should have required property 'type'",
            source: { pointer: '/data/relationships/author/data' },
          },
        ],
      });
    });

    it('should throw if relationship type does not match expected', () => {
      let result: any;
      try {
        fromJsonApi(
          {
            data: {
              type: 'post',
              relationships: { author: { data: { id: 'abc-123', type: 'garbage' } } },
            },
          },
          Post,
        );
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: "should be 'person'",
            source: { pointer: '/data/relationships/author/data/type' },
          },
        ],
      });
    });

    it('should throw if relationship array is missing id', () => {
      let result: any;
      try {
        fromJsonApi(
          { data: { type: 'post', relationships: { comments: { data: [{ type: 'comment' }] } } } },
          Post,
        );
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: "should have required property 'id'",
            source: { pointer: '/data/relationships/comments/data/0' },
          },
        ],
      });
    });

    it('should throw if relationship array is missing type', () => {
      let result: any;
      try {
        fromJsonApi(
          { data: { type: 'post', relationships: { comments: { data: [{ id: 'abc-123' }] } } } },
          Post,
        );
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: "should have required property 'type'",
            source: { pointer: '/data/relationships/comments/data/0' },
          },
        ],
      });
    });

    it('should throw if relationship array type does not match expected', () => {
      let result: any;
      try {
        fromJsonApi(
          {
            data: {
              type: 'post',
              relationships: { comments: { data: [{ id: 'abc-123', type: 'garbage' }] } },
            },
          },
          Post,
        );
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: "should be 'comment'",
            source: { pointer: '/data/relationships/comments/data/0/type' },
          },
        ],
      });
    });

    it('should throw if passing single relationship to relationship array', () => {
      let result: any;
      try {
        fromJsonApi(
          {
            data: {
              type: 'post',
              relationships: { comments: { data: { id: 'abc-123', type: 'comment' } } },
            },
          },
          Post,
        );
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: 'should be array',
            source: { pointer: '/data/relationships/comments/data' },
          },
        ],
      });
    });

    it('should throw if passing relationship array to single relationship', () => {
      let result: any;
      try {
        fromJsonApi(
          {
            data: {
              type: 'post',
              relationships: { author: { data: [{ id: 'abc-123', type: 'person' }] } },
            },
          },
          Post,
        );
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: 'should be object',
            source: { pointer: '/data/relationships/author/data' },
          },
        ],
      });
    });

    it('should throw if passing object to fromJsonApiArray', () => {
      let result: any;
      try {
        fromJsonApiArray(
          {
            data: {
              type: 'post',
            },
          },
          Post,
        );
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: 'should be array',
            source: { pointer: '/data' },
          },
        ],
      });
    });

    it('should throw if passing array to fromJsonApi', () => {
      let result: any;
      try {
        fromJsonApi(
          {
            data: [
              {
                type: 'post',
              },
            ],
          },
          Post,
        );
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: 'should be object',
            source: { pointer: '/data' },
          },
        ],
      });
    });

    it('should throw if not passing attributes when an attribute marked as required', () => {
      let result: any;
      try {
        fromJsonApi(
          {
            data: {
              type: 'post',
            },
          },
          Post,
          { required: ['title'] },
        );
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: "should have required property 'attributes'",
            source: { pointer: '/data' },
          },
        ],
      });
    });

    it('should throw if not passing attribute marked as required', () => {
      let result: any;
      try {
        fromJsonApi(
          {
            data: {
              type: 'post',
              attributes: {},
            },
          },
          Post,
          { required: ['title'] },
        );
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: "should have required property 'title'",
            source: { pointer: '/data/attributes' },
          },
        ],
      });
    });

    it('should throw if not passing relationships when a relationship marked as required', () => {
      let result: any;
      try {
        fromJsonApi(
          {
            data: {
              type: 'post',
            },
          },
          Post,
          { required: ['author'] },
        );
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: "should have required property 'relationships'",
            source: { pointer: '/data' },
          },
        ],
      });
    });

    it('should throw if not passing a relationship marked as required', () => {
      let result: any;
      try {
        fromJsonApi(
          {
            data: {
              type: 'post',
              relationships: {},
            },
          },
          Post,
          { required: ['author'] },
        );
      } catch (error) {
        result = convertError(error);
      }
      expect(result).toEqual({
        errors: [
          {
            id: expect.any(String),
            status: '400',
            title: 'Validation Error',
            description: "should have required property 'author'",
            source: { pointer: '/data/relationships' },
          },
        ],
      });
    });
  });
});
