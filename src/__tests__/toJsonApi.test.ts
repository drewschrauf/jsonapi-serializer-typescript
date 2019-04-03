import { toJsonApi, resource, resourceId, attribute, relationship } from '../index';

describe('toJsonApi', () => {
  it('should serialize an empty resource', () => {
    @resource({ type: 'person', path: '/people' })
    class Person {
      constructor(public id?: string) {}
    }

    const person = new Person('abc-123');
    expect(toJsonApi(person)).toEqual({
      data: {
        id: 'abc-123',
        type: 'person',
        links: {
          self: '/people/abc-123',
        },
      },
    });
  });

  it('should serialize with a custom id', () => {
    @resource({ type: 'person', path: '/people' })
    class Person {
      @resourceId()
      public userId?: string;

      constructor(userId?: string) {
        this.userId = userId;
      }
    }

    const person = new Person('abc-123');
    expect(toJsonApi(person)).toEqual({
      data: {
        id: 'abc-123',
        type: 'person',
        links: {
          self: '/people/abc-123',
        },
      },
    });
  });

  describe('attribute', () => {
    it('should serialize with an attribute', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        @attribute()
        public name?: string;

        constructor(public id?: string, name?: string) {
          this.name = name;
        }
      }

      const person = new Person('abc-123', 'Drew');
      expect(toJsonApi(person)).toEqual({
        data: {
          id: 'abc-123',
          type: 'person',
          attributes: {
            name: 'Drew',
          },
          links: {
            self: '/people/abc-123',
          },
        },
      });
    });

    it('should serialize with a custom named attribute', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        @attribute({ as: 'fullName' })
        public name?: string;

        constructor(public id?: string, name?: string) {
          this.name = name;
        }
      }

      const person = new Person('abc-123', 'Drew');
      expect(toJsonApi(person)).toEqual({
        data: {
          id: 'abc-123',
          type: 'person',
          attributes: {
            fullName: 'Drew',
          },
          links: {
            self: '/people/abc-123',
          },
        },
      });
    });

    it('should serialize with an empty attribute', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        @attribute()
        public name?: string;

        constructor(public id?: string, name?: string) {
          this.name = name;
        }
      }

      const person = new Person('abc-123');
      expect(toJsonApi(person)).toEqual({
        data: {
          id: 'abc-123',
          type: 'person',
          attributes: {
            name: null,
          },
          links: {
            self: '/people/abc-123',
          },
        },
      });
    });
  });

  describe('relationship', () => {
    it('should serialize with a relationship', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        @attribute()
        public name?: string;

        constructor(public id?: string, props?: { name?: string }) {
          if (props) {
            this.name = props.name;
          }
        }
      }

      @resource({ type: 'post', path: '/posts' })
      class Post {
        @relationship({ toOne: Person })
        public author?: Person;

        constructor(public id?: string, props?: { author?: Person }) {
          if (props) {
            this.author = props.author;
          }
        }
      }

      const post = new Post('abc-123', { author: new Person('def-456', { name: 'Drew' }) });
      expect(toJsonApi(post)).toEqual({
        data: {
          id: 'abc-123',
          type: 'post',
          relationships: {
            author: {
              data: {
                id: 'def-456',
                type: 'person',
              },
            },
          },
          links: {
            self: '/posts/abc-123',
          },
        },
      });
    });

    it('should serialize a custom named relationship', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        @attribute()
        public name?: string;

        constructor(public id?: string, props?: { name?: string }) {
          if (props) {
            this.name = props.name;
          }
        }
      }

      @resource({ type: 'post', path: '/posts' })
      class Post {
        @relationship({ toOne: Person, as: 'writer' })
        public author?: Person;

        constructor(public id?: string, props?: { author?: Person }) {
          if (props) {
            this.author = props.author;
          }
        }
      }

      const post = new Post('abc-123', { author: new Person('def-456', { name: 'Drew' }) });
      expect(toJsonApi(post)).toEqual({
        data: {
          id: 'abc-123',
          type: 'post',
          relationships: {
            writer: {
              data: {
                id: 'def-456',
                type: 'person',
              },
            },
          },
          links: {
            self: '/posts/abc-123',
          },
        },
      });
    });

    it('should serialize an empty relationship', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        @attribute()
        public name?: string;

        constructor(public id?: string, props?: { name?: string }) {
          if (props) {
            this.name = props.name;
          }
        }
      }

      @resource({ type: 'post', path: '/posts' })
      class Post {
        @relationship({ toOne: Person })
        public author?: Person;

        constructor(public id?: string, props?: { author?: Person }) {
          if (props) {
            this.author = props.author;
          }
        }
      }

      const post = new Post('abc-123');
      expect(toJsonApi(post)).toEqual({
        data: {
          id: 'abc-123',
          type: 'post',
          relationships: {
            author: {
              data: null,
            },
          },
          links: {
            self: '/posts/abc-123',
          },
        },
      });
    });

    it('should serialize a relationship array', () => {
      @resource({ type: 'comment', path: '/comments' })
      class Comment {
        @attribute()
        public text?: string;

        constructor(public id?: string, props?: { text?: string }) {
          if (props) {
            this.text = props.text;
          }
        }
      }

      @resource({ type: 'post', path: '/posts' })
      class Post {
        @relationship({ toMany: Comment })
        public comments?: Comment[];

        constructor(public id?: string, props?: { comments?: Comment[] }) {
          if (props) {
            this.comments = props.comments;
          }
        }
      }

      const post = new Post('abc-123', {
        comments: [
          new Comment('def-456', { text: 'post 1' }),
          new Comment('ghi-789', { text: 'post 2' }),
        ],
      });
      expect(toJsonApi(post)).toEqual({
        data: {
          id: 'abc-123',
          type: 'post',
          relationships: {
            comments: {
              data: [{ id: 'def-456', type: 'comment' }, { id: 'ghi-789', type: 'comment' }],
            },
          },
          links: {
            self: '/posts/abc-123',
          },
        },
      });
    });

    it('should serialize an empty relationship array', () => {
      @resource({ type: 'comment', path: '/comments' })
      class Comment {
        @attribute()
        public text?: string;

        constructor(public id?: string, props?: { text?: string }) {
          if (props) {
            this.text = props.text;
          }
        }
      }

      @resource({ type: 'post', path: '/posts' })
      class Post {
        @relationship({ toMany: Comment })
        public comments?: Comment[];

        constructor(public id?: string, props?: { comments?: Comment[] }) {
          if (props) {
            this.comments = props.comments;
          }
        }
      }

      const post = new Post('abc-123');
      expect(toJsonApi(post)).toEqual({
        data: {
          id: 'abc-123',
          type: 'post',
          relationships: {
            comments: {
              data: [],
            },
          },
          links: {
            self: '/posts/abc-123',
          },
        },
      });
    });

    it('should add a self link if configured', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        @attribute()
        public name?: string;

        constructor(public id?: string, props?: { name?: string }) {
          if (props) {
            this.name = props.name;
          }
        }
      }

      @resource({ type: 'post', path: '/posts' })
      class Post {
        @relationship({ toOne: Person, selfLink: true })
        public author?: Person;

        constructor(public id?: string, props?: { author?: Person }) {
          if (props) {
            this.author = props.author;
          }
        }
      }

      const post = new Post('abc-123', { author: new Person('def-456', { name: 'Drew' }) });
      expect(toJsonApi(post)).toEqual({
        data: {
          id: 'abc-123',
          type: 'post',
          relationships: {
            author: {
              data: {
                id: 'def-456',
                type: 'person',
              },
              links: {
                self: '/posts/abc-123/relationships/author',
              },
            },
          },
          links: {
            self: '/posts/abc-123',
          },
        },
      });
    });

    it('should add a related link if configured', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        @attribute()
        public name?: string;

        constructor(public id?: string, props?: { name?: string }) {
          if (props) {
            this.name = props.name;
          }
        }
      }

      @resource({ type: 'post', path: '/posts' })
      class Post {
        @relationship({ toOne: Person, relatedLink: true })
        public author?: Person;

        constructor(public id?: string, props?: { author?: Person }) {
          if (props) {
            this.author = props.author;
          }
        }
      }

      const post = new Post('abc-123', { author: new Person('def-456', { name: 'Drew' }) });
      expect(toJsonApi(post)).toEqual({
        data: {
          id: 'abc-123',
          type: 'post',
          relationships: {
            author: {
              data: {
                id: 'def-456',
                type: 'person',
              },
              links: {
                related: '/posts/abc-123/author',
              },
            },
          },
          links: {
            self: '/posts/abc-123',
          },
        },
      });
    });
  });

  describe('include', () => {
    it('should include a relationship', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        @attribute()
        public name?: string;

        constructor(public id?: string, props?: { name?: string }) {
          if (props) {
            this.name = props.name;
          }
        }
      }

      @resource({ type: 'post', path: '/posts' })
      class Post {
        @relationship({ toOne: Person })
        public author?: Person;

        constructor(public id?: string, props?: { author?: Person }) {
          if (props) {
            this.author = props.author;
          }
        }
      }

      const post = new Post('abc-123', { author: new Person('def-456', { name: 'Drew' }) });
      expect(toJsonApi(post, { include: ['author'] })).toEqual({
        data: {
          id: 'abc-123',
          type: 'post',
          relationships: {
            author: {
              data: {
                id: 'def-456',
                type: 'person',
              },
            },
          },
          links: {
            self: '/posts/abc-123',
          },
        },
        included: [
          {
            id: 'def-456',
            type: 'person',
            attributes: { name: 'Drew' },
            links: { self: '/people/def-456' },
          },
        ],
      });
    });

    it('should include multiple relationships with matching IDs but non-matching types', () => {
      @resource({ type: 'image', path: '/images' })
      class Image {
        @attribute()
        public url?: string;

        constructor(public id?: string, props?: { url?: string }) {
          if (props) {
            this.url = props.url;
          }
        }
      }

      @resource({ type: 'person', path: '/people' })
      class Person {
        @attribute()
        public name?: string;

        constructor(public id?: string, props?: { name?: string }) {
          if (props) {
            this.name = props.name;
          }
        }
      }

      @resource({ type: 'post', path: '/posts' })
      class Post {
        @relationship({ toOne: Person })
        public author?: Person;

        @relationship({ toOne: Image })
        public image?: Image;

        constructor(public id?: string, props?: { author?: Person; image?: Image }) {
          if (props) {
            this.author = props.author;
            this.image = props.image;
          }
        }
      }

      const post = new Post('abc-123', {
        author: new Person('def-456', { name: 'Drew' }),
        image: new Image('def-456', { url: 'http://example.com/def-456' }),
      });
      expect(toJsonApi(post, { include: ['author', 'image'] })).toEqual({
        data: {
          id: 'abc-123',
          type: 'post',
          relationships: {
            author: {
              data: {
                id: 'def-456',
                type: 'person',
              },
            },
            image: {
              data: {
                id: 'def-456',
                type: 'image',
              },
            },
          },
          links: {
            self: '/posts/abc-123',
          },
        },
        included: [
          {
            id: 'def-456',
            type: 'person',
            attributes: { name: 'Drew' },
            links: { self: '/people/def-456' },
          },
          {
            id: 'def-456',
            type: 'image',
            attributes: {
              url: 'http://example.com/def-456',
            },
            links: {
              self: '/images/def-456',
            },
          },
        ],
      });
    });

    it('should include a relationship array', () => {
      @resource({ type: 'comment', path: '/comments' })
      class Comment {
        @attribute()
        public text?: string;

        constructor(public id?: string, props?: { text?: string }) {
          if (props) {
            this.text = props.text;
          }
        }
      }

      @resource({ type: 'post', path: '/posts' })
      class Post {
        @relationship({ toMany: Comment })
        public comments?: Comment[];

        constructor(public id?: string, props?: { comments?: Comment[] }) {
          if (props) {
            this.comments = props.comments;
          }
        }
      }

      const post = new Post('abc-123', {
        comments: [
          new Comment('def-456', { text: 'First!' }),
          new Comment('ghi-789', { text: 'Second!' }),
        ],
      });
      expect(toJsonApi(post, { include: ['comments'] })).toEqual({
        data: {
          id: 'abc-123',
          type: 'post',
          relationships: {
            comments: {
              data: [{ id: 'def-456', type: 'comment' }, { id: 'ghi-789', type: 'comment' }],
            },
          },
          links: {
            self: '/posts/abc-123',
          },
        },
        included: [
          {
            id: 'def-456',
            type: 'comment',
            attributes: { text: 'First!' },
            links: { self: '/comments/def-456' },
          },
          {
            id: 'ghi-789',
            type: 'comment',
            attributes: { text: 'Second!' },
            links: { self: '/comments/ghi-789' },
          },
        ],
      });
    });

    it('should include a relationship of a relationship', () => {
      @resource({ type: 'image', path: '/images' })
      class Image {
        @attribute()
        public url?: string;

        constructor(public id?: string, props?: { url?: string }) {
          if (props) {
            this.url = props.url;
          }
        }
      }

      @resource({ type: 'person', path: '/people' })
      class Person {
        @attribute()
        public name?: string;

        @relationship({ toOne: Image })
        public picture?: Image;

        constructor(public id?: string, props?: { name?: string; picture?: Image }) {
          if (props) {
            this.name = props.name;
            this.picture = props.picture;
          }
        }
      }

      @resource({ type: 'post', path: '/posts' })
      class Post {
        @relationship({ toOne: Person })
        public author?: Person;

        constructor(public id?: string, props?: { author?: Person }) {
          if (props) {
            this.author = props.author;
          }
        }
      }

      const post = new Post('abc-123', {
        author: new Person('def-456', {
          name: 'Drew',
          picture: new Image('ghi-789', { url: 'http://assets.example.com/ghi-789' }),
        }),
      });
      expect(toJsonApi(post, { include: ['author', 'author.picture'] })).toEqual({
        data: {
          id: 'abc-123',
          type: 'post',
          relationships: {
            author: {
              data: {
                id: 'def-456',
                type: 'person',
              },
            },
          },
          links: {
            self: '/posts/abc-123',
          },
        },
        included: [
          {
            id: 'def-456',
            type: 'person',
            attributes: { name: 'Drew' },
            relationships: {
              picture: {
                data: {
                  id: 'ghi-789',
                  type: 'image',
                },
              },
            },
            links: { self: '/people/def-456' },
          },
          {
            id: 'ghi-789',
            type: 'image',
            attributes: {
              url: 'http://assets.example.com/ghi-789',
            },
            links: {
              self: '/images/ghi-789',
            },
          },
        ],
      });
    });

    it('should include a relationship of a relationship automatically', () => {
      @resource({ type: 'image', path: '/images' })
      class Image {
        @attribute()
        public url?: string;

        constructor(public id?: string, props?: { url?: string }) {
          if (props) {
            this.url = props.url;
          }
        }
      }

      @resource({ type: 'person', path: '/people' })
      class Person {
        @attribute()
        public name?: string;

        @relationship({ toOne: Image })
        public picture?: Image;

        constructor(public id?: string, props?: { name?: string; picture?: Image }) {
          if (props) {
            this.name = props.name;
            this.picture = props.picture;
          }
        }
      }

      @resource({ type: 'post', path: '/posts' })
      class Post {
        @relationship({ toOne: Person })
        public author?: Person;

        constructor(public id?: string, props?: { author?: Person }) {
          if (props) {
            this.author = props.author;
          }
        }
      }

      const post = new Post('abc-123', {
        author: new Person('def-456', {
          name: 'Drew',
          picture: new Image('ghi-789', { url: 'http://assets.example.com/ghi-789' }),
        }),
      });
      expect(toJsonApi(post, { include: ['author.picture'] })).toEqual({
        data: {
          id: 'abc-123',
          type: 'post',
          relationships: {
            author: {
              data: {
                id: 'def-456',
                type: 'person',
              },
            },
          },
          links: {
            self: '/posts/abc-123',
          },
        },
        included: [
          {
            id: 'def-456',
            type: 'person',
            attributes: { name: 'Drew' },
            relationships: {
              picture: {
                data: {
                  id: 'ghi-789',
                  type: 'image',
                },
              },
            },
            links: { self: '/people/def-456' },
          },
          {
            id: 'ghi-789',
            type: 'image',
            attributes: {
              url: 'http://assets.example.com/ghi-789',
            },
            links: {
              self: '/images/ghi-789',
            },
          },
        ],
      });
    });

    it('should not include the same relationship twice', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        @attribute()
        public name?: string;

        constructor(public id?: string, props?: { name?: string }) {
          if (props) {
            this.name = props.name;
          }
        }
      }

      @resource({ type: 'comment', path: '/comments' })
      class Comment {
        @attribute()
        public text?: string;

        @relationship({ toOne: Person })
        public author?: Person;

        constructor(public id?: string, props?: { text?: string; author?: Person }) {
          if (props) {
            this.text = props.text;
            this.author = props.author;
          }
        }
      }

      @resource({ type: 'post', path: '/posts' })
      class Post {
        @relationship({ toOne: Person })
        public author?: Person;

        @relationship({ toMany: Comment })
        public comments?: Comment[];

        constructor(public id?: string, props?: { author?: Person; comments?: Comment[] }) {
          if (props) {
            this.author = props.author;
            this.comments = props.comments;
          }
        }
      }

      const author = new Person('def-456', {
        name: 'Drew',
      });
      const post = new Post('abc-123', {
        author,
        comments: [new Comment('ghi-789', { text: 'First!', author })],
      });
      expect(toJsonApi(post, { include: ['author', 'comments', 'comments.author'] })).toEqual({
        data: {
          id: 'abc-123',
          type: 'post',
          relationships: {
            author: {
              data: {
                id: 'def-456',
                type: 'person',
              },
            },
            comments: {
              data: [{ id: 'ghi-789', type: 'comment' }],
            },
          },
          links: {
            self: '/posts/abc-123',
          },
        },
        included: [
          {
            id: 'def-456',
            type: 'person',
            attributes: { name: 'Drew' },
            links: { self: '/people/def-456' },
          },
          {
            id: 'ghi-789',
            type: 'comment',
            attributes: {
              text: 'First!',
            },
            relationships: {
              author: {
                data: {
                  id: 'def-456',
                  type: 'person',
                },
              },
            },
            links: {
              self: '/comments/ghi-789',
            },
          },
        ],
      });
    });
  });

  describe('array', () => {
    it('should serialize an array', () => {
      @resource({ type: 'post', path: '/posts' })
      class Post {
        @attribute()
        public title?: string;

        constructor(public id?: string, props?: { title?: string }) {
          if (props) {
            this.title = props.title;
          }
        }
      }

      const posts = [
        new Post('abc-123', { title: 'First post' }),
        new Post('def-456', { title: 'Second post' }),
      ];
      expect(toJsonApi(posts)).toEqual({
        data: [
          {
            id: 'abc-123',
            type: 'post',
            attributes: { title: 'First post' },
            links: { self: '/posts/abc-123' },
          },
          {
            id: 'def-456',
            type: 'post',
            attributes: { title: 'Second post' },
            links: { self: '/posts/def-456' },
          },
        ],
      });
    });

    it('should serialize an array with included relationships', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        @attribute()
        public name?: string;

        constructor(public id?: string, props?: { name?: string }) {
          if (props) {
            this.name = props.name;
          }
        }
      }

      @resource({ type: 'post', path: '/posts' })
      class Post {
        @attribute()
        public title?: string;

        @relationship({ toOne: Person })
        public author?: Person;

        constructor(public id?: string, props?: { title?: string; author?: Person }) {
          if (props) {
            this.title = props.title;
            this.author = props.author;
          }
        }
      }

      const posts = [
        new Post('abc-123', {
          title: 'First post',
          author: new Person('ghi-789', { name: 'Drew' }),
        }),
        new Post('def-456', {
          title: 'Second post',
          author: new Person('jkl-098', { name: 'Steve' }),
        }),
      ];
      expect(toJsonApi(posts, { include: ['author'] })).toEqual({
        data: [
          {
            id: 'abc-123',
            type: 'post',
            attributes: { title: 'First post' },
            relationships: {
              author: { data: { id: 'ghi-789', type: 'person' } },
            },
            links: { self: '/posts/abc-123' },
          },
          {
            id: 'def-456',
            type: 'post',
            attributes: { title: 'Second post' },
            relationships: {
              author: { data: { id: 'jkl-098', type: 'person' } },
            },
            links: { self: '/posts/def-456' },
          },
        ],
        included: [
          {
            id: 'ghi-789',
            type: 'person',
            attributes: { name: 'Drew' },
            links: { self: '/people/ghi-789' },
          },
          {
            id: 'jkl-098',
            type: 'person',
            attributes: { name: 'Steve' },
            links: { self: '/people/jkl-098' },
          },
        ],
      });
    });
  });

  describe('fields', () => {
    it('should support sparse fieldsets on attributes', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        @attribute()
        public name?: string;

        @attribute()
        public bio?: string;

        constructor(public id?: string, props?: { name?: string; bio?: string }) {
          if (props) {
            this.name = props.name;
            this.bio = props.bio;
          }
        }
      }

      const person = new Person('abc-123', { name: 'Drew', bio: 'is a person' });
      expect(toJsonApi(person, { fields: { person: ['name'] } })).toEqual({
        data: {
          id: 'abc-123',
          type: 'person',
          attributes: {
            name: 'Drew',
          },
          links: {
            self: '/people/abc-123',
          },
        },
      });
    });

    it('should support sparse fieldsets on relationships', () => {
      @resource({ type: 'image', path: '/images' })
      class Image {
        constructor(public id?: string) {}
      }

      @resource({ type: 'person', path: '/people' })
      class Person {
        @relationship({ toOne: Image })
        public picture?: Image;

        @relationship({ toOne: Image })
        public background?: Image;

        constructor(public id?: string, props?: { picture?: Image; background?: Image }) {
          if (props) {
            this.picture = props.picture;
            this.background = props.background;
          }
        }
      }

      const person = new Person('abc-123', {
        picture: new Image('def-456'),
        background: new Image('ghi-789'),
      });
      expect(toJsonApi(person, { fields: { person: ['picture'] } })).toEqual({
        data: {
          id: 'abc-123',
          type: 'person',
          relationships: {
            picture: {
              data: {
                id: 'def-456',
                type: 'image',
              },
            },
          },
          links: {
            self: '/people/abc-123',
          },
        },
      });
    });

    it('should support sparse fieldsets on included relationships', () => {
      @resource({ type: 'person', path: '/people' })
      class Person {
        @attribute()
        public name?: string;

        @attribute()
        public bio?: string;

        constructor(public id?: string, props?: { name?: string; bio?: string }) {
          if (props) {
            this.name = props.name;
            this.bio = props.bio;
          }
        }
      }

      @resource({ type: 'post', path: '/posts' })
      class Post {
        @relationship({ toOne: Person })
        public author?: Person;

        constructor(public id?: string, props?: { author?: Person }) {
          if (props) {
            this.author = props.author;
          }
        }
      }

      const post = new Post('abc-123', {
        author: new Person('def-456', { name: 'Drew', bio: 'is a person' }),
      });
      expect(toJsonApi(post, { include: ['author'], fields: { person: ['name'] } })).toEqual({
        data: {
          id: 'abc-123',
          type: 'post',
          relationships: {
            author: {
              data: {
                id: 'def-456',
                type: 'person',
              },
            },
          },
          links: {
            self: '/posts/abc-123',
          },
        },
        included: [
          {
            id: 'def-456',
            type: 'person',
            attributes: { name: 'Drew' },
            links: { self: '/people/def-456' },
          },
        ],
      });
    });
  });

  it('should baseUrl for links if provided', () => {
    @resource({ type: 'post', path: '/posts' })
    class Post {
      constructor(public id?: string) {}
    }

    const post = new Post('abc-123');
    expect(toJsonApi(post, { baseUrl: 'http://example.com' })).toEqual({
      data: {
        id: 'abc-123',
        type: 'post',
        links: {
          self: 'http://example.com/posts/abc-123',
        },
      },
    });
  });

  it('should include version information if provided', () => {
    @resource({ type: 'dummy', path: '/dummy' })
    class Dummy {
      constructor(public id?: string) {}
    }

    const dummy = new Dummy('abc-123');
    expect(toJsonApi(dummy, { version: '1.1' }).jsonapi).toEqual({ version: '1.1' });
  });

  it('should include meta information if provided', () => {
    @resource({ type: 'dummy', path: '/dummy' })
    class Dummy {
      constructor(public id?: string) {}
    }

    const dummy = new Dummy('abc-123');
    expect(toJsonApi(dummy, { meta: { maintainer: 'Drew' } }).meta).toEqual({ maintainer: 'Drew' });
  });

  describe('failure', () => {
    it('should throw if attempting to serialize a non-resource', () => {
      class Dummy {
        constructor(public id?: string) {}
      }

      const dummy = new Dummy('abc-123');
      expect(() => {
        toJsonApi(dummy);
      }).toThrow('Only resources can be serialized (use the @resource decorator)');
    });
  });
});
