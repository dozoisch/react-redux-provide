# react-redux-provide

[![build status](https://img.shields.io/travis/loggur/react-redux-provide/master.svg?style=flat-square)](https://travis-ci.org/loggur/react-redux-provide) [![npm version](https://img.shields.io/npm/v/react-redux-provide.svg?style=flat-square)](https://www.npmjs.com/package/react-redux-provide)
[![npm downloads](https://img.shields.io/npm/dm/react-redux-provide.svg?style=flat-square)](https://www.npmjs.com/package/react-redux-provide)


# If you happen to read this between commits, this README is currently incomplete!  It should be complete within the next day or two.  :)


## Table of contents

1.  [Installation](#installation)
2.  [What does this do?](#what-does-this-do)
3.  [What is a provider?](#what-is-a-provider)
4.  [Quick example](#quick-example)
5.  [Primary exports](#primary-exports)
6.  [Protips](#protips)
7.  [Tutorial](#tutorial)
8.  [Replication](#replication)
9.  [Replicators](#replicators)


## Installation

```
npm install react-redux-provide --save
```


## What does this do?

This tiny library allows you to *effortlessly* and *automatically*:

- Build your applications in an extremely declarative manner.  Think of it as the Redux equivalent of GraphQL/Relay, but simpler and easier to use!

- Share and manipulate application state across any number of components.  Updates are *extremely* efficient!  Check the comments in [the source](https://github.com/loggur/react-redux-provide/blob/master/src/provide.js).

- Think of provider-specific `propTypes` as any other `import` statement.  The only difference is that `props` are synchronized with the current state and obtained via `context`.

- Save, restore, and replicate the state of anything within your application.  Providers can be used to represent and manage anything!  Users, pages, themes, posts, comments, votes, maps, etc., etc., etc.  The only limit is your imagination!

- Use multiple Redux stores.  Why multiple stores?  See the [tutorial below](#tutorial).

- Compose many small applications and/or services into a single application.

- Maximally separate your concerns, which leads to fewer bugs and a better experience for developers.

- Eliminates the need for any extraneous dependencies within components, which makes all components and providers instantly distributable and reusable.  Components get the relevant Redux stores' states and action creators as `props` via [React's `context`](https://facebook.github.io/react/docs/context.html).


## What is a provider?

A provider is a plain object composed of a handful of different properties (below).  These properties are designed to work together to represent and manipulate the state of anything within your application.  You can also easily replicate the state of any provider instance's store to some database and/or to other clients.  Each provider instance is given its own Redux store which is automatically created based on these properties.

Example:

```js
// src/providers/list.js

const actions = { ... };
const reducers = { ... };
const merge = { ... };        // optional
const middleware = [ ... ];   // optional
const enhancer = () => {};    // optional
const state = { ... };        // optional, typically set via app configuration
const key = () => {};         // optional, typically set via app configuration
const replication = { ... };  // optional, typically set via app configuration

export default { actions, reducers, merge, middleware, enhancer };
```

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
  import thunk from 'redux-thunk';

  const middleware = thunk;
  // or const middleware = [ thunk ];
  ```

### enhancer

Optional [Redux store enhancer](http://redux.js.org/docs/Glossary.html#store-enhancer) specific to your provider.  This can be either a single enhancer or an array of enhancers.

  ```js
  // from `provide-page`
  // ensures everything remains in sync with the current path

  const enhancer = next => (reducer, initialState, enhancer) => {
    const store = next(reducer, initialState, enhancer);

    if (canUseDOM) {
      store.dispatch(actions.replaceWindowPath(window.location.pathname));

      window.addEventListener('popstate', (event) => {
        const action = window.history.state;

        if (action) {
          if (action.windowPath !== undefined) {
            store.dispatch({ ...action, type: REPLACE_WINDOW_PATH });
          } else if (action.documentTitle !== undefined) {
            store.dispatch({ ...action, type: SET_DOCUMENT_TITLE });
          }
        }
      });
    } else if (initialState.windowPath || initialState.documentTitle) {
      store.dispatch(actions.replaceWindowPath(initialState.windowPath));
    }

    return store;
  };
  ```

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

Additionally, if `window.clientStates` exists and contains a key matching the provider key, its value will be merged into the store's initial state.  This is used when initializing the state of the providers' stores on the client.

### key

Optional string or function.  Defaults to its respective `key` within the `providers` object.  See the [example below](#quick-example) for more about the `providers` object.

  Providers are instantiated based on their `key`:

  - If the `key` is a string, it's considered a static provider and is instantiated immediately at the top level.

  - If the `key` is a function, it's considered a dynamic provider and is instantiated only as needed.  The function should accept some component instance as an argument and should return a string which becomes the provider instance's identifying `key`.  If a provider instance with that `key` already exists, the same instance will be used.

  Example:

  ```js
  providers.user.key = (instance) => {
    const { props } = instance;

    if (props.userId) {
      return `userId=${props.userId}`;
    } else {
      return `user`;
    }
  };
  ```

### replication

Optional object or array of objects.  Uses [`redux-replicate`](https://github.com/loggur/redux-replicate) under the hood.  Each object should contain keys that match the arguments expected by `redux-replicate` - i.e., `{ key, reducerKeys, replicator }`.

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


## Quick example

Let's create a provider that can synchronously and asynchronously increment some count.  We'll control the count with one component and display the current count with another.

```js
// src/providers/counter.js

import thunk from 'redux-thunk';  // for async actions

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

const middleware = thunk; // provider relies on thunk middleware for async

export default { actions, reducers, middleware };
```

Now let's see how easy it is to manipulate the `count` state!  We simply declare `propTypes` for `actions` that we want, and components will receive action creators as `props`.  For example, to dispatch the `INCREMENT` action asynchronously, all we need to do is declare `incrementAsync` within our `propTypes` and eventually call `this.props.incrementAsync()`.

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

1.  The easiest and recommended method is to use this library's `transform` module with [`babel-plugin-react-transform`](https://github.com/gaearon/babel-plugin-react-transform).  It will automatically wrap all of your React classes with the `provide` function.  This allows all of your components to be packaged independently of this library.  There's also a chance that future React versions will support this type of transformation without the need for a plugin, so this is definitely the recommended method!
  
  All you do is add `react-redux-provide/lib/transform` to your Babel config.  It's probably best to make it the first transform.  Also note that the plugin should be applied to all environments, so we put it at the top level.

  ```json
  {
    "presets": [
      "es2015",
      "react",
      "stage-0"
    ],
    "plugins": [
      ["react-transform", {
        "transforms": [{
          "transform": "react-redux-provide/lib/transform"
        }]
      }]
    ],
    "env": {
      "development": {
        "plugins": [
          ["react-transform", {
            "transforms": [{
              "transform": "react-redux-provide/lib/transform"
            }, {
              "transform": "react-transform-hmr",
              "imports": ["react"],
              "locals":  ["module"]
            }]
          }]
        ]
      }
    }
  }
  ```

2.  If you would rather not use the Babel plugin, you can manually wrap each component with the `provide` function.  In this case, your components will look something like this:

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


## Primary exports

### provide

The default export which accepts a React class and returns the class wrapped with a higher-order component designed to share and manage application state via `context`.  Only use this if you aren't using the Babel plugin.

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
    const { key, store } = providerInstance;

    console.log(key, store);
  });
  ```

### pushOnReady|unshiftOnReady (Object providers, Function|Array callback)

Adds function(s) to each provider's array of `onReady` callbacks.  Useful when you want to do something as soon as each provider and its optional replicators are ready, specific to your application.

  ```js
  import { pushOnReady } from 'react-redux-provide';
  import * as providers from './providers/index';

  pushOnReady(providers, providerInstance => {
    const { key, store } = providerInstance;

    console.log(key, store);
  });
  ```

### reloadProviders (Object providers)

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


## Protips

- For most providers, everything might fit within a single file, but you can structure your imports and exports however you want since each provider is ultimately just a single object.

- Providers are composable objects!  You can combine as many providers as you need.  This is great when you have core functionality you would like to implement within multiple providers.

  ```js
  // src/providers/privateResource.js

  import provideResource from 'provide-resource';
  import provideAuthentication from 'provide-authentication';

  const actions = {
    ...provideResource.actions,
    ...provideAuthentication.actions
  };

  const reducers = {
    ...provideResource.reducers,
    ...provideAuthentication.reducers
  };

  const middleware = [
    ...provideResource.middleware,
    ...provideAuthentication.middleware
  ];

  export default { actions, reducers, middleware };
  ```

- Use provider factories to create providers with unique keys for common use cases.  The [`array`](https://github.com/loggur/provide-array) and [`map`](https://github.com/loggur/provide-map) providers are good examples.

  ```js
  // src/providers/todoList.js

  import provideArray from 'provide-array';

  const todoList = provideArray('todoList', 'todoItem', 'todoItemIndex');

  export default todoList;
  ```

- Apps typically only need a `components` directory and a `providers` directory.  A `themes` directory is also recommended!  See [`provide-theme`](https://github.com/loggur/provide-theme).

- Components should have no knowledge of constants used within providers, which leads to a maximum separation of concerns and is always the best design.  Everything (states and action creators) should be obtainable via `props` such that components simply render the application state and create actions.

- The more people who adopt providers, the better!  The provider paradigm makes it insanely easy to integrate each other's services, build apps around specific providers, or even combine multiple apps and/or services into one!

- Check out [`react-devtools`](https://github.com/facebook/react-devtools) for a closer look at what exactly is going on when using providers!

![See `ProvideBranches(theme,packageList,sources)`](https://cloud.githubusercontent.com/assets/7020411/9288123/3587858e-4305-11e5-8156-fe0392e6f7fd.png)


## Tutorial

Throughout this tutorial we'll go over some use cases that you will almost certainly encounter when building any web application.  We'll create a simple app with a handful of components, and we'll use providers to control the application state.  Everything will be tied together prior to rendering the app on the client and/or the server.

Let's build a simple application where users can select different themes and see which theme others have selected.  Each theme's class names will be namespaced to avoid any conflicts with potentially any other CSS on the page, and selecting a theme will load the theme instantly and without losing application state.

We can begin by using a `theme` provider with a `loadTheme` action and a `classes` reducer at a minimum.  We'll also include a `themesFiles` reducer which we'll initialize to contain a map of each theme's js file and css file. Components can then use `propTypes` specific to the `theme` provider - e.g., `classes`, `loadTheme`, etc.

```js
// src/providers/theme

export const LOAD_THEME = 'LOAD_THEME';

const actions = {
  loadTheme(themeName, themeFiles, theme) {
    // let's skip the auto-loading implementation details for now
    return { type: LOAD_THEME, themeName, themeFiles, theme };
  }
};

const reducers = {
  themesFiles(state = {}, action) {
    // let's not worry about state changes here, only initialization
    return state;
  },

  themeFiles(state = null, action) {
    switch (action.type) {
      case LOAD_THEME:
        return action.themeFiles;

      default:
        return state;
    }
  },

  themeName(state = null, action) {
    switch (action.type) {
      case LOAD_THEME:
        return action.themeName;

      default:
        return state;
    }
  },

  classes(state = {}, action) {
    switch (action.type) {
      case LOAD_THEME:
        return action.theme.classes;

      default:
        return state;
    }
  }
};

export default { actions, reducers };
```

Pretty straightforward, right?  Since theming is such a common design pattern, [`provide-theme`](https://github.com/loggur/provide-theme) exists to make it easy.  It is a complete solution using the same actions and reducers above plus some other helpful functionality like hot reloading themes when in development.

Next, let's build our components, starting with the `App`, `Header`, and `ThemeSelector`.

```js
// src/components/App

import React, { Component, PropTypes } from 'react';
import Header from './components/Header';

export default class App extends Component {
  static propTypes = {
    classes: PropTypes.object.isRequired
  };

  render() {
    return (
      <div className={this.props.classes.App}>
        <Header/>
      </div>
    );
  }
}
```

```js
// src/components/Header

import React, { Component, PropTypes } from 'react';
import ThemeSelector from './ThemeSelector';

export default class Header extends Component {
  static propTypes = {
    classes: PropTypes.object.isRequired
  };

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.Header}>
        <span className={classes.Welcome}>
          Welcome!
        </span>

        <ThemeSelector/>
      </div>
    );
  }
}
```

```js
// src/components/ThemeSelector

import React, { Component, PropTypes } from 'react';
import { Form } from 'provide-page';  // for dispatching actions on the server

export default class ThemeSelector extends Component {
  static propTypes = {
    classes: PropTypes.object.isRequired,
    themesFiles: PropTypes.object.isRequired,
    themeName: PropTypes.string.isRequired,
    loadTheme: PropTypes.func.isRequired,
    formId: PropTypes.string
  };

  static defaultProps = {
    formId: 'ThemeSelector'
  };

  loadNextTheme = (event, formData) => {
    const { themesFiles, themeName, loadTheme } = this.props;
    const themeNames = Object.keys(themesFiles);
    const themeIndex = themeNames.indexOf(themeName);
    const nextThemeName = themeNames[themeIndex + 1] || themeNames[0];

    loadTheme(nextThemeName, themesFiles[nextThemeName]);
  };

  render() {
    const { classes, themeName, formId } = this.props;

    return (
      <Form
        formId={formId}
        className={classes.ThemeSelector}
        onSubmit={this.loadNextTheme}
      >
        <button className={classes.ThemeName} type="submit">
          {themeName}
        </button>
      </Form>
    );
  }
}
```

It can't get any more declarative than that!  All we're doing so far is welcoming the user and allowing them to cycle through themes by clicking the currently selected theme name.  In addition, we're using the `Form` component included with [`provide-page`](https://github.com/loggur/provide-page) to allow the `loadTheme` action to be dispatched on both the client and server... or if JavaScript is disabled, the action will still be dispatched on the server and the client will see the new theme after the form is submitted.


Next, let's create a couple of themes.  We can use any format or bundler we want to create our themes, but let's use [CSS Modules](https://github.com/css-modules/css-modules) since we'll also be using [webpack](https://webpack.github.io/) and its [css loaders](https://github.com/css-modules/webpack-demo) are perfect for generating the `classes` object that the [theme provider](https://github.com/loggur/provide-theme) passes to the relevant components.  We simply write some CSS and import it into a JS file, and the bundler will output a CSS file containing namespaced class names along with a JavaScript file containing a mapping of the normal class names to their namespaced equivalents.

So we'll have a dark theme:

```css
/*
 * src/themes/dark/dark.css
 */

.App {
  background: #000;
  color: #fff;
}
.Header {
  width: 100%;
  text-align: left;
}
.Welcome {
  display: inline-block;
  padding: 8px;
}
.ThemeSelector {
  float: right;
}
.ThemeName {
  border: 0;
  padding: 8px;
  background-color: #333;
  color: inherit;
  cursor: pointer;
}
.ThemeName:hover {
  background-color: #444;
}
```
```js
// src/themes/dark/dark.js

import classes from './dark.css';

export default {
  classes
};
```

And a light theme:

```css
/*
 * src/themes/light/light.css
 */

.App {
  background: #fff;
  color: #000;
}
.Header {
  width: 100%;
  text-align: left;
}
.Welcome {
  display: inline-block;
  padding: 8px;
}
.ThemeSelector {
  float: right;
}
.ThemeName {
  border: 0;
  padding: 8px;
  background-color: #ccc;
  color: inherit;
  cursor: pointer;
}
.ThemeName:hover {
  background-color: #bbb;
}
```
```js
// src/themes/light/light.js

import classes from './light.css';

export default {
  classes
};
```


Now let's tie everything together!  It usually works best to start with the following three modules:

- `renderApp.js` - Exports a function which immediately runs on the client and mounts the application to the DOM.  If you're using a bundler like [webpack](https://webpack.github.io), this is the main entry.

  ```js
  // src/renderApp.js

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

- `renderAppToString.js` - Exports a function which renders the application to a string.  We're actually going to use this with [`provide-page`](https://github.com/loggur/provide-page) for server rendering, routing, and dispatching actions on the server.

  ```js
  // src/renderAppToString.js

  import React from 'react';
  import { renderToString } from 'react-dom/server';
  import { App } from './components/index';
  import defaultProps from './defaultProps';

  function renderAppToString(props = defaultProps) {
    return renderToString(<App { ...props } />);
  }

  export default renderAppToString;
  ```

- `defaultProps.js` - Exports the default `props` to be passed to `renderApp` and `renderAppToString`.  These `props` are usually extended per request.

  ```js
  import { user, page, theme } from './providers/index';
  import themesFiles from './themes/files';   // map of theme js and css files

  const min = process.env.MIN_EXT || '';      // '.min' in production
  const themeName = Object.keys(themesFiles).shift(); // default to first theme
  const themeFiles = themesFiles[themeName];

  export default {
    providers: {
      user,

      page: {
        ...page,
        state: {
          documentTitle: `App`,
          metaDescription: `Built with react-redux-provide.`,
          jsFiles: [
            `/dist/App${min}.js`  // the `renderApp` bundle
          ]
        }
      },

      theme: {
        ...theme,
        state: {
          themesFiles,
          themeFiles,
          themeName
        }
      }
    }
  };
  ```


Next, let's create the server.  You can use any server, but we'll use Express.  The [page provider](https://github.com/loggur/provide-page) includes a `createMiddleware` utility function for servers which handles server rendering, routing, dispatching actions, and replicating states to clients.  All you need to do is pass a few properties to it and it handles the rest.

```js
// src/middleware.js

import { createMiddleware } from 'provide-page';
import renderAppToString from './renderAppToString';
import defaultProps from './defaultProps';

// './themes/index' includes every theme, which we'll use only on the server
// and in production, we want to use the minified themes
const min = process.env.MIN_EXT || '';  // '.min' in production
const themes = require(`./themes/index${min}`).default;

const middleware = createMiddleware({
  renderToString: renderAppToString,

  defaultProps: {
    ...defaultProps,
    providers: {
      ...defaultProps.providers,
      themes: {
        ...defaultProps.providers.themes,
        state: {
          ...defaultProps.providers.themes.state,
          themes
        }
      }
    }
  },

  getStates(states) {
    // we'll extend the state of the page's `jsFiles` and `cssFiles`
    // to include the currently selected theme's `jsFile` and `cssFile`
    const { page, theme } = states;
    const { themeFiles } = theme;

    return {
      ...states,

      page: {
        ...page,

        jsFiles: [
          themeFiles.jsFile,
          ...page.jsFiles
        ],

        cssFiles: [
          themeFiles.cssFile,
          ...page.cssFiles
        ]
      }
    }
  },

  getClientStates(states) { // `states` object is `getStates` returned value
    return {
      ...states,

      theme: {
        ...states.theme,    // set the state of the themes reducer to null
        themes: null        // so we don't send all themes to client
      }
    };
  }
});

export default middleware;
```

> For exact usage of the `createMiddleware` function, be sure to check out [`provide-page`](https://github.com/loggur/provide-page).


We won't dive too deeply into setting up the Express server since there are plenty of resources on the web for that.  All we need to do to is use Babel with early stage features (mainly for the spread operator) to transpile the `src` directory (ES6+ code) to a `lib` directory (ES5 code for Node) and put the transpiled middleware at the end of the Express app's middleware chain.  The [page provider](https://github.com/loggur/provide-page)'s middleware expects a `request.body` object, so we'll also need to use a body parser.

```js
// server.production.js

var express = require('express');
var app = new express();
var bodyParser = require('body-parser');
var middleware = require('./lib/middleware').default;
var port = 8080;

app.use('/dist', express.static(__dirname + '/dist'));
app.use('/static', express.static(__dirname + '/static'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(middleware);

app.listen(port, function(error) {
  if (error) {
    console.error(error);
  } else {
    console.info('App running in production mode on port %s.', port);
  }
});
```

Our development server looks similar but includes middleware for hot reloading both serverside code and clientside bundles.  Check [the source for Lumbur's development server](https://github.com/loggur/lumbur/blob/master/server.development.js) for a good example.


And last but not least, we'll use webpack for our clientside bundles.  There are plenty of resources on this throughout the web, so we'll only briefly go over the `entry` and `output` configuration.  Check Lumbur's [development](https://github.com/loggur/lumbur/blob/master/webpack.config.development.js) and [production](https://github.com/loggur/lumbur/blob/master/webpack.config.production.js) configs for full examples.

We'll bundle our application as `App.js` and our themes as `DarkTheme.js` and `LightTheme.js`, and we'll output the bundles to a `dist` directory.  Make note of the connection between this configuration and `/dist/App.js` within `page.state.jsFiles` in `defaultProps.js` above, which is how the page provider knows to include `<script src="/dist/App.js">`.  React components and other providers can actually use the page provider to add and remove any js files and css files.  Perfect for code-splitting and loading scripts only as necessary!

So our production config's `entry` and `output` will look something like this:

  ```js
  // webpack.config.production.js

  module.exports = {
    entry: {
      App: './src/renderApp.js',
      DarkTheme: './src/themes/dark/dark.js',
      LightTheme: './src/themes/light/light.js'
    },
    output: {
      path: path.join(__dirname, 'dist'),
      filename: '[name].min.js',
      chunkFilename: '[id].min.js',
      publicPath: '/dist/'
    }
  }
  ```

And our development config's `entry` and `output` will be slightly different to include hot reloading and unminified source:

  ```js
  // webpack.config.development.js

  module.exports = {
    entry: {
      App: [
        'webpack-hot-middleware/client',
        './src/renderApp.js'
      ],
      DarkTheme: './src/themes/dark/dark.js',
      LightTheme: './src/themes/light/light.js'
    },
    output: {
      path: path.join(__dirname, 'dist'),
      filename: '[name].js',
      chunkFilename: '[id].js',
      publicPath: '/dist/'
    }
  }
  ```

We'll also want to automate the transpilation, bundling, and starting of the server so that all we need to do is run `npm start` or `npm run start:dev` in our console.  We can do that by using `package.json`'s `scripts` property.  For a full example, see Lumbur's [`package.json`](https://github.com/loggur/lumbur/blob/master/package.json).

```json
{
  "scripts": {
    "build:lib": "babel src --out-dir lib",
    "build:umd": "webpack src/index.js --config webpack.config.development.js",
    "build:umd:min": "webpack src/index.js --config webpack.config.production.js",
    "build": "npm run build:lib && npm run build:umd && npm run build:umd:min",
    "clean": "rimraf lib dist coverage",
    "prepublish": "npm run clean && npm run build",
    "start": "npm run build && npm run server",
    "start:dev": "npm run server:dev",
    "server": "better-npm-run server",
    "server:dev": "better-npm-run server:dev"
  },
  "betterScripts": {
    "server": {
      "command": "node server.production.js",
      "env": {
        "NODE_ENV": "production",
        "MIN_EXT": ".min"
      }
    },
    "server:dev": {
      "command": "node server.development.js",
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

Finally, if you run `npm run start:dev` in your console and open the application in your browser (for Lumbur it's [http://localhost:3000](http://localhost:3000)), you should see the application running in development mode, and you should be able to cycle through your themes!


## Replication

Hopefully you've made it this far and now have a firm understanding of how to build an application using React, Redux, and providers.  But we're not done yet!  One of the requirements of this tutorial was that we persist each user's selected theme and allow users to see each other's selected theme.  We can achieve this easily using replication.

Replication is a key concept when building any stateful application.  When implemented correctly, it allows you to decouple data initialization, storage, and retrieval from your application so that your only concern is rendering its state.  It allows you declaratively connect application state to data sources and create efficient, scalable, and reliable software with minimal effort.  If you're unfamiliar with replication, Wikipedia's [State machine replication](https://en.wikipedia.org/wiki/State_machine_replication) page is a good place to start!

Creating replicators for Redux and using them with providers is quite simple!  This library uses [`redux-replicate`](https://github.com/loggur/redux-replicate) under the hood, which is a Redux store enhancer that accepts an identifying `key`, optional array of `reducerKeys`, and a `replicator` (or array of replicators).  Similar to providers, a replicator is a plain object with a few optional properties that describe how the state should be initialized and/or replicated - i.e., stored within a database or sent to other clients via websockets.


## Replicators

Replicators can:

* Initialize the state of the store, synchronously and/or asynchronously.

* Save state changes to data sources.

* Send actions to clients, other servers, etc.

* Be packaged and easily reusable!


A replicator is a plain object of the following shape.

### getKey (Mixed key, String reducerKey)

Optional function to determine the key to be passed to `getInitialState` and `onStateChange`.  Only called when using `reducerKeys`.

Defaults to:

```js
function getKey(key, reducerKey) {
  return `${key}/${reducerKey}`;
}
```

### getInitialState (String key, Function setState)

Optional function to set the store's initial state, synchronously or asynchronously.

If using `reducerKeys`, this function is called once per `reducerKey`.

If not using `reducerKeys`, this function is called only once.

The `setState` function must be called for the store to finish initializing, regardless of whether or not the state exists within the data source.

Example (from [`redux-replicate-localforage`](https://github.com/loggur/redux-replicate-localforage)):

```js
function getInitialState(key, setState) {
  localforage
    .getItem(key)
    .then(state => {
      setState(parse(state));
    }, error => {
      warn(error);
      setState();
    });
}
```

### onReady (String key, Object store)

Optional function called after initialization.

Example:

```js
function onReady(key, store) {
  socket.on('action', ({ key: receivedKey, action }) => {
    if (equal(receivedKey, key)) {
      store.dispatch(action);
    }
  });
}
```

### onStateChange (String key, Mixed state, Mixed nextState, Object action)

Optional function to replicate the state and/or the action upon state changes.  This is called only after initialization.

If using `reducerKeys`, this function is called once per `reducerKey`.

If not using `reducerKeys`, this function is called only once.

Example (from [`redux-replicate-localforage`](https://github.com/loggur/redux-replicate-localforage)):

```js
function onStateChange(key, state, nextState, action) {
  localforage
    .setItem(key, stringify(nextState))
    .catch(warn);
}
```

### postReduction (String key, Mixed state, Mixed nextState, Object action)

Optional function to replicate the state and/or the action upon any reduction, regardless of whether or not the store's state has changed.  This is called only after initialization.  If you want to replicate actions, this is the place to do it.

This function is only called once per reduction, as the `key` passed to this function is not combined with any `reducerKey`.  A quick `state !== nextState` check here would let you know if any change has taken place, regardless of whether or not you're using `reducerKeys`.

Example:

```js
function postReduction(key, state, nextState, action) {
  if (state !== nextState) {
    socket.emit('action', { key, action });
  }
}
```

