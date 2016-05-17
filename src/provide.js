import React, { Component, PropTypes } from 'react';
import hoistStatics from 'hoist-non-react-statics';
import instantiateProvider from './instantiateProvider';
import shallowEqual from './shallowEqual';

const componentInstances = {};
let rootInstance = null;

const contextTypes = {
  providers: PropTypes.object,
  providerInstances: PropTypes.object,
  rerender: PropTypes.func
};

export default function provide(ComponentClass) {
  if (ComponentClass.ComponentClass) {
    return ComponentClass;
  }

  let componentName = ComponentClass.displayName || ComponentClass.name;

  function getDisplayName(providers = {}) {
    return `Provide${componentName}(${Object.keys(providers).join(',')})`;
  }

  function getRelevantKeys(a = {}, b = ComponentClass.propTypes) {
    const relevantKeys = [];

    if (typeof b === 'object') {
      for (let key in b) {
        if (key in a) {
          relevantKeys.push(key);
        }
      }
    }

    return relevantKeys;
  }

  // finds the first `handleQuery` function within replicators
  function getQueryHandler({ replication }) {
    if (replication) {
      if (!Array.isArray(replication)) {
        replication = [ replication ];
      }

      for (let { replicator } of replication) {
        if (replicator) {
          if (!Array.isArray(replicator)) {
            replicator = [ replicator ];
          }

          for (let { handleQuery } of replicator) {
            if (handleQuery) {
              return handleQuery;
            }
          }
        }
      }
    }

    return null;
  }

  function getMergedResult(results) {
    let mergedResult = null;

    for (let providerKey in results) {
      let result = results[providerKey];

      if (Array.isArray(result)) {
        mergedResult = [ ...(mergedResult || []), ...result ];
      } else if (result && typeof result === 'object') {
        mergedResult = { ...(mergedResult || {}), ...result };
      } else {
        mergedResult = result;
      }
    }

    return mergedResult;
  }

  const Provide = class extends Component {
    static ComponentClass = ComponentClass;
    static displayName = getDisplayName();
    static propTypes = contextTypes;
    static contextTypes = contextTypes;
    static childContextTypes = contextTypes;

    getChildContext() {
      return {
        providers: this.getProviders(),
        providerInstances: this.getProviderInstances(),
        rerender: this.getRerender()
      };
    }

    getProviders(props = this.props, context = this.context) {
      this.providers = this.providers
        || props.providers
        || context.providers
        || {};

      return this.providers;
    }

    getProviderInstances(props = this.props, context = this.context) {
      this.providerInstances = this.providerInstances
        || props.providerInstances
        || context.providerInstances
        || {};

      return this.providerInstances;
    }

    getRerender(props = this.props, context = this.context) {
      this.rerender = this.rerender
        || props.rerender
        || context.rerender;

      return this.rerender;
    }

    constructor(props, context) {
      super(props);

      if (!context.providers) {
        rootInstance = this;
      }

      this.renders = 0;
      this.componentName = componentName;
      this.unmounted = true;
      this.initialize(props, context);
    }

    initialize(props, context) {
      const providers = this.getProviders(props, context);

      for (let key in providers) {
        let provider = providers[key];
        let shouldSubscribe = false;

        if (!provider.key) {
          provider.key = key;
        }

        this.assignActionCreators(props, context, provider);

        if (this.assignReducers(props, context, provider)) {
          shouldSubscribe = true;
        }

        if (this.assignMergers(props, context, provider)) {
          shouldSubscribe = true;
        }

        if (shouldSubscribe) {
          this.subscribeToProvider(props, context, provider);
        }
      }

      //this.handleQueries(props, context);
      this.setDisplayName(props, context);
    }

    deinitialize() {
      this.unsubscribe();

      delete this.relevantProviders;
      delete this.queryingProviders;
      delete this.componentProps;
      delete this.fauxInstance;
      delete this.subscriptions;
      delete this.mergers;
      delete this.wrappedInstance;
    }

    unsubscribe() {
      const subscriptions = this.getSubscriptions();

      while (subscriptions.length) {
        let unsubscribe = subscriptions.shift();

        unsubscribe();
      }
    }

    componentWillReceiveProps(nextProps) {
      if (!shallowEqual(nextProps, this.props)) {
        this.deinitialize();
        this.initialize(nextProps, this.context);
        this.receivedNewProps = true;
      }
    }

    componentDidMount() {
      this.unmounted = typeof window === 'undefined';
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

      return false;
    }

    render() {
      return this.getWrappedInstance();
    }

    setDisplayName(props, context) {
      Provide.displayName = getDisplayName({
        ...this.getRelevantProviders(),
        ...this.getQueryingProviders()
      });
    }

    getRelevantProviders() {
      if (!this.relevantProviders) {
        this.relevantProviders = {};
      }

      return this.relevantProviders;
    }

    getQueryingProviders() {
      if (!this.queryingProviders) {
        this.queryingProviders = {};
      }

      return this.queryingProviders;
    }

    getComponentProps(props = this.props, context = this.context) {
      if (!this.componentProps) {
        this.componentProps = {
          ...ComponentClass.defaultProps, ...props, __wrapper: this
        };

        if (!this.componentProps.ref && ComponentClass.prototype.render) {
          this.componentProps.ref = 'wrappedInstance';
        }
      }

      return this.componentProps;
    }

    getFauxInstance(props, context) {
      if (!this.fauxInstance) {
        const componentProps = this.getComponentProps(props, context);

        this.fauxInstance = { ...this, props: componentProps };
      }

      this.fauxInstance.context = context;

      return this.fauxInstance;
    }

    getSubscriptions() {
      if (!this.subscriptions) {
        this.subscriptions = [];
      }

      return this.subscriptions;
    }

    getMergers() {
      if (!this.mergers) {
        this.mergers = {};
      }

      return this.mergers;
    }

    getWrappedInstance() {
      if (!this.wrappedInstance || this.doUpdate) {
        this.renders++;
        this.doUpdate = false;
        this.wrappedInstance = (
          <ComponentClass { ...this.getComponentProps() } />
        );
      }

      return this.wrappedInstance;
    }

    getProviderInstance(props, context, provider) {
      const relevantProviders = this.getRelevantProviders();
      const providerInstances = this.getProviderInstances(props, context);
      let providerKey = provider.key;
      let isStaticProvider = typeof providerKey !== 'function';

      if (!isStaticProvider) {
        // get actual `providerKey`
        providerKey = providerKey(this.getFauxInstance(props, context));
        // if actual `providerKey` matches `key`, treat as static provider
        isStaticProvider = providerKey === provider.key;
      }

      let providerInstance = providerInstances[providerKey];

      if (!providerInstance) {
        providerInstance = instantiateProvider(providerKey, provider);
        providerInstance.isStatic = isStaticProvider;
        providerInstance.key = providerKey;
        providerInstances[providerKey] = providerInstance;
      }

      relevantProviders[providerKey] = true;

      return providerInstance;
    }

    assignActionCreators(props, context, provider) {
      const actionKeys = getRelevantKeys(provider.actions);

      if (!actionKeys.length) {
        return false;
      }

      const componentProps = this.getComponentProps(props, context);
      const { actionCreators } = this.getProviderInstance(
        props, context, provider
      );

      // assign relevant action creators to wrapped component's props
      for (let actionKey of actionKeys) {
        if (!props[actionKey]) {
          componentProps[actionKey] = actionCreators[actionKey];
        }
      }

      return true;
    }

    assignReducers(props, context, provider) {
      const reducerKeys = getRelevantKeys(provider.reducers);

      if (!reducerKeys.length) {
        return false;
      }

      const subscriptions = this.getSubscriptions();
      const componentProps = this.getComponentProps(props, context);
      const { store } = this.getProviderInstance(
        props, context, provider
      );
      const state = store.getState();

      // copy the relevant states to the wrapped component's props
      // and whenever some state changes, update (mutate) the wrapped props
      // and raise the `doUpdate` flag to indicate that the component
      // should be updated after the action has taken place
      for (let reducerKey of reducerKeys) {
        if (!props[reducerKey]) {
          componentProps[reducerKey] = state[reducerKey];

          subscriptions.push(
            store.watch(
              reducerKey, nextState => {
                componentProps[reducerKey] = nextState;
                this.doUpdate = true;
              }
            )
          );
        }
      }

      return true;
    }

    assignMergers(props, context, provider) {
      const mergeKeys = getRelevantKeys(provider.merge);

      if (!mergeKeys.length) {
        return false;
      }

      const mergers = this.getMergers();
      const subscriptions = this.getSubscriptions();
      const componentProps = this.getComponentProps(props, context);
      const { merge, store } = this.getProviderInstance(
        props, context, provider
      );
      const state = store.getState();

      // some of the wrapped component's props might depend on some state,
      // possibly merged with props and/or context,
      // so we watch for changes to certain `keys`
      // and only update props when those `keys` have changed
      for (let mergeKey of mergeKeys) {
        if (!props[mergeKey]) {
          let merger = merge[mergeKey];

          componentProps[mergeKey] = merger.get(
            state, componentProps, context
          );

          for (let reducerKey of merger.keys) {
            subscriptions.push(
              store.watch(
                reducerKey, nextState => {
                  // we store the merger temporarily so that we may
                  // `get` the value only after the action has completed
                  mergers[mergeKey] = merger;
                  this.doMerge = true;
                }
              )
            );
          }
        }
      }

      return true;
    }

    subscribeToProvider(props, context, provider) {
      const subscriptions = this.getSubscriptions();
      const { store } = this.getProviderInstance(
        props, context, provider
      );

      // if any states are relevant, we subscribe to the provider's store;
      // and since we're reflecting any changes to relevant states
      // by mutating `componentProps` and raising the `doUpdate` flag,
      // it's more efficient to simply call `forceUpdate` here
      subscriptions.push(
        store.subscribe(() => {
          if (this.doMerge) {
            const mergers = this.getMergers();
            const componentProps = this.getComponentProps(props, context);
            const state = store.getState();

            // this is where we `get` any new values which depend on
            // some state, possibly merged with props and/or context
            for (let mergeKey in mergers) {
              let { get } = mergers[mergeKey];
              let value = get(state, componentProps, context);

              if (componentProps[mergeKey] !== value) {
                componentProps[mergeKey] = value;
                this.doUpdate = true;
              }

              delete mergers[mergeKey];
            }

            this.doMerge = false;
          }

          if (this.doUpdate) {
            this.handleQueriesOrUpdate(props, context);
          }
        })
      );
    }

    handleQueriesOrUpdate(props, context) {
      if (this.hasDynamicQuery) {
        this.handleQueries(props, context);
        return;
      }

      const rerender = this.getRerender(props, context);

      if (rerender) {
        rerender();
      } else if (!this.unmounted) {
        this.forceUpdate();
      }
    }

    handleQueries(props, context) {
      // TODO
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    let instances = componentInstances[componentName] || new Set();

    if (!componentInstances[componentName]) {
      componentInstances[componentName] = instances;
    }

    Provide.prototype.componentDidMount = function() {
      this.unmounted = typeof window === 'undefined';
      instances.add(this);
    }

    Provide.prototype.componentWillUnmount = function() {
      this.unmounted = true;
      this.deinitialize();
      instances.delete(this);
    }

    Provide.prototype.reinitialize = function(props, context, NextClass) {
      if (NextClass) {
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

export function reloadProviders(providers, providerInstances) {
  const {
    providers: oldProviders,
    providerInstances: oldProviderInstances
  } = rootInstance;

  for (let providerKey in providers) {
    let provider = providers[providerKey];
    let oldProvider = oldProviders[providerKey];

    if (!providers.replication && oldProvider && oldProvider.replication) {
      provider.replication = oldProvider.replication;
    }
  }

  for (let providerKey in oldProviderInstances) {
    let state = oldProviderInstances[providerKey].store.getState();

    if (providers[providerKey]) {
      providers[providerKey].state = state;
    }

    delete oldProviderInstances[providerKey];
  }

  rootInstance.providers = providers;
  rootInstance.providerInstances = providerInstances || oldProviderInstances;
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
