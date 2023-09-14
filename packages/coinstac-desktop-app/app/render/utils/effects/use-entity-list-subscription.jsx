import { useEffect } from 'react';

function useEntityListSubscription(
  subscriptionFunc,
  document,
  query,
  subscriptionName,
  variables
) {
  useEffect(() => {
    const unsubscribe = subscriptionFunc({
      document,
      variables,
      updateQuery: (prev, { subscriptionData: { data } }) => {
        if (!data) return prev;

        if (data[subscriptionName].delete) {
          return {
            [query]: prev[query].filter(o => o.id !== data[subscriptionName].id),
          };
        }

        const index = prev[query].findIndex(c => c.id === data[subscriptionName].id);
        if (index === -1) {
          return {
            [query]: [...prev[query], data[subscriptionName]],
          };
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);
}

export default useEntityListSubscription;
