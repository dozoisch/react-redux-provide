import expect from 'expect';
import jsdomReact from '../jsdomReact';
import TestUtils from 'react-addons-test-utils';
import { assignProviders } from 'react-redux-provide';
import * as list from 'react-redux-provide-list';
import TodoItem from '../../components/TodoItem';

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
  TodoItem
});

function setup( editing = false ) {
  const props = {
    index: 0,
    updateItem: expect.createSpy(),
    deleteItem: expect.createSpy()
  };

  const renderer = TestUtils.createRenderer();

  renderer.render(
    <TodoItem {...props} />
  );

  let output = renderer.getRenderOutput();

  if (editing) {
    const label = output.props.children.props.children[1];
    label.props.onDoubleClick({});
    output = renderer.getRenderOutput();
  }

  return {
    props: props,
    output: output,
    renderer: renderer
  };
}

describe('components', () => {
  jsdomReact();

  describe('TodoItem', () => {
    it('initial render', () => {
      const { output } = setup();

      expect(output.type).toBe('li');
      expect(output.props.className).toBe('');

      const div = output.props.children;

      expect(div.type).toBe('div');
      expect(div.props.className).toBe('view');

      const [input, label, button] = div.props.children;

      expect(input.type).toBe('input');
      expect(input.props.checked).toBe(false);

      expect(label.type).toBe('label');
      expect(label.props.children).toBe('Use redux providers');

      expect(button.type).toBe('button');
      expect(button.props.className).toBe('destroy');
    });

    it('input onChange should call updateItem', () => {
      const { output, props } = setup();
      const input = output.props.children.props.children[0];
      input.props.onChange({});
      expect(props.updateItem).toHaveBeenCalledWith(0, { completed: true });
    });

    it('button onClick should call deleteItem', () => {
      const { output, props } = setup();
      const button = output.props.children.props.children[2];
      button.props.onClick({});
      expect(props.deleteItem).toHaveBeenCalledWith(0);
    });

    it('label onDoubleClick should put component in edit state', () => {
      const { output, renderer } = setup();
      const label = output.props.children.props.children[1];
      label.props.onDoubleClick({});
      expect(props.updateItem).toHaveBeenCalledWith(0, { editing: true });
    });

    it('edit state render', () => {
      const { output } = setup(true);

      expect(output.type).toBe('li');
      expect(output.props.className).toBe('editing');

      const input = output.props.children;
      expect(input.type).toBe('input');
      expect(input.value).toBe('Use redux providers');
      expect(input.props.editing).toBe(true);
    });

    it('changing item should call updateItem and stop editing', () => {
      const { output, props } = setup(true);
      const input = output.props.children;
      const value = 'Use redux providers';
      input.value = value;
      input.props.onBlur();
      expect(props.updateItem).toHaveBeenCalledWith(0, { value, editing: false });
    });

    it('changing item should call deleteItem if no value', () => {
      const { output, props } = setup(true);
      const input = output.props.children;
      const value = '';
      input.value = value;
      input.props.onBlur();
      expect(props.deleteItem).toHaveBeenCalledWith(0);
    });
  });
});
