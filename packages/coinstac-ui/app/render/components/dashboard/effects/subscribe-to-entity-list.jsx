import { useEffect } from 'react';

function SubscribeToEntityList(subscriptionFunc, document, query, subscriptionName) {
  useEffect(() => {
    const unsubscribe = subscriptionFunc({
      document,
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

export default SubscribeToEntityList;
