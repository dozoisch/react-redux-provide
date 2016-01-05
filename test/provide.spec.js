import expect from 'expect';
import React, { PropTypes } from 'react';
import { Simulate } from 'react-addons-test-utils';
import { renderTest } from 'react-redux-provide-test-utils';
import providers from './providers/index';
import Test from './components/Test';
import TestItem from './components/TestItem';

const context = {
  combinedProviders: [ providers ],
  providers,
  providedState: {
    list: [
      {
        value: 'test'
      }
    ]
  }
};

function render (props) {
  return renderTest(Test, { ...context, ...props });
}

const placeholder = 'Testing...';

describe('react-redux-provide', () => {
  it('should have the correct displayName', () => {
    render({ placeholder });
    expect(Test.displayName).toBe('ProvideTest(list,someCombinedProvider)');
  });

  it('should render correctly using providedState', () => {
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

  it('should ignore undefined propTypes', () => {
    const stuff = 'things';
    const index = 0;
    const { wrappedInstance } = render({ placeholder, stuff, index });

    expect(wrappedInstance.props.placeholder).toBe(placeholder);
    expect(wrappedInstance.props.stuff).toBe(undefined);
    expect(wrappedInstance.props.index).toBe(undefined);

    expect(wrappedInstance.props.setList).toBe(undefined);
    expect(wrappedInstance.props.updateList).toBe(undefined);
    expect(wrappedInstance.props.filterList).toBe(undefined);
    expect(wrappedInstance.props.unshiftItem).toBeTruthy();
    expect(wrappedInstance.props.updateItem).toBe(undefined);
    expect(wrappedInstance.props.deleteitem).toBe(undefined);
    expect(wrappedInstance.props.item).toBe(undefined);
    expect(wrappedInstance.props.list).toBeTruthy();
  });

  it('should trigger an action and update the view', () => {
    const { node, wrappedInstance } = render({ placeholder });
    const { unshiftItem } = wrappedInstance;
    const spy = expect.spyOn(wrappedInstance, 'unshiftItem');
    const input = node.childNodes[0];

    input.value = 'another test';

    Simulate.keyDown(input);
    expect(spy.calls.length).toBe(0);

    Simulate.keyDown(input, { key: 'Enter' });
    expect(spy.calls.length).toBe(1);

    unshiftItem.call(wrappedInstance);
    expect(wrappedInstance.props.list.length).toBe(2);
    expect(node.childNodes.length).toBe(3);
    expect(node.childNodes[1].textContent).toBe(input.value);
    expect(node.childNodes[2].textContent).toBe('test');
  });

  it('should combine providers correctly', () => {
    const { node, wrappedInstance } = render({ placeholder });
    const index = 0;
    const providedItem = wrappedInstance.refs[`item${index}`];
    const item = providedItem.refs.wrappedInstance;
    const value = 'testing update...';

    expect(item.props.index).toBe(index);
    expect(wrappedInstance.props.updatedIndex).toBe(-1);

    item.update(value);

    expect(wrappedInstance.props.updatedIndex).toBe(index);
    expect(node.childNodes.length).toBe(2);
    expect(node.childNodes[1].textContent).toBe(value);
    expect(wrappedInstance.props.list.length).toBe(1);
    expect(wrappedInstance.props.list[0].value).toBe(value);
    expect(item.props.item.value).toBe(value);
  });

  it('should only render when props have changed', () => {
    const { component, wrappedInstance } = render({ placeholder });
    const index = 0;
    const providedItem = wrappedInstance.refs[`item${index}`];

    // TODO: we should be able to improve the re-rendering algorithm

    expect(component.prerenders).toBe(1);
    expect(component.renders).toBe(1);
    expect(providedItem.prerenders).toBe(1);
    expect(providedItem.renders).toBe(1);

    wrappedInstance.props.noop();

    expect(component.prerenders).toBe(2);
    expect(component.renders).toBe(1);
    expect(providedItem.prerenders).toBe(2);
    expect(providedItem.renders).toBe(2);

    wrappedInstance.props.noop();

    expect(component.prerenders).toBe(3);
    expect(component.renders).toBe(1);
    expect(providedItem.prerenders).toBe(3);
    expect(providedItem.renders).toBe(3);

    wrappedInstance.props.noop();

    expect(component.prerenders).toBe(4);
    expect(component.renders).toBe(1);
    expect(providedItem.prerenders).toBe(4);
    expect(providedItem.renders).toBe(4);
  });
});
