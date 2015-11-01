import expect from 'expect';
import React from 'react';
import { Simulate } from 'react-addons-test-utils';
import { renderTest } from 'react-redux-provide-test-utils';
import MainSection from '../../components/MainSection';
import TodoItem from '../../components/TodoItem';
import Footer from '../../components/Footer';

function render (props) {
  return renderTest(MainSection, props);
}

describe('components', () => {
  describe('MainSection', () => {
    it('should render correctly', () => {
      const { node } = render();

      expect(node.tagName).toBe('SECTION');
      expect(node.className).toBe('main');
    });

    describe('todo list', () => {
      it('should render correctly', () => {
        const { node, wrappedInstance } = render();
        const todoList = node.childNodes[1];
        const { length } = todoList.childNodes;

        expect(todoList.tagName).toBe('UL');
        expect(length).toBe(2);

        for (let i = 0; i < length; i++) {
          let todoItem = todoList.childNodes[i];
          let label = todoItem.querySelector('label');

          expect(todoItem.tagName).toBe('LI');
          expect(label.textContent).toBe(
            wrappedInstance.props.todoList[length - i - 1].value
          );
        }
      });

      it('should filter items', () => {
        const { node, wrappedInstance } = render();
        const todoList = node.childNodes[1];
        const footer = node.childNodes[2];
        const activeLink = footer.childNodes[1].childNodes[1].childNodes[0];
        let todoItem;
        let label;

        Simulate.click(activeLink);
        expect(node.childNodes[1].childNodes.length).toBe(1);

        todoItem = todoList.childNodes[0];
        label = todoItem.querySelector('label');
        expect(label.textContent).toBe(
          wrappedInstance.props.todoList[1].value
        );
      });
    });

    describe('toggle all input', () => {
      it('should render correctly', () => {
        const { node } = render();
        const toggle = node.childNodes[0];

        expect(toggle.tagName).toBe('INPUT');
        expect(toggle.type).toBe('checkbox');
        expect(toggle.checked).toBe(false);
      });

      it('should call toggleAll on change', () => {
        const { node, wrappedInstance } = render();
        const toggle = node.childNodes[0];

        wrappedInstance.toggleAll = expect.createSpy();
        wrappedInstance.forceUpdate();

        Simulate.change(toggle);
        expect(wrappedInstance.toggleAll).toHaveBeenCalled();
      });

      it('should be checked if all todos completed', () => {
        const { node, wrappedInstance } = render();
        const toggle = node.childNodes[0];

        expect(toggle.checked).toBe(false);
        wrappedInstance.refs.toggleAll.checked = true;
        wrappedInstance.toggleAll();
        expect(toggle.checked).toBe(true);
      });
    });
  });
});
