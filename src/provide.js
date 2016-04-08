import React, { Component, PropTypes } from 'react';
import hoistStatics from 'hoist-non-react-statics';
import instantiateProvider from './instantiateProvider';
import shallowEqual from './shallowEqual';

const componentInstances = {};
let rootInstance = null;

const contextTypes = {
  providers: PropTypes.object,
  providerInstances: PropTypes.object
};

export default function provide(ComponentClass) {
  if (ComponentClass.ComponentClass) {
    return ComponentClass;
  }

  let componentName = ComponentClass.displayName || ComponentClass.name;

  function getDisplayName(displayedProviderKeys = []) {
    return `Provide${componentName}(${displayedProviderKeys.join(',')})`;
  }

  function getRelevantKeys(object = {}) {
    const { propTypes = {} } = ComponentClass;
    const relevantKeys = [];

    for (let key in propTypes) {
      if (key in object) {
        relevantKeys.push(key);
      }
    }

    return relevantKeys;
  }

  const Provide = class extends Component {
    static ComponentClass = ComponentClass;
    static displayName = getDisplayName();
    static propTypes = contextTypes;
    static contextTypes = contextTypes;
    static childContextTypes = contextTypes;

    getChildContext() {
      const { providers, providerInstances } = this;

      return { providers, providerInstances };
    }

    constructor(props, context) {
      super(props);

      if (!context.providers) {
        rootInstance = this;
      }

      this.renders = 0;
      this.mergers = {};
      this.unsubscribe = [];
      this.componentName = componentName;
      this.unmounted = typeof window === 'undefined';
      this.initialize(props, context);
    }

    getProviders(props, context) {
      return this.providers
        || props.providers
        || context.providers
        || {};
    }

    getProviderInstances(props, context) {
      return this.providerInstances
        || props.providerInstances
        || context.providerInstances
        || {};
    }

    initialize(props, context) {
      const providers = this.getProviders(props, context);
      const providerInstances = this.getProviderInstances(props, context);
      const displayedProviderKeys = [];
      
      this.providers = providers;
      this.providerInstances = providerInstances;
      this.componentProps = { ...props };

      if (!this.componentProps.ref && ComponentClass.prototype.render) {
        this.componentProps.ref = 'wrappedInstance';
      }

      // big block of code here but it's pretty straightforward!
      for (let key in providers) {
        let provider = providers[key];
        let providerKey = provider.key || key;
        let providerInstance = providerInstances[providerKey];
        let isStaticProvider = typeof providerKey !== 'function';
        let actionKeys = getRelevantKeys(provider.actions);
        let reducerKeys = getRelevantKeys(provider.reducers);
        let mergeKeys = getRelevantKeys(provider.merge);
        let actionCreators = null;
        let store = null;
        let state = null;

        // go ahead and instantiate the provider if its key isn't a function
        if (isStaticProvider && !providerInstance) {
          providerInstance = instantiateProvider(providerKey, provider);
          providerInstances[providerKey] = providerInstance;
        }

        // if we've found any keys relevant to this component
        if (actionKeys.length || reducerKeys.length || mergeKeys.length) {
          if (isStaticProvider) {
            displayedProviderKeys.push(providerKey);
          } else {
            displayedProviderKeys.push(key);
            providerKey = providerKey({ ...this, props, context });
            providerInstance = providerInstances[providerKey];

            if (!providerInstance) {
              providerInstance = instantiateProvider(providerKey, provider);
              providerInstances[providerKey] = providerInstance;
            }
          }

          actionCreators = providerInstance.actionCreators;
          store = providerInstance.store;
          state = store.getState();

          // assign relevant action creators to wrapped component's props
          for (let actionKey of actionKeys) {
            this.componentProps[actionKey] = actionCreators[actionKey];
          }

          // copy the relevant states to the wrapped component's props
          // and whenever some state changes, update (mutate) the wrapped props
          // and raise the `doUpdate` flag to indicate that the component
          // should be updated after the action has taken place
          for (let reducerKey of reducerKeys) {
            this.componentProps[reducerKey] = state[reducerKey];

            this.unsubscribe.push(
              store.watch(
                reducerKey, nextState => {
                  this.componentProps[reducerKey] = nextState;
                  this.doUpdate = true;
                }
              )
            );
          }

          // some of the wrapped component's props might depend on some state,
          // possibly merged with props and/or context,
          // so we watch for changes to certain `keys`
          // and only update props when those `keys` have changed
          for (let mergeKey of mergeKeys) {
            let merger = providerInstance.merge[mergeKey];

            this.componentProps[mergeKey] = merger.get(
              state, this.componentProps, context
            );

            for (let reducerKey of merger.keys) {
              this.unsubscribe.push(
                store.watch(
                  reducerKey, nextState => {
                    // we store the merger temporarily so that we may
                    // `get` the value only after the action has completed
                    this.mergers[mergeKey] = merger;
                    this.doUpdate = true;
                  }
                )
              );
            }
          }

          // if any states are relevant, we subscribe to the store;
          // and since we're reflecting any changes to relevant states
          // by mutating `componentProps` and raising the `doUpdate` flag,
          // it's more efficient to simply call `forceUpdate` here
          if (reducerKeys.length || mergeKeys.length) {
            this.unsubscribe.push(
              store.subscribe(() => {
                if (this.doUpdate) {
                  const state = store.getState();

                  // this is where we `get` any new values which depend on
                  // some state, possibly merged with props and/or context
                  for (let mergeKey in this.mergers) {
                    let { get } = this.mergers[mergeKey];

                    // TODO: only update when necessary
                    this.componentProps[mergeKey] = get(
                      state, this.componentProps, context
                    );

                    delete this.mergers[mergeKey];
                  }

                  if (!this.unmounted) {
                    this.forceUpdate();
                  }
                }
              })
            );
          }
        }
      }

      Provide.displayName = getDisplayName(displayedProviderKeys);
    }

    deinitialize() {
      while (this.unsubscribe.length) {
        this.unsubscribe.shift()();
      }
    }

    componentWillReceiveProps(nextProps) {
      if (!shallowEqual(nextProps, this.props)) {
        this.deinitialize();
        this.initialize(nextProps, this.context);
        this.receivedNewProps = true;
      }
    }

    componentWillUnmount() {
      this.unmounted = true;
      this.deinitialize();
    }

    shouldComponentUpdate() {
      if (this.receivedNewProps) {
        this.receivedNewProps = false;
        return true;
      }

      // see comments within `initialize` for why we return false here
      return false;
    }

    render() {
      this.doUpdate = false;
      this.renders++;

      this.wrappedInstance = (
        <ComponentClass { ...this.componentProps } />
      );

      return this.wrappedInstance;
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    let instances = componentInstances[componentName] || new Set();

    if (!componentInstances[componentName]) {
      componentInstances[componentName] = instances;
    }

    Provide.prototype.componentDidMount = function() {
      instances.add(this);
    }

    Provide.prototype.componentWillUnmount = function() {
      this.unmounted = true;
      this.deinitialize();
      instances.delete(this);
    }

    Provide.prototype.reinitialize = function(props, context, NextClass) {
      if (NextClass) {
        delete NextClass.Provide;
        this.setComponentClass(NextClass);
      }

      this.initialize(props, context);

      if (!this.unmounted) {
        this.forceUpdate();
      }
    }

    Provide.prototype.setComponentClass = function(NextClass) {
      const prevComponentName = componentName;

      ComponentClass = NextClass;
      Provide.ComponentClass = ComponentClass;
      componentName = ComponentClass.displayName || ComponentClass.name;
      this.componentName = componentName;

      if (prevComponentName !== componentName) {
        componentInstances[componentName] = instances;
        delete componentInstances[prevComponentName];
      }
    }

    for (let instance of instances) {
      const { props, context } = instance;

      instance.reinitialize(props, context, ComponentClass);
    }
  }

  return hoistStatics(Provide, ComponentClass);
}

export function reloadProviders(providers) {
  const { providers: oldProviders, providerInstances } = rootInstance;

  for (let providerKey in providers) {
    let provider = providers[providerKey];
    let oldProvider = oldProviders[providerKey];

    if (!providers.replication && oldProvider && oldProvider.replication) {
      provider.replication = oldProvider.replication;
    }
  }

  for (let providerKey in providerInstances) {
    let state = providerInstances[providerKey].store.getState();

    if (providers[providerKey]) {
      providers[providerKey].state = state;
    }
  }

  rootInstance.providers = providers;
  rootInstance.providerInstances = {};
  rootInstance.reinitialize(rootInstance.props, rootInstance.context);

  for (let componentName in componentInstances) {
    let instances = componentInstances[componentName];

    for (let instance of instances) {
      let { props, context } = instance;

      if (instance !== rootInstance) {
        context.providers = rootInstance.providers;
        context.providerInstances = rootInstance.providerInstances;
        instance.providers = rootInstance.providers;
        instance.providerInstances = rootInstance.providerInstances;
        instance.reinitialize(props, context);
      }
    }
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn('You should only use `reloadProviders` in development!');
  }
}
