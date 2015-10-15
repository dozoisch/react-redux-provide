import expect from 'expect';
import jsdomReact from '../jsdomReact';
import TestUtils from 'react-addons-test-utils';
import { assignProviders } from 'react-redux-provide';
import * as list from 'react-redux-provide-list';
import Header from '../../components/Header';

const states = {
  todo: {
    list: [
      {
        value: 'Use redux providers',
        completed: false
      }
    ]
  }
};

assignProviders(states.todo, { list }, {
  Header
});

function setup() {
  const props = {
    createItem: expect.createSpy()
  };

  const renderer = TestUtils.createRenderer();
  renderer.render(<Header {...props} />);
  const output = renderer.getRenderOutput();

  return {
    props: props,
    output: output,
    renderer: renderer
  };
}

describe('components', () => {
  jsdomReact();

  describe('Header', () => {
    it('should render correctly', () => {
      const { output } = setup();

      expect(output.type).toBe('header');
      expect(output.props.className).toBe('header');

      const [h1, input] = output.props.children;

      expect(h1.type).toBe('h1');
      expect(h1.props.children).toBe('todos');

      expect(input.type).toBe('input');
      expect(input.props.className).toBe('new-todo');
      expect(input.props.placeholder).toBe('What needs to be done?');
    });

    it('should call call createItem if length of text is greater than 0', () => {
      const { output, props } = setup();
      const input = output.props.children[1];
      input.value = '';
      input.props.onBlur({});
      expect(props.createItem.calls.length).toBe(0);
      input.value = 'Use redux providers';
      input.props.onBlur({});
      expect(props.createItem.calls.length).toBe(1);
    });
  });
});
