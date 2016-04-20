import React from 'react';
import provide from './provide';

const { createElement } = React;
React.createElement = function(ComponentClass, props, ...args) {
  if (typeof ComponentClass === 'string' || props && props.__provided) {
    return createElement.apply(this, arguments);
  }

  const name = ComponentClass.displayName || ComponentClass.name;

  if (name === 'Route' && props.component) {
    props.component = provide(props.component);
  }

  if (!ComponentClass.Provide) {
    ComponentClass.Provide = provide(ComponentClass);

    if (process.env.NODE_ENV !== 'production') {
      if (typeof window !== 'undefined' && window.__reactComponentProxies) {
        for (let key in window.__reactComponentProxies) {
          let proxy = window.__reactComponentProxies[key];
          let { update } = proxy;

          if (!proxy.__provided) {
            proxy.__provided = true;
            proxy.update = function(NextClass) {
              NextClass.Provide = provide(NextClass);

              const instances = update.apply(this, arguments);

              for (let instance of instances) {
                let wrapper = instance.props.__wrapper;
                let { props, context } = wrapper;

                wrapper.reinitialize(props, context, NextClass);
              }

              return instances;
            };
          }
        }
      }
    }
  }

  props = props || {};
  props.__provided = true;

  return createElement.call(this, ComponentClass.Provide, props, ...args);
};
