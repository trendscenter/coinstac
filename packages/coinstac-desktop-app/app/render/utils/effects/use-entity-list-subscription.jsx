import { useEffect } from 'react';

function useEntityListSubscription(
  subscriptionFunc,
  document,
  query,
  subscriptionName,
  variables,
  refetchFunc
) {
  useEffect(() => {
    const unsubscribe = subscriptionFunc({
      document,
      variables,
      updateQuery: (prev, { subscriptionData: { data } }) => {
        if (!data) return prev;

        const prevData = prev[query];
        const docFromSub = data[subscriptionName];

        if (data[subscriptionName].delete) {
          return {
            [query]: prevData.filter(doc => doc.id !== docFromSub.id),
          };
        }

        const isNew = prevData.findIndex(doc => doc.id === docFromSub.id) === -1;

        if (isNew) {
          return {
            [query]: [...prevData, docFromSub],
          };
        }

        if (refetchFunc) {
          refetchFunc();
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);
}

export default useEntityListSubscription;
