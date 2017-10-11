export const computationsProp = {
  props: ({ data: { loading, fetchAllComputations } }) => ({
    loading,
    computations: fetchAllComputations,
  }),
};

export const consortiaProp = {
  props: ({ data: { fetchAllConsortia } }) => ({
    consortia: fetchAllConsortia,
  }),
};
