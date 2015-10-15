import expect from 'expect';
import jsdomReact from '../jsdomReact';
import TestUtils from 'react-addons-test-utils';
import { assignProviders } from 'react-redux-provide';
import * as list from 'react-redux-provide-list';
import * as selectable from 'react-redux-provide-selectable';
import MainSection from '../../components/MainSection';
import TodoItem from '../../components/TodoItem';
import Footer from '../../components/Footer';

const states = {
  todo: {
    list: [
      {
        value: 'Use redux providers',
        completed: false
      },
      {
        value: 'Run the tests',
        completed: true
      }
    ]
  },

  filters: {
    map: {
      All: item => true,
      Active: item => !item.completed,
      Completed: item => item.completed
    },
    selectedKey: 'All'
  }
};

assignProviders(states.todo, { list }, {
  MainSection,
  TodoItem,
  Footer
});

assignProviders(states.filters, { selectable }, {
  MainSection,
  Footer
});

function setup(propOverrides) {
  const props = Object.assign({
    mapList: expect.createSpy(),
    selected: expect.createSpy()
  }, propOverrides);

  const renderer = TestUtils.createRenderer();
  renderer.render(<MainSection {...props} />);
  const output = renderer.getRenderOutput();

  return {
    props: props,
    output: output,
    renderer: renderer
  };
}

describe('components', () => {
  jsdomReact();

  describe('MainSection', () => {
    it('should render container', () => {
      const { output } = setup();
      expect(output.type).toBe('section');
      expect(output.props.className).toBe('main');
    });

    describe('todo list', () => {
      it('should render', () => {
        const { output, props } = setup();
        const [, list] = output.props.children;
        expect(list.type).toBe('ul');
        expect(list.props.children.length).toBe(2);
        list.props.children.forEach((item, i) => {
          expect(item.type).toBe(TodoItem);
          expect(item.props.item.value).toBe(states.todo.list[i].value);
        });
      });

      it('should filter items', () => {
        const { output, renderer, props } = setup();
        const [,, footer] = output.props.children;
        footer.props.select('Completed');
        const updated = renderer.getRenderOutput();
        const [, updatedList] = updated.props.children;
        expect(updatedList.props.children.length).toBe(1);
        expect(updatedList.props.children[0].props.item.value).toBe(states.todo.list[1].value);
      });
    });

    describe('toggle all input', () => {
      it('should render', () => {
        const { output } = setup();
        const [toggle] = output.props.children;
        expect(toggle.type).toBe('input');
        expect(toggle.props.type).toBe('checkbox');
        expect(toggle.props.checked).toBe(false);
      });

      it('should call mapList on change', () => {
        const { output, props } = setup();
        const [toggle] = output.props.children;
        toggle.props.onChange({});
        expect(props.actions.mapList).toHaveBeenCalled();
      });

      it('should be checked if all todos completed', () => {
        const { output } = setup({});
        const [, toggle] = output.props.children;
        expect(toggle.props.checked).toBe(true);
      });
    });
  });
});
