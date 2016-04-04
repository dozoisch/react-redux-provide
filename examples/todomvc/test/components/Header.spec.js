import expect from 'expect';
import React from 'react';
import { Simulate } from 'react-addons-test-utils';
import { renderTest } from 'react-redux-provide-test-utils';
import Header from '../../components/Header';
import defaultProps from '../../defaultProps';

function render (props) {
  return renderTest(Header, {
    ...defaultProps,
    ...props
  });
}

describe('components', () => {
  describe('Header', () => {
    it('should render correctly', () => {
      const { node } = render();
      const h1 = node.childNodes[0];
      const input = node.childNodes[1];

      expect(node.tagName).toBe('HEADER');
      expect(node.className).toBe('header');

      expect(h1.tagName).toBe('H1');
      expect(h1.textContent).toBe('todos');

      expect(input.tagName).toBe('INPUT');
      expect(input.className).toBe('new-todo');
      expect(input.getAttribute('placeholder')).toBe('What needs to be done?');
    });

    it('should call pushTodoItem if input value has length', () => {
      const { node, wrappedInstance } = render();
      const { pushTodoItem } = wrappedInstance;

      wrappedInstance.pushTodoItem = expect.createSpy();
      wrappedInstance.forceUpdate();

      wrappedInstance.refs.input.value = 'Run the tests';
      Simulate.blur(wrappedInstance.refs.input);
      expect(wrappedInstance.pushTodoItem).toHaveBeenCalled();
      pushTodoItem.call(wrappedInstance);
      expect(wrappedInstance.refs.input.value).toBe('');
    });

    it('should call pushTodoItem if enter is pressed', () => {
      const { node, wrappedInstance } = render();

      wrappedInstance.pushTodoItem = expect.createSpy();
      wrappedInstance.forceUpdate();

      Simulate.keyDown(wrappedInstance.refs.input);
      expect(wrappedInstance.pushTodoItem.calls.length).toBe(0);

      Simulate.keyDown(wrappedInstance.refs.input, { key: 'Enter' });
      expect(wrappedInstance.pushTodoItem.calls.length).toBe(1);
    });
  });
});
