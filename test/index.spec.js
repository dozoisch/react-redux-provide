import expect from 'expect';
import React, { PropTypes } from 'react';
import { Simulate } from 'react-addons-test-utils';
import { renderTest } from 'react-redux-provide-test-utils';
import { Test } from './components/index';
import { test } from './providers/index';

const defaultProps = {
  providers: {
    test: {
      ...test,
      state: {
        list: [
          {
            value: 'test'
          }
        ]
      }
    }
  }
};

function render (props) {
  return renderTest(Test, { ...defaultProps, ...props });
}

const placeholder = 'Testing...';

describe('react-redux-provide', () => {
  it('should have the correct displayName', () => {
    render({ placeholder });
    expect(Test.displayName).toBe('ProvideTest(test)');
  });

  it('should render correctly', () => {
    const { node } = render({ placeholder });
    const input = node.childNodes[0];
    const firstItem = node.childNodes[1];

    expect(node.tagName).toBe('DIV');
    expect(node.className).toBe('test');

    expect(node.childNodes.length).toBe(2);

    expect(input.tagName).toBe('INPUT');
    expect(input.getAttribute('placeholder')).toBe(placeholder);

    expect(firstItem.tagName).toBe('LI');
    expect(firstItem.className).toBe('test-item');
    expect(firstItem.textContent).toBe('test');
  });

  it('should trigger an action and re-render', () => {
    const { node, wrappedInstance } = render({ placeholder });
    const { unshiftItem } = wrappedInstance;
    const spy = expect.spyOn(wrappedInstance, 'unshiftItem');
    const input = node.childNodes[0];

    input.value = 'another test';

    Simulate.keyDown(input);
    expect(spy.calls.length).toBe(0);

    Simulate.keyDown(input, { key: 'Enter' });
    expect(spy.calls.length).toBe(1);

    unshiftItem();
    expect(wrappedInstance.props.list.length).toBe(2);
    expect(node.childNodes.length).toBe(3);
    expect(node.childNodes[1].textContent).toBe(input.value);
    expect(node.childNodes[2].textContent).toBe('test');
  });

  it('should only render when props have changed', () => {
    const { component, wrappedInstance } = render({ placeholder });
    const index = 0;
    const providedItem = wrappedInstance.refs[`item${index}`];

    expect(component.renders).toBe(1);
    expect(providedItem.renders).toBe(1);

    wrappedInstance.props.incrementCount();

    expect(component.renders).toBe(1);
    expect(providedItem.renders).toBe(2);

    wrappedInstance.props.incrementCount();

    expect(component.renders).toBe(1);
    expect(providedItem.renders).toBe(3);

    wrappedInstance.props.incrementCount();

    expect(component.renders).toBe(1);
    expect(providedItem.renders).toBe(4);
  });
});
