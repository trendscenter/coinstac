/**
 * Store configuration.
 *
 * This configures the Redux store by adding middleware. See Redux's
 * 'Real World' example:
 *
 * @{@link  https://github.com/rackt/redux/blob/master/examples/real-world/store/configureStore.js}
 */
import { applyMiddleware, createStore } from 'redux';
import { persistStore } from 'redux-persist';
import promiseMiddleware from 'redux-promise';
import thunkMiddleware from 'redux-thunk';

import { init as initPersistStateReducer } from './ducks/statePersist';
import rootReducer from './root-reducer';

export default function configureStore() {
  const middleware = [
    thunkMiddleware,
    promiseMiddleware,
  ];
  const store = createStore(
    rootReducer,
    applyMiddleware.apply(
      this,
      middleware,
    ),
  );

  const persistor = persistStore(store, { manualPersist: true });

  initPersistStateReducer(persistor);

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
