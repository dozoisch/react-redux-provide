import expect from 'expect';
import React from 'react';
import { Simulate } from 'react-addons-test-utils';
import { renderTest } from 'react-redux-provide-test-utils';
import TodoItem from '../../components/TodoItem';

function render () {
  return renderTest(TodoItem, { index: 0 });
}

describe('components', () => {
  describe('TodoItem', () => {
    it('should render correctly', () => {
      const { node } = render();
      const div = node.childNodes[0];
      const input = div.childNodes[0];
      const label = div.childNodes[1];
      const button = div.childNodes[2];

      expect(node.tagName).toBe('LI');
      expect(node.className).toBe('completed');

      expect(div.tagName).toBe('DIV');
      expect(div.className).toBe('view');

      expect(input.tagName).toBe('INPUT');
      expect(input.checked).toBe(true);

      expect(label.tagName).toBe('LABEL');
      expect(label.textContent).toBe('Use redux providers');

      expect(button.tagName).toBe('BUTTON');
      expect(button.className).toBe('destroy');
    });

    it('should call toggle and set completed when changing checkbox', () => {
      const { node, wrappedInstance } = render();
      const { toggle } = wrappedInstance;
      const checkbox = wrappedInstance.refs.checkbox;

      wrappedInstance.toggle = expect.createSpy();
      wrappedInstance.forceUpdate();

      Simulate.change(checkbox);
      expect(wrappedInstance.toggle).toHaveBeenCalled();

      expect(wrappedInstance.props.todoItem.completed).toBe(true);
      checkbox.checked = false;
      toggle.call(wrappedInstance);
      expect(wrappedInstance.props.todoItem.completed).toBe(false);
    });

    it('should call destroy when clicking button', () => {
      const { node, wrappedInstance } = render();
      const { toggle } = wrappedInstance;
      const button = node.childNodes[0].childNodes[2];

      wrappedInstance.destroy = expect.createSpy();
      wrappedInstance.forceUpdate();

      Simulate.click(button);
      expect(wrappedInstance.destroy).toHaveBeenCalled();
    });

    it('should enable editing when double clicking label', () => {
      const { node, wrappedInstance } = render();
      const { edit } = wrappedInstance;
      const label = node.childNodes[0].childNodes[1];

      wrappedInstance.edit = expect.createSpy();
      wrappedInstance.forceUpdate();

      Simulate.doubleClick(label);
      expect(wrappedInstance.edit).toHaveBeenCalled();

      expect(wrappedInstance.props.todoItem.editing).toBeFalsy();
      edit.call(wrappedInstance);
      expect(wrappedInstance.props.todoItem.editing).toBe(true);
    });

    it('should render correctly when editing', () => {
      const { node } = render();
      const input = node.childNodes[0];

      expect(node.tagName).toBe('LI');
      expect(node.className).toBe('editing');

      expect(input.tagName).toBe('INPUT');
      expect(input.className).toBe('edit');
      expect(input.value).toBe('Use redux providers');
    });

    it('should save value and stop editing when enter is pressed', () => {
      const { node, wrappedInstance } = render();
      const { save } = wrappedInstance;
      const input = node.childNodes[0];
      const value = 'Be awesome!';

      wrappedInstance.save = expect.createSpy();
      wrappedInstance.forceUpdate();

      Simulate.keyDown(input);
      expect(wrappedInstance.save.calls.length).toBe(0);

      Simulate.keyDown(input, { key: 'Enter' });
      expect(wrappedInstance.save.calls.length).toBe(1);

      input.value = value;
      save.call(wrappedInstance);
      expect(wrappedInstance.props.todoItem.value).toBe(value);
      expect(wrappedInstance.props.todoItem.editing).toBe(false);
    });
  });
});
