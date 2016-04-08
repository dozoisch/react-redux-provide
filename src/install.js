import React from 'react';
import provide from './provide';

const { createElement } = React;
React.createElement = function(ComponentClass, props, children) {
  if (typeof ComponentClass === 'string' || props && props.__provided) {
    return createElement.apply(this, arguments);
  }

  if (!ComponentClass.Provide) {
    ComponentClass.Provide = provide(ComponentClass);
  }

  props = props || {};
  props.__provided = true;

  return createElement.call(this, ComponentClass.Provide, props, children);
};
