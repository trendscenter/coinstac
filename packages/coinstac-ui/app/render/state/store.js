/**
 * Store configuration.
 *
 * This configures the Redux store by adding middleware. See Redux's
 * 'Real World' example:
 *
 * @{@link  https://github.com/rackt/redux/blob/master/examples/real-world/store/configureStore.js}
 *
 * Uses ApolloClient as outlined: https://medium.com/react-weekly/implementing-graphql-in-your-redux-app-dad7acf39e1b
 */
import { applyMiddleware, createStore } from 'redux';
import { createLogger } from 'redux-logger';
import promiseMiddleware from 'redux-promise';
import thunkMiddleware from 'redux-thunk';

import rootReducer from './root-reducer';

export default function (apolloClient) {
  const store = createStore(
    rootReducer(apolloClient),
    applyMiddleware(
      apolloClient.middleware(),
      thunkMiddleware,
      promiseMiddleware,
      createLogger({ collapsed: true })
    )
  );

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('./root-reducer', () => {
      /* eslint-disable global-require */
      const nextRootReducer = require('./root-reducer').default;
      /* eslint-enable global-require */
      store.replaceReducer(nextRootReducer);
    });
  }

  return store;
}
