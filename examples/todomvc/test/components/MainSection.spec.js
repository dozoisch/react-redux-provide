import 'react-redux-provide/lib/install';
import expect from 'expect';
import React from 'react';
import { Simulate } from 'react-dom/test-utils';
import { renderTest } from 'react-redux-provide-test-utils';
import MainSection from '../../components/MainSection';
import TodoItem from '../../components/TodoItem';
import Footer from '../../components/Footer';
import defaultProps from '../../defaultProps';

function render (props) {
  return renderTest(MainSection, {
    ...defaultProps,
    ...props
  });
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
        expect(length).toBe(1);

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

        Simulate.click(activeLink);
        expect(todoList.childNodes.length).toBe(0);
      });
    });

    describe('toggle all input', () => {
      it('should render correctly', () => {
        const { node } = render();
        const toggle = node.childNodes[0];

        expect(toggle.tagName).toBe('INPUT');
        expect(toggle.type).toBe('checkbox');
        expect(toggle.checked).toBe(true);
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

        expect(toggle.checked).toBe(true);
        wrappedInstance.refs.toggleAll.checked = false;
        wrappedInstance.toggleAll();
        expect(toggle.checked).toBe(false);
      });
    });
  });
});
