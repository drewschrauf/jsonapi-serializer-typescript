import { toJsonApi, resource, attribute } from '../src';

@resource({ type: 'greeting', path: '/greetings' })
class Greeting {
  @attribute()
  public message?: string | null;

  constructor(public id?: string, properties?: Greeting) {
    if (properties) {
      this.message = properties.message;
    }
  }
}

const greeting = new Greeting('abc-123', { message: 'Hello, world!' });

console.log(JSON.stringify(toJsonApi(greeting), null, 2));
