/* eslint-disable no-new */
import { resource, resourceId, attribute, relationship } from '../index';

describe('decorators', () => {
  describe('resource', () => {
    it('should throw if type is not valid', () => {
      expect(() => {
        @resource({ type: '_bad', path: '/bad' })
        class Bad {}
        new Bad();
      }).toThrow('_bad is not a valid type name');
    });

    it('should throw if resourceId is not a string', () => {
      expect(() => {
        @resource({ type: 'bad', path: '/bad' })
        class Bad {
          @resourceId()
          public id?: number;
        }
        new Bad();
      }).toThrow('resourceId() must be used on a string member');
    });
  });

  describe('attribute', () => {
    it('should throw if attribute has invalid name', () => {
      expect(() => {
        @resource({ type: 'bad', path: '/bad' })
        class Bad {
          @attribute()
          public _bad?: string;
        }
        new Bad();
      }).toThrow('_bad is not a valid attribute name');
    });

    it('should throw if renamed attribute has invalid name', () => {
      expect(() => {
        @resource({ type: 'bad', path: '/bad' })
        class Bad {
          @attribute({ as: '_bad' })
          public bad?: string;
        }
        new Bad();
      }).toThrow('_bad is not a valid attribute name');
    });
  });

  describe('relationship', () => {
    it('should throw if relationship has invalid name', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {}

      expect(() => {
        @resource({ type: 'post', path: '/posts' })
        class Post {
          @relationship({ toOne: Person })
          public _author?: Person;
        }
        new Post();
      }).toThrow('_author is not a valid relationship name');
    });

    it('should throw if renamed relationship has invalid name', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {}

      expect(() => {
        @resource({ type: 'post', path: '/posts' })
        class Post {
          @relationship({ toOne: Person, as: '_author' })
          public author?: Person;
        }
        new Post();
      }).toThrow('_author is not a valid relationship name');
    });
  });
});
