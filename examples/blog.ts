import { toJsonApi, resource, resourceId, attribute, relationship } from '../src';

@resource({ type: 'person', path: '/people' })
class Person {
  @resourceId()
  public userId?: string;

  @attribute()
  public name?: string | null;

  @attribute()
  public bio?: string | null;

  constructor(userId?: string, props?: Person) {
    this.userId = userId;
    if (props) {
      this.name = props.name;
      this.bio = props.bio;
    }
  }
}

@resource({ type: 'comment', path: '/comments' })
class Comment {
  @relationship({ toOne: Person })
  public author?: Person | null;

  @attribute()
  public content?: string | null;

  constructor(public id?: string, props?: Comment) {
    if (props) {
      this.author = props.author;
      this.content = props.content;
    }
  }
}

@resource({ type: 'post', path: '/posts' })
class Post {
  @attribute()
  public title?: string | null;

  @relationship({ toOne: Person })
  public author?: Person | null;

  @relationship({ toMany: Comment, selfLink: true, relatedLink: true })
  public comments?: Comment[] | null;

  constructor(public id?: string, props?: Post) {
    if (props) {
      this.title = props.title;
      this.author = props.author;
      this.comments = props.comments;
    }
  }
}

const author = new Person('def-456', { name: 'Drew', bio: 'is our writer' });
const post = new Post('abc-123', {
  title: 'My Post',
  author,
  comments: [
    new Comment('jkl-098', {
      content: 'Cool post!',
      author: new Person('ghi-789', { name: 'Steve' }),
    }),
    new Comment('mno-765', {
      content: 'Thanks!',
      author,
    }),
  ],
});

console.log(
  JSON.stringify(
    toJsonApi(post, {
      baseUrl: 'http://example.com',
      include: ['author', 'comments', 'comments.author'],
      fields: { person: ['name'] },
      version: '1.1',
      meta: { maintainer: 'Drew' },
    }),
    null,
    2,
  ),
);
