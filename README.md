# react-redux-provide

[![build status](https://img.shields.io/travis/loggur/react-redux-provide/master.svg?style=flat-square)](https://travis-ci.org/loggur/react-redux-provide) [![npm version](https://img.shields.io/npm/v/react-redux-provide.svg?style=flat-square)](https://www.npmjs.com/package/react-redux-provide)
[![npm downloads](https://img.shields.io/npm/dm/react-redux-provide.svg?style=flat-square)](https://www.npmjs.com/package/react-redux-provide)


## Table of contents

1.  [Installation](#installation)
2.  [What does this do?](#what-does-this-do)
3.  [What is a provider?](#what-is-a-provider)
  - [The basics](#the-basics)
    - [actions](#actions)
    - [reducers](#reducers)
    - [merge](#merge)
    - [middleware](#middleware)
    - [enhancer](#enhancer)
  - [Initialization](#initialization)
    - [key](#key)
    - [state](#state)
    - [onInstantiated](#oninstantiated)
    - [onReady](#onready)
  - [Replication](#replication)
    - [replication](#replication)
    - [clientStateKeys](#clientstatekeys)
  - [Advanced](#advanced)
    - [subscribeTo](#subscribeto)
    - [subscribers](#subscribers)
    - [wait](#wait)
    - [clear](#clear)
    - [isGlobal](#isglobal)
  - [Thunk API](#thunk-api)
    - [getInstance](#getinstance-object-state-function-callback)
    - [createInstance](#createinstance-object-state-function-callback)
    - [setStates](#setstates-object-states)
    - [find](#find-object-state-optional-boolean-doinstantiate-function-callback)
4.  [Contextual component props](#contextual-component-props)
  - [providers](#providers)
  - [providerInstances](#providerinstances)
  - [activeQueries](#activequeries)
  - [queryResults](#queryresults)
5.  [Query-related component props](#query-related-component-props)
  - [query](#query)
  - [queryOptions](#queryoptions)
  - [result](#result)
  - [queries](#queries)
  - [queriesOptions](#queriesoptions)
  - [results](#results)
  - [autoUpdateQueryResults](#autoupdatequeryresults)
6.  [Store modifications](#store-modifications)
7.  [Quick example](#quick-example)
8.  [Protips](#protips)
9.  [Complete list of exports](#complete-list-of-exports)


## Installation

```
npm install react-redux-provide --save
```

And then at the very beginning of your app:

```js
import 'react-redux-provide/lib/install';
```

> **Note:** If you need to disable the automatic wrapper for specific components (usually 3rd party components), set a static `__provide` property to `false` on the component - e.g., `SomeComponent.__provide = false`.

> This is only necessary until React has a better `context` API.

If you'd rather not use the `install` method, you must wrap your top component with the [`provide`](#provide) function so that `providers` can be retrieved via `context`, assuming you follow convention and actually pass your `providers` to the top component.


## What does this do?

![react redux providers and replication](https://cloud.githubusercontent.com/assets/7020411/16416007/5b97b936-3cfd-11e6-87e5-f38d9abe631d.png)

This library allows you to:

- Build your applications in an extremely declarative manner.  Think of it as the Redux equivalent of GraphQL/Relay, but slightly easier to get started (you decide).

- Share and manipulate application state across any number of components.  Updates are *extremely* efficient!  Check the comments in [the source](https://github.com/loggur/react-redux-provide/blob/master/src/provide.js).

- Think of provider-specific `propTypes` as any other `import` statement.  The only difference is that `props` are synchronized with the current state and obtained via `context`.  It's easiest to think about it like this: If a component isn't passed some `propType` as a `prop`, it will be automatically provided to it via `context` from the matching provider.

- Save, restore, and replicate the state of anything within your application.  Providers can be used to represent and manage anything!  Users, pages, themes, posts, comments, votes, maps, etc., etc., etc.  The only limit is your imagination.

- Use multiple Redux stores.  Why multiple stores?  This allows for a maximum separation of concerns while also making it possible to (re)use providers when manipulating the state of multiple provider instances of the same type (e.g., users).

- Compose many different actions, reducers, etc., into a single provider.

- Compose many small applications and/or services into a single application.

- Maximally separate your concerns, which leads to fewer bugs and a better experience for developers.

- Eliminates the need for any extraneous dependencies within components, which makes all components and providers instantly distributable and reusable.  Components get the relevant Redux stores' states and action creators as `props` via [React's `context`](https://facebook.github.io/react/docs/context.html).

- Hot reload your providers in development with no extra configuration.


## What is a provider?

If you're already familiar with Redux's `Provider` component, that's not what this is, but it's where the inspiration came from.  A provider can do essentially anything Redux can do, but it is encapsulated, reusable, extremely declarative, and mostly automatic.

For example, you might have a [theme provider](https://github.com/loggur/provide-theme) and a [user provider](https://github.com/loggur/provide-user).  These providers are automatically instantiated as needed, so in the case of the [user provider](https://github.com/loggur/provide-user), you can have many different instances at the same time to represent multiple users.  Each instance has its own "store" and works completely independently of one another, but you can also configure providers to automatically subscribe to and/or find/create/interact with others if necessary.  "Stores" are responsible for holding the current state and handling actions to update that state.  The current state and action creators (and any `props` which might be derived from a combination of state and component `props`) are automatically mapped to React components as needed.

A provider is a plain object composed of a handful of different properties (see below).  These properties are designed to work together to represent and manipulate the state of anything within your application.  You can also declaratively replicate the state of any provider instance's store to some database and/or to other clients.  Redux stores are automatically created based on these properties and assigned to each provider instance.

Example:

```js
export default {
  // the basics
  actions: { ... },
  reducers: { ... },
  merge: { ... },             // optional
  middleware: [ ... ],        // optional
  enhancer: () => {},         // optional

  // initialization
  state: { ... },             // optional, typically set via app config
  onInstantiated: () => {},   // optional, sometimes set via app config
  onReady: () => {},          // optional, sometimes set via app config

  // replication
  key: () => {},              // optional, typically set via app config
  replication: { ... },       // optional, typically set via app config
  clientStateKeys: [ ... ],   // optional, sometimes set via app config

  // advanced
  subscribeTo: { ... },       // optional, typically set via app config
  subscribers: { ... },       // optional, typically set via app config
  wait: () => {},             // optional, typically set via app config
  clear: () => {},            // optional, typically set via app config
  isGlobal: Boolean           // optional, typically set via app config
};
```

## The basics

### actions

Object containing [Redux actions](http://redux.js.org/docs/basics/Actions.html).

  ```js
  const PUSH_ITEM = 'PUSH_ITEM';

  const actions = {
    pushItem(item) {
      return { type: PUSH_ITEM, item };
    }
  };
  ```

  **Note:** When providing each action creator to React components, the result of the action creator is automatically wrapped with `providerInstance.store.dispatch`, so with the above example, when you call `this.props.pushItem(item)`, you're ultimately calling `providerInstance.store.dispatch(actions.pushItem(item))`.

### reducers

Object containing [Redux reducers](http://redux.js.org/docs/basics/Reducers.html).

  ```js
  const reducers = {
    list(state = [], action) {
      switch (action.type) {
        case PUSH_ITEM:
          return state.concat(action.item);

        default:
          return state;
      }
    }
  };
  ```

  **Note:** Components will only be updated whenever a relevant reducer returns a new state - i.e., when `state !== nextState`.

### merge

Optional object used for deriving `props` which depend on the state of the store, possibly merged with the component's `props` and/or `context`.  For example, suppose one of the `reducers` returns an array, and some component only wants some item at a specific index.

  ```js
  const merge = {
    item: {
      keys: ['list'], // run `get` function only when list changes
      get(state, props, context) {
        // this is run only for components with an item propType
        // and components will be updated only when the item has changed
        const { list } = state;
        const { itemIndex } = props;

        return list[itemIndex] || null;
      }
    }
  };
  ```

### middleware

Optional [Redux middleware](http://redux.js.org/docs/advanced/Middleware.html) specific to your provider.  This can be either a single middleware or an array of middlewares.

  ```js
  import createLogger from 'redux-logger';

  const middleware = createLogger();
  // or const middleware = [ createLogger() ];
  ```

**Note:** Every provider is given its own custom thunk middleware.  It works the same as `redux-thunk` but always includes a special third `providerApi` argument.  See the [thunk API section](#thunk-api).

### enhancer

Optional [Redux store enhancer](http://redux.js.org/docs/Glossary.html#store-enhancer) specific to your provider.  This can be either a single enhancer or an array of enhancers.

  ```js
  // from `provide-theme`
  // ensures current theme is always initialized
  // mainly for when store.setState or store.setKey is called

  const enhancer = next => (reducer, initialState, enhancer) => {
    const store = next(reducer, initialState, enhancer);
    let currentThemeName = null;

    function setTheme(state) {
      const { themes, themesFiles, themeName } = state;
      const theme = themes && themes[themeName] || state.theme;
      const themeFiles = themesFiles && themesFiles[themeName];
      let initAction = null;

      currentThemeName = themeName;

      if (theme || themeFiles) {
        initAction = theme && actions.initTheme(themeName, themeFiles, theme);

        if (initAction && (!canUseDOM || initAction.link && initAction.script)) {
          store.dispatch(initAction);
        } else if (canUseDOM) {
          actions.loadTheme(themeName, themeFiles, theme)(store.dispatch);
        } else {
          store.dispatch(actions.loadTheme(themeName, themeFiles, theme));
        }
      }
    }

    setTheme(initialState || {});

    store.subscribe(() => {
      const nextState = store.getState();

      if (nextState.themeName !== currentThemeName) {
        setTheme(nextState);
      }
    });

    if (process.env.NODE_ENV !== 'production') {
      if (canUseDOM) {
        window.themeReloaders.push((reloadedThemeName, theme) => {
          const { themeName, themeFiles } = store.getState();

          if (themeName === reloadedThemeName) {
            actions.loadTheme(themeName, themeFiles, theme)(store.dispatch);
          }
        });
      }
    }

    return store;
  };
  ```

## Initialization

### key

Optional string or function.  Defaults to its respective `key` within the `providers` object.  See the [example below](#quick-example) for more about the `providers` object.

  Providers are instantiated based on their `key`:

  - If the `key` is a string, it's considered a static provider and is instantiated immediately at the top level.  This `key` becomes the provider instance's identifying `providerKey`.

  - If the `key` is a function, it's considered a dynamic provider and is instantiated only as needed.  The function should accept some component instance as an argument and should return a string which becomes the provider instance's identifying `providerKey`.  If a provider instance with that `providerKey` already exists, the same instance will be used.  The function may also return a falsy value, which will disable replication for the instance and the `providerKey` will default to its respective `key` within the `providers` object.

  **Note:** Replication won't work without a `key`, since a falsy value indicates disabled replication.

  Example:

  ```js
  providers.user.key = ({ props }) => props.userId
    ? `userId=${props.userId}`
    : null;
  ```

### defaultKey

The above `key` will default to this.  You typically don't need to set this yourself since it will come from the `providers` object.

### state

Optional object used for overriding the store's initial state.  This is typically used only when the initial state can be derived from the current request and/or session, as the default initial state should come from the `reducers` themselves.  It works best to copy and extend providers using the spread operator.

  ```js
  renderApp({
    providers: {
      ...providers,
      theme: {
        ...providers.theme,
        state: themeState
      }
    }
  });
  ```

### onInstantiated

Optional function or array of functions to be called immediately after the provider has been instantiated and before its optional replicators have initialized.  The provider instance will be passed to the function(s).

  ```js
  function onInstantiated(providerInstance) {
    console.log(providerInstance);
  }
  ```

### onReady

Optional function or array of functions to be called immediately after the provider and its optional replicators have initialized.  The provider instance will be passed to the function(s).

  ```js
  function onReady(providerInstance) {
    console.log(providerInstance);
  }
  ```


**Additionally:** During the very first tick of the app *only on the client*, the root provider component will look for a `window.clientStates` object and convert it to provider instances which are cached within the current `context`.  Each state is removed from the `window.clientStates` object as a result.  If you're using the official [page provider](https://github.com/loggur/provide-page), you won't ever need to worry about this.  See [`provide-page/src/defaultRenderDocumentToString.js`](https://github.com/loggur/provide-page/blob/master/src/defaultRenderDocumentToString.js) for an example where the client states are extracted from the server's provider instances' stores, stringified (using `JSON.stringify`) and sent to the client for the initial render.


## Replication

Replication is a key concept when building any stateful application where you need to store, retrieve, and/or share information.  When implemented correctly, it allows you to decouple data initialization, storage, and retrieval from your application so that your only concern is rendering its state.  It allows you declaratively connect application state to data sources and create efficient, scalable, and reliable software with relatively minimal effort.  It allows you to instantly swap one database for another, one websocket implementation for another, or any other use case you can think of.  If you're unfamiliar with replication, Wikipedia's [State machine replication](https://en.wikipedia.org/wiki/State_machine_replication) page is a good place to start!

Creating replicators for Redux and using them with providers should hopefully be pretty straightforward.  Similar to providers, a replicator is a plain object with a few optional properties that describe how the state should be initialized and/or replicated - i.e., stored within a database or sent to other clients via websockets.

### replication

Optional object or array of objects.  Uses [`redux-replicate`](https://github.com/loggur/redux-replicate) (a Redux store enhancer) under the hood.  Each object should contain keys that match the arguments expected by [`redux-replicate`](https://github.com/loggur/redux-replicate) - i.e., `{ key, reducerKeys, replicator, queryable (optional), clientState (optional) }`.  The `key` will default to the provider instance's `providerKey`.

Example where some `user` provider instance's states are replicated to flat files whenever they change:

```js
import fs from 'redux-replicate-fs';

const replication = {
  // only these reducers are watched/replicated
  reducerKeys: [
    'userId',
    'userName',
    'userPasswordHash'
  ],
  // and we want to be able to retrieve user instances by `userName`
  queryable: [
    'userName'
  ],
  // and here we'll use node's file system API to store states in flat files
  replicator: fs
};
```

See [`redux-replicate`](https://github.com/loggur/redux-replicate) for the full documentation which can be used within the `replication` object.  Also see [`redux-replicate-fs`](https://github.com/loggur/redux-replicate-fs) for an example replicator implementation that gets the initial state, stores states upon changes, and handles queries.

### baseQuery

Optional object that can be used as the base of each query.  For example, if you know you almost always want to search for accounts that have not been deactivated, you would set the `baseQuery` within your `replication` object as follows:

```js
const replication = {
  reducerKeys: [
    'accountName',
    'accountDeactivated'
  ],
  queryable: true,
  baseQuery: {
    accountDeactivated: false
  }
};
```

### baseQueryOptions

Optional object that can be used as the base of each query's options.  For example, if you want to limit the query results to some number by default:

```js
const replication = {
  reducerKeys: [
    'userId',
    'userName',
    'userPasswordHash'
  ],
  queryable: [
    'userName',
    'userDeleted'
  ],
  baseQuery: {
    userDeleted: false
  },
  baseQueryOptions: {
    limit: 100
  }
};
```

### clientStateKeys

Optional array of `reducerKeys`.  This isn't used directly by `react-redux-provide`, but it is the recommended way to specify which `reducerKeys` should be sent to the client by the server.  See [`provide-page`](https://github.com/loggur/provide-page) for an example of how this is used.

## Advanced

### subscribeTo

Optional object which will automatically subscribe to any matching providers by `key`.  Each value within the object should be a function that accepts the subscribed to provider instance as the first argument and the subscribing instance as the second argument.

For example, suppose you have a static `theme` provider instance and you want its state to depend on the currently logged in user (to represent their selected theme).  And suppose you're using the `page` provider to contain the current `userId` within its `requestSession` state object.  You could set the `theme` provider to subscribe to the `page` provider such that it updates the `theme` store's key like this:

  ```js
  import theme from 'provide-theme';

  function getThemeKey(pageState) {
    const { userId } = pageState.requestSession;

    return userId ? `theme&userId=${userId}` : null;
  }

  // disable replication by default
  theme.replication.key = null;

  theme.subscribeTo = {
    page({ store: pageStore }, { store: themeStore }) {
      // stores have a `setKey` method that allows you to change their key,
      // which will reinitialize the store (i.e., state) based on the new key;
      // only the replication key is changed, not the key used for identifying
      // the provide instance
      if (themeStore.setKey) {
        const themeKey = getThemeKey(pageStore.getState());

        if (themeKey !== themeStore.key) {
          themeStore.setKey(themeKey);
        }
      }
    }
  };

  export default theme;
  ```

### subscribers

Optional object which will automatically subscribe any matching providers by `key`.  Each value within the object should be a function that accepts the subscribed to provider instance as the first argument and the subscribing instance as the second argument.

Works exactly like `subscribeTo` but in the opposite direction.  The following is equivalent to the `subscribeTo` example above (but don't do both because that would be silly):

  ```js
  import page from 'provide-page';

  function getThemeKey(pageState) {
    const { userId } = pageState.requestSession;

    return userId ? `theme&userId=${userId}` : null;
  }

  page.subscribers = {
    theme({ store: pageStore }, { store: themeStore }) {
      if (themeStore.setKey) {
        const themeKey = getThemeKey(pageStore.getState());

        if (themeKey !== themeStore.key) {
          themeStore.setKey(themeKey);
        }
      }
    }
  };

  export default page;
  ```

### wait

Optional function that is called whenever a provider instance begins doing something asynchronously.  This is used in conjunction with the `clear` property below.

### clear

Optional function that is called whenever a provider instance finishes doing something asynchronously.  The function will be called with `true` as the first argument if the provider instance's store's state has changed.

The `wait` and `clear` functions are useful for things like server rendering, where you need to wait for asynchronous operations to complete before continuing.

Quick example:

  ```js
  import { pushWait, pushClear } from 'react-redux-provide';
  import * as providers from './providers/index';

  let rerender = false;
  let waitCount = 0;

  function wait() {
    waitCount++;

    console.log(`Waiting for async operation (${waitCount}) to finish...`);
  }

  function clear(stateChanged) {
    if (stateChanged) {
      rerender = true;
    }

    console.log(`Async operation (${waitCount}) done!`);

    if (stateChanged) {
      console.log(`The state changed during this operation.`);
    } else {
      console.log(`The state did not change during this operation.`);
    }

    if (--waitCount === 0) {
      respondOrRerender();
    }
  }

  pushWait(providers, wait);
  pushClear(providers, clear);

  // etc.
  ```

See [provide-page/src/createMiddleware.js](https://github.com/loggur/provide-page/blob/master/src/createMiddleware.js) for a full example.

### isGlobal

Optional boolean value.  Useful for cases where you want to use the same provider instances across multiple requests on the server.  An example of this is an [ID generator provider](https://github.com/loggur/provide-id-gen) which needs an atomic store.


## Thunk API

All providers are given a special thunk middleware which includes a `providerApi` object as a third argument to the action's returned function.  The `providerApi` contains a handful of useful functions for getting provider instance(s), setting provider states, dispatching actions, and finding data and/or getting instantiated providers based on that data.  Any sorting/grouping is left entirely up to the replicator and the options passed to its `handleQuery` function.

For example, suppose you want unique user names.

You would start by setting the `user` provider's `replication` property such that the `userName` state is queryable:

```js
const replication = {
  // only these reducers are watched/replicated
  reducerKeys: [
    'userId',
    'userName',
    'userPasswordHash'
  ],
  // and we want to be able to retrieve user instances by `userName`
  queryable: [
    'userName'
  ],
  // and here we'll use node's file system API to store states in flat files
  replicator: fs
};
```

And then the `createUser` action would look like this:

```js
const actions = {
  createUser(state, genUserId, onSuccess) {
    if (canUseDOM) {
      // we want this to occur only on the server
      return { type: CREATING_USER };
    }

    const { userName, userPassword } = state;

    if (!userName) {
      return actions.setUserError('Enter a name!');
    }

    if (!userPassword) {
      return actions.setUserError('Enter a password!');
    }

    return (dispatch, getState, { createInstance, find }) => {
      // here we need to ensure the user name is not already in use
      find({ query: { userName }, options: { select: 'userId' } }, results => {
        if (results && results.length) {
          dispatch(actions.setUserError('User exists!'));
          return;
        }

        const defaultState = getState();
        const {
          hasher = defaultState.hasher,
          saltRounds = defaultState.saltRounds
        } = state;

        hasher.hash(userPassword, saltRounds, (error, userPasswordHash) => {
          if (!userPasswordHash) {
            dispatch(actions.setUserError('Error hashing password!'));
            return;
          }

          // here we instantiate the user instance within the current context
          // using the proper key - i.e., `userId=state.userId`
          // and then the CREATE_USER action sets the proper userId, userName, etc.
          // which is then replicated to your database of choice
          state.userId = genUserId();

          createInstance(state, userInstance => {
            userInstance.store.dispatch({
              ...state,
              userPasswordHash,
              type: CREATE_USER
            });

            dispatch({
              ...state,
              type: CREATED_USER
            });

            if (onSuccess) {
              onSuccess(state.userId);
            }
          });
        });
      });
    };
  }
};
```

### getInstance (Object|String state|key|providerKey, Function callback)

Uses [`instantiateProvider`](#instantiateprovider) to get some provider instance based on some `state` - i.e., same method used when providing some instance to components.

### getInstances (Array states|keys|providerKeys, Function callback)

A shortcut to get multiple instances at once.  Uses `getInstance` under the hood.

### createInstance (Object state, Function callback)

Just like `getInstance` but ensures the initial states are replicated.

### createInstances (Array states, Function callback)

A shortcut to create multiple instances at once.

### setStates (Object states)

This should typically only be used client-side when the server sends the client states that it needs to properly perform some action.  This function sets the states of multiple provider instances, or if they don't exist yet, their states are cached on the `window.clientStates` object.

If you're using the official [page provider](https://github.com/loggur/provide-page), you won't ever need to use this function yourself.  See the `getPageStates` and `submitForm` methods in [`provide-page/src/index.js`](https://github.com/loggur/provide-page/blob/master/src/index.js) for exact usage.

### find (Object state, Optional Boolean doInstantiate, Function callback)

Queries replicators with a `handleQuery` method to retrieve an array of states representing any provider instance partially matching the `state` argument.  If `doInstantiate` is `true`, providers will be instantiated based on each state and passed to the `callback`.  If `doInstantiate` is `false` or omitted, only the array of states is passed to the `callback`.


## Contextual component props

These properties are passed down via `context` and are used interally by this library.  You can override them with your own props at any time, but in most cases you should never have to do that.

### providers

Object containing all of the providers used throughout the app.  The top level component should receive this prop.  You can also pass a new `providers` object (along with a new `providerInstances` object) at any level, but you typically shouldn't do that.

### providerInstances

Object containing all of the instantiated providers.

### activeQueries

Object containing any queries being handled at the time.

### queryResults

Object containing the latest query results.


## Query-related component props

There are a handful of props you can use for finding provider instances whose states have been replicated to (stored within) data sources.

### query

An object or a function which should return an object containing the query for the component.  The query should typically contain a map of reducer keys to states you're searching for, but it can be anything supported by your replicator's `handleQuery` method.  The function will receive the component instance.  If the function returns `null`, the query will not be handled and the `result` will be `null`.

Example:

```js
import React, { Component, PropTypes } from 'react';

class FooFinder extends Component {
  static propTypes = {
    fooName: PropTypes.string.isRequired,
    query: PropTypes.any,
    result: PropTypes.any
  };

  static defaultProps = {
    query({ props: { fooName } }) {
      return fooName ? { fooName } : null;
    }
  };

  render() {
    const { result } = this.props;
    const numFound = result && result.length;

    if (numFound) {
      return (
        <div className="foo-finder foo-found">
          {JSON.stringify(result)}
        </div>
      );
    } else {
      return (
        <div className="foo-finder foo-not-found">
          No Foos found!
        </div>
      );
    }
  }
}
```

And so if the component is declared like this:

```js
<FooFinder fooName="bar" />
```

And a couple of `Foo` provider instances have "bar" as the state of their `fooName`, the `result` prop might look like this:

```json
[
  {
    "fooId": 0,
    "fooName": "bar",
    "includes": "entire state by default"
  },
  {
    "fooId": 1,
    "fooName": "bar",
    "etc": "etc"
  }
]
```

The `result` prop comes from your replicator's `handleQuery` function.  It should typically be an array of states.

Alternatively, you could simply pass a `query` prop to the component (usually either a function or an object), rather than have it derived from `defaultProps`.

**Note:** If the `query` isn't compatible with any provider, it will be assumed that it isn't a provider query and will be treated as a normal prop.

### queryOptions

Only used in conjunction with a valid `query`.  These options are passed to your replicator's `handleQuery` function and should typically be specific to the options supported by the replicator.

**Coming soon:** A standard/recommended set of query options that replicators should support.  Please see [https://github.com/loggur/react-redux-provide/issues/33](https://github.com/loggur/react-redux-provide/issues/33) and discuss!

### result

Only used in conjunction with a valid `query`.  The result returned by your replicator's `handleQuery` function.  Defaults to `null`.  Only exists if [the `query` prop](#query) exists.

### queries

Works exactly the same as [the `query` prop](#query), but should only be used if you know the base provider key for each query, as it is a map of base provider keys to queries.  You typically just want to use [the `query` prop](#query), as the queries will be mapped to their providers automatically.

The following will produce the same functionality and output as the above `query` example:

```js
import React, { Component, PropTypes } from 'react';

class FooFinder extends Component {
  static propTypes = {
    fooName: PropTypes.string.isRequired,
    queries: PropTypes.any,
    results: PropTypes.any
  };

  static defaultProps = {
    queries({ props: { fooName } }) {
      return {
        foo: fooName ? { fooName } : null
      };
    }
  };

  render() {
    const { results } = this.props;
    const numFound = results && results.foo && results.foo.length;

    if (numFound) {
      return (
        <div className="foo-finder foo-found">
          {JSON.stringify(results.foo)}
        </div>
      );
    } else {
      return (
        <div className="foo-finder foo-not-found">
          No Foos found!
        </div>
      );
    }
  }
}
```

And the `results` object would simply be:

```json
{
  "foo": [
    {
      "fooId": 0,
      "fooName": "bar",
      "includes": "entire state by default"
    },
    {
      "fooId": 1,
      "fooName": "bar",
      "etc": "etc"
    }
  ]
}
```

**Note:** If `queries` isn't compatible with any provider, it will be assumed that it isn't provider queries and will be treated as a normal prop.

### queriesOptions

Only used in conjunction with a valid `queries`.  Works exactly like `queryOptions` but with the options pre-mapped to each provider.

### results

Only used in conjunction with a valid `queries`.  See `queries` example above.  Only exists if the `queries` prop exists.


## Store modifications

The enhancer adds the following to the `store` object.

### store.key

The current `key`.

### store.setKey (String key, Function readyCallback)

Sets the current `key`.  The `readyCallback` is called after all of the replicators have fully initialized based on the new `key`.

### store.setState (Mixed nextState)

You typically shouldn't need to use this, as state changes should almost always occur as a result of `store.dispatch(action)`.  But it may be useful for keeping a store's state synchronized with some data source which doesn't rely on actions.  If using `reducerKeys`, the `nextState` is expected to be an object and is merged into the current state, similar to React's `setState`.  If not using `reducerKeys`, the `nextState` replaces the current state entirely.

### store.watch (String reducerKey, Function handler)

Mostly used internally for watching for whenever some reducer returns a different state so that components can efficiently know when they should update.

### store.onReady (Function readyCallback)

You can use this if you know your replicator(s) asynchronously initialize the store's state and would like to do something immediately after initialization.  The `readyCallback` will receive the `store` within an object - e.g., `readyCallback({ store })`.

### store.initializedReplication

If for some reason you need to know whether or not `getInitialState` has completed, you can check this boolean property.  It will be `true` after initialization.


## Quick example

Let's create a provider that can synchronously and asynchronously increment some count.  We'll control the count with one component and display the current count with another.

```js
// src/providers/counter.js

// import thunk from 'redux-thunk';  // for async actions
// as of v6.0, thunk middleware is no longer required
// since all providers are given their own custom thunk middleware
// which includes the provider API as a 3rd argument

const INCREMENT = 'INCREMENT';

const actions = {
  increment(by = 1) {
    return { type: INCREMENT, by };
  },

  incrementAsync(by = 1, delay = 1000) {
    return dispatch => setTimeout(
      () => dispatch(actions.increment(by)),
      delay
    );
  }
};

const reducers = {
  count(state = 0, action) {
    switch (action.type) {
      case INCREMENT:
        return state + action.by;

      default:
        return state;
    }
  }
};

export default { actions, reducers };
```

Now let's see how easy it is to manipulate the `count` state!  We simply declare `propTypes` for `actions` that we want, and components will receive action creators as `props`.  For example, to dispatch the `INCREMENT` action asynchronously, all we need to do is declare `incrementAsync` within our `propTypes` and eventually call `this.props.incrementAsync()`.

**Note:** When providing each action creator to React components, the result of the action creator is automatically wrapped with `providerInstance.store.dispatch`, so with the following example, when you call `this.props.increment()`, you're ultimately calling `providerInstance.store.dispatch(actions.increment())`.

```js
// src/components/IncrementButtons.js

import React, { Component, PropTypes } from 'react';

export default class IncrementButtons extends Component {
  static propTypes = {
    increment: PropTypes.func.isRequired,
    incrementAsync: PropTypes.func.isRequired
  };

  render() {
    return (
      <div className="IncrementButtons">
        <button onClick={() => this.props.increment()}>
          Increment
        </button>

        <button onClick={() => this.props.incrementAsync()}>
          Increment asynchronously
        </button>
      </div>
    );
  }
};
```

Then to display the current `count` within some component, simply declare `count` as a `propType`!  The component will automatically re-render whenever the `count` reducer returns a different state.

```js
// src/components/CurrentCount.js

import React, { Component, PropTypes } from 'react';

export default class CurrentCount extends Component {
  static propTypes = {
    count: PropTypes.number.isRequired
  };

  render() {
    return (
      <div className="CurrentCount">
        Current count is {this.props.count}!
      </div>
    );
  }
};
```

Now how do we tie everything together?  Easy!  Two methods:

1.  The easiest and recommended method is to use this library's `install` module, which automatically wraps all of your React classes with the `provide` function.  This allows all of your components to be packaged independently of this library.  There's also a chance that future React versions will support this type of enhancement, so this is definitely the recommended method!
  
  All you do is `import 'react-redux-provide/lib/install'` at the top of your main entry (or entries).

  > **Note:** If you need to disable the automatic wrapper for specific components (usually 3rd party components), set a static `__provide` property to `false` on the component - e.g., `SomeComponent.__provide = false`.

  ```js
  // src/renderApp.js

  import 'react-redux-provide/lib/install';
  import React from 'react';
  import { render } from 'react-dom';
  import { App } from './components/index';
  import defaultProps from './defaultProps';

  function renderApp(props, element = document.getElementById('root')) {
    return render(<App { ...props } />, element);
  }

  renderApp(defaultProps);

  export default renderApp;
  ```

2.  If you would rather not use the `install` module, you can manually wrap each component with the `provide` function.  In this case, your components will look something like this:

  ```js
  // src/components/CurrentCount.js

  import React, { Component, PropTypes } from 'react';
  import provide from 'react-redux-provide';

  class CurrentCount extends Component {
    static propTypes = {
      count: PropTypes.number.isRequired
    };

    render() {
      return (
        <div className="CurrentCount">
          Current count is {this.props.count}!
        </div>
      );
    }
  };

  export default provide(CurrentCount);
  ```

  Or if you would prefer to use it as an ES7 decorator:

  ```js
  // src/components/CurrentCount.js

  import React, { Component, PropTypes } from 'react';
  import provide from 'react-redux-provide';

  @provide
  export default class CurrentCount extends Component {
    static propTypes = {
      count: PropTypes.number.isRequired
    };

    render() {
      return (
        <div className="CurrentCount">
          Current count is {this.props.count}!
        </div>
      );
    }
  };
  ```

And now when rendering the application, all we have to do is include a `providers` prop.

```js
import React from 'react';
import { render } from 'react-dom';
import * as providers from './providers/index';
import { App } from './components/index';

function renderApp(props, element = document.getElementById('root')) {
  return render(<App { ...props } />, element);
}

renderApp({ providers });

export default renderApp;
```

We can also customize each provider's initial state.

```js
renderApp({
  providers: {
    ...providers,
    counter: {
      ...providers.counter,
      state: {
        count: 42
      }
    }
  }
});
```


## Protips

- For most providers, everything might fit within a single file, but you can structure your imports and exports however you want since each provider is ultimately just a single object.

- Use provider factories to create providers with unique keys for common use cases.  The [`array`](https://github.com/loggur/provide-array) and [`map`](https://github.com/loggur/provide-map) providers are good examples.

  ```js
  // src/providers/todoList.js

  import provideArray from 'provide-array';

  const todoList = provideArray('todoList', 'todoItem', 'todoItemIndex');

  export default todoList;
  ```

- Providers are composable objects!  You can combine as many providers as you need.  This is great when you have core functionality you would like to implement within multiple providers.

  ```js
  // src/providers/privateResource.js

  import provideResource from 'provide-resource';
  import provideAuthentication from 'provide-authentication';

  const privateResourceKey = 'privateResource';
  const resource = provideResource(privateResourceKey);
  const authentication = provideAuthentication(privateResourceKey);

  const actions = {
    ...resource.actions,
    ...authentication.actions
  };

  const reducers = {
    ...resource.reducers,
    ...authentication.reducers
  };

  const middleware = [
    ...resource.middleware,
    ...authentication.middleware
  ];

  export default { actions, reducers, middleware };
  ```

- Apps typically only need a `components` directory and a `providers` directory.  A `themes` directory is also recommended!  See [`provide-theme`](https://github.com/loggur/provide-theme). Also see [Lumbur](https://github.com/loggur/lumbur) for some boilerplate (with the [Lumburjack](https://github.com/loggur/lumburjack) generator) to start using this architecture in a matter of minutes.

- Components should have no knowledge of constants used within providers, which leads to a maximum separation of concerns and is always the best design.  Everything (states and action creators) should be obtainable via `props` such that components simply render the application state and create actions.

- The more people who adopt providers, the better!  The provider paradigm makes it insanely easy to integrate each other's services, build apps around specific providers, or even combine multiple apps and/or services into one.

- There's a shortcut for dispatching actions, which might be useful when writing tests or inter-provider communication.

  Instead of:
    ```js
    providerInstance.store.dispatch(providerInstance.actions.doSomething('fun'))
    ```

  You can just do this:
    ```js
    providerInstance.actionCreators.doSomething('fun')
    ```

- Check out [`react-devtools`](https://github.com/facebook/react-devtools) for a closer look at what exactly is going on when using providers!

![See `ProvideBranches(theme,packageList,sources)`](https://cloud.githubusercontent.com/assets/7020411/9288123/3587858e-4305-11e5-8156-fe0392e6f7fd.png)


## Complete list of exports

Other than the `provide` function, nearly all of the exports are utility functions.

### provide

The default export which accepts a React class and returns the class wrapped with a higher-order component designed to share and manage application state via `context`.  Only use this if you aren't using the `install` module.

### reloadFunctions (Object oldFunctions, Object newFunctions)

Useful for hot reloading stateless function components.  The state of your app and your stores will remain intact!

  See [`bloggur/src/renderApp.js`](https://github.com/loggur/bloggur/blob/master/src/renderApp.js) for an example of how to hot reload providers using `webpack`'s hot module replacement.

### reloadProviders (Object providers, Optional Object providerInstances)

Useful for hot reloading of providers.  The state of your app and your stores will remain intact!

  See [`bloggur/src/renderApp.js`](https://github.com/loggur/bloggur/blob/master/src/renderApp.js) for an example of how to hot reload providers using `webpack`'s hot module replacement.  All you have to do is `import { reloadProviders } from 'react-redux-provide'` and pass your updated `providers` to it.

  ```js
  if (process.env.NODE_ENV !== 'production') {
    if (module.hot) {
      module.hot.accept('./defaultProps', () => {
        reloadProviders(require('./defaultProps').default.providers);
      });
    }
  }
  ```

### instantiateProvider (Optional Object fauxInstance, Object provider, Optional String|Function providerKey, Optional Function readyCallback, Optional Object createState)

Returns an instance of some provider.  Each provider instance is assigned its own `providerKey` and has its own store.  And each instance is cached within the `context`'s `provideInstances` object by its `providerKey`.  If the instance already exists, it will be returned.  You probably won't ever need to use this.

The `fauxInstance` should resemble a component instance - i.e., `{ props, context }`.

The `createState` object will be passed to `createProviderStore` (below).

### createProviderStore (Object providerInstance, Optional Mixed storeKey, Optional Object createState)

Creates and returns a store specifically for some provider instance.  You probably won't ever need to use this.

If the `createState` object is included, it is merged into the store's initial state and indicates that the initial state should be replicated - i.e., `replication.create` is set to `true`.

### getClientState (Object providerInstance)

Gets the state from `window.clientStates` for the `providerInstance` based on its `providerKey`, if it exists.  Returns `null` if not.  You probably won't ever need to use this.

### getInitialState (Object providerInstance)

Merges and returns the `state` property with the result of `getClientState`.  Returns an empty object by default.  You probably won't ever need to use this.

### getTempFauxInstance (Object fauxInstance, Object props)

Gets a new `fauxInstance` with the same `context` but with new `props`.

### getFromContextOrProps (Object fauxInstance, String key, Optional defaultValue)

Gets and caches some property from the `fauxInstance`'s `context` or `props`.

### getProviders (Object fauxInstance)

Gets the `providers` object from the `fauxInstance`'s `context` or `props`.

### getProviderInstances (Object fauxInstance)

Gets the `providerInstances` object from the `fauxInstance`'s `context` or `props`.

### getActiveQueries (Object fauxInstance)

Gets the `activeQueries` object from the `fauxInstance`'s `context` or `props`.

### getQueryResults (Object fauxInstance)

Gets the `queryResults` object from the `fauxInstance`'s `context` or `props`.

### getFunctionOrObject (Object fauxInstance, String key, Optional defaultValue)

Gets and caches some property from the `fauxInstance`'s `context` or `props`.  If its a function, it will be called as `value(fauxInstance)` and the result cached.

### getQueries (Object fauxInstance)

Gets the `queries` object (using `getFunctionOrObject`) from the `fauxInstance`'s `context` or `props`.

### getQuery (Object fauxInstance)

Gets the `query` object (using `getFunctionOrObject`) from the `fauxInstance`'s `context` or `props`.

### getQueryOptions (Object fauxInstance)

Gets the `queryOptions` object (using `getFunctionOrObject`) from the `fauxInstance`'s `context` or `props`.

### getQueriesOptions (Object fauxInstance)

Gets the `queriesOptions` object (using `getFunctionOrObject`) from the `fauxInstance`'s `context` or `props`.

### getQueryHandlers (Object provider)

Gets all `handleQuery` functions within replicators and returns the relevant `{ handleQuery, reducerKeys }`.

### getMergedResult (Mixed mergedResult, Mixed result)

Merges the `result` into the `mergedResult` and returns the new `mergedResult`.

### resultsEqual (Mixed result, Mixed previousResult)

Returns `true` if the `result` essentially matches the `previousResult`.

### handleQueries (Object fauxInstance, Optional Function callback)

Performs any queries which may exist within the `fauxInstance`s `props` and assigns the `results` to `props.results` if `props.queries`, or assigns the flattened `result` to `props.result` if `props.query`.

### createKeyConcat (String|Array keys, Boolean unshift)

Returns a function that can be used for concatenating/normalizing certain provider properties.  The `push____` and `unshift____` functions (below) were created using this function.  You probably won't ever need to use this.

Example:

```js
const middlewareKey = 'middleware';
export const pushMiddleware = createKeyConcat(middlewareKey);
export const unshiftMiddleware = createKeyConcat(middlewareKey, true);
```

### shallowEqual (Object A, Object B)

Compares object A's top level values to object B's top level values and returns true if equal.

### pushMiddleware|unshiftMiddleware (Object providers, Function|Array middleware)

Adds middleware(s) to each provider's chain of middlewares.  Useful when you want to apply middleware to many providers at once, specific to your application.

  ```js
  import { pushMiddleware, unshiftMiddleware } from 'react-redux-provide';
  import firstMiddleware from 'first-middleware';
  import lastMiddleware from 'last-middleware';
  import { theme, user } from './providers/index';

  unshiftMiddleware({ theme, user }, firstMiddleware);
  pushMiddleware({ theme, user }, lastMiddleware);
  ```

### pushEnhancer|unshiftEnhancer (Object providers, Function|Array enhancer)

Adds enhancer(s) to each provider's chain of enhancers.  Useful when you want to apply enhancers to many providers at once, specific to your application.

  ```js
  import { pushEnhancer, unshiftEnhancer } from 'react-redux-provide';
  import firstEnhancer from 'first-enhancer';
  import lastEnhancer from 'last-enhancer';
  import { theme, user } from './providers/index';

  unshiftEnhancer({ theme, user }, firstEnhancer);
  pushEnhancer({ theme, user }, lastEnhancer);
  ```

### pushOnInstantiated|unshiftOnInstantiated (Object providers, Function|Array callback)

Adds function(s) to each provider's array of `onInstantiated` callbacks.  Useful when you want to do something as each provider is instantiated, specific to your application.

  ```js
  import { pushOnInstantiated } from 'react-redux-provide';
  import * as providers from './providers/index';

  pushOnInstantiated(providers, providerInstance => {
    const { providerKey, store } = providerInstance;

    console.log(providerKey, store);
  });
  ```

### pushOnReady|unshiftOnReady (Object providers, Function|Array callback)

Adds function(s) to each provider's array of `onReady` callbacks.  Useful when you want to do something as soon as each provider and its optional replicators are ready, specific to your application.

  ```js
  import { pushOnReady } from 'react-redux-provide';
  import * as providers from './providers/index';

  pushOnReady(providers, providerInstance => {
    const { providerKey, store } = providerInstance;

    console.log(providerKey, store);
  });
  ```

### pushReplication|unshiftReplication (Object providers, Function|Array replication)

Adds replication to each provider.  Useful when you want to apply replication to many providers at once, specific to your application.

  ```js
  import { pushReplication, unshiftReplication } from 'react-redux-provide';
  import firstReplication from './replication/first';
  import lastReplication from './replication/last';
  import { theme, user } from './providers/index';

  unshiftReplication({ theme, user }, firstReplication);
  pushReplication({ theme, user }, lastReplication);
  ```

### pushReplicator|unshiftReplicator (Object providers, Function|Array replicator)

Adds replicator(s) to the each provider's `replication` property, if it exists.  Especially useful when client and server have nearly the same replication but require different replicators.  It's common for packaged providers to include a `replication` property without a `replicator` so that it's easy to know which `reducerKeys` should typically be replicated while leaving the actual (and optional) replicator up to the developer.

  ```js
  // client

  import { pushReplicator } from 'react-redux-provide';
  import localforage from 'redux-replicate-localforage';
  import * as providers from './providers/index';

  pushReplicator(providers, localforage);
  ```

  ```js
  // server

  import { pushReplicator } from 'react-redux-provide';
  import rethink from 'redux-replicate-rethink';
  import * as providers from './providers/index';

  pushReplicator(providers, rethink);
  ```

### pushWait|unshiftWait|pushClear|unshiftClear (Object providers, Function|Array wait|clear)

Adds function(s) to each provider's array of `wait` and/or `clear` functions.  Useful when you want to wait for an asynchronous operation to finish.

  ```js
  import { pushWait, pushClear } from 'react-redux-provide';
  import * as providers from './providers/index';

  let rerender = false;
  let waitCount = 0;

  function wait() {
    waitCount++;

    console.log(`Waiting for async operation (${waitCount}) to finish...`);
  }

  function clear(stateChanged) {
    if (stateChanged) {
      rerender = true;
    }

    console.log(`Async operation (${waitCount}) done!`);

    if (stateChanged) {
      console.log(`The state changed during this operation.`);
    } else {
      console.log(`The state did not change during this operation.`);
    }

    if (--waitCount === 0) {
      respondOrRerender();
    }
  }

  pushWait(providers, wait);
  pushClear(providers, clear);

  // etc.
  ```

