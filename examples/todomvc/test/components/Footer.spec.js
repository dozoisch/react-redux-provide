import expect from 'expect';
import React from 'react';
import { Simulate } from 'react-addons-test-utils';
import { renderTest } from 'react-redux-provide-test-utils';
import Footer from '../../components/Footer';
import defaultProps from '../../defaultProps';

function render (props) {
  return renderTest(Footer, {
    ...defaultProps,
    completedCount: 0,
    activeCount: 0,
    ...props
  });
}

describe('components', () => {
  describe('Footer', () => {
    it('should render correctly', () => {
      const { component, wrappedInstance, node } = render();

      expect(component instanceof Footer).toBe(true);
      expect(wrappedInstance).toBeTruthy();
      expect(node.tagName).toBe('FOOTER');
      expect(node.className).toBe('footer');
    });

    it('should render active count when 0', () => {
      const { node } = render({ activeCount: 0 });
      const count = node.childNodes[0];

      expect(count.textContent).toBe('No items left');
    });

    it('should render active count when above 0', () => {
      const { node } = render({ activeCount: 1 });
      const count = node.childNodes[0];

      expect(count.textContent).toBe('1 item left');
    });

    it('should render filters', () => {
      const { node } = render();
      const filters = node.childNodes[1];

      expect(filters.tagName).toBe('UL');
      expect(filters.className).toBe('filters');
      expect(filters.childNodes.length).toBe(3);

      for (let i = 0, length = filters.childNodes.length; i < length; i++) {
        let filter = filters.childNodes[i];
        let a = filter.childNodes[0];

        expect(filter.tagName).toBe('LI');
        expect(a.className).toBe(i === 0 ? 'selected' : '');
        expect(a.textContent).toBe({
          0: 'All',
          1: 'Active',
          2: 'Completed'
        }[i]);
      }
    });

    it('should select filters when clicked', () => {
      const { node } = render();
      const filters = node.childNodes[1];
      const { length } = filters.childNodes;

      for (let i = 0; i < length; i++) {
        Simulate.click(filters.childNodes[i].childNodes[0]);

        for (let j = 0; j < length; j++) {
          expect(filters.childNodes[j].childNodes[0].className).toBe(
            i === j ? 'selected' : ''
          );
        }
      }

      Simulate.click(filters.childNodes[0].childNodes[0]);
    });

    it('shouldn\'t show clear button when no completed todos', () => {
      const { node } = render({ completedCount: 0 });
      const clear = node.childNodes[2];

      expect(clear).toBe(undefined);
    });

    it('should render clear button when completed todos', () => {
      const { node } = render({ completedCount: 1 });
      const clear = node.childNodes[2];

      expect(clear.tagName).toBe('BUTTON');
      expect(clear.textContent).toBe('Clear completed');
    });

    it('should call clearCompleted on clear button click', () => {
      const { node, wrappedInstance } = render({ completedCount: 1 });
      const clear = node.childNodes[2];

      wrappedInstance.clearCompleted = expect.createSpy();
      wrappedInstance.forceUpdate();
      
      Simulate.click(clear);
      expect(wrappedInstance.clearCompleted).toHaveBeenCalled();
    });
  });
});
