import reducer, {
  consortiaSorter,
  DO_DELETE_CONSORTIA,
  DO_UPDATE_CONSORTIA,
} from '../../../../app/render/state/ducks/consortia';
import tape from 'tape';

tape('consortia reducer', t => {
  const consortium1 = {
    _id: 'wat',
    label: 'waaat',
  };
  const consortium2 = {
    _id: 'such-id',
    label: 'very label',
  };
  const consortium3 = {
    _id: 'doge',
    label: 'wow',
  };
  const consortium4 = {
    _id: 'ceiling',
    label: 'cat',
  };
  const initialState = [consortium1, consortium2, consortium3];

  t.equal(
    reducer(initialState, {}),
    initialState,
    'returns initial state as default'
  );

  t.deepEqual(
    reducer(
      initialState,
      {
        consortia: [{
          _id: consortium1._id,
        }, {
          _id: consortium3._id,
        }],
        type: DO_DELETE_CONSORTIA,
      }
    ),
    [consortium2],
    'deletes consortia'
  );

  t.deepEqual(
    reducer(
      initialState,
      {
        consortia: [
          {
            _id: consortium2._id,
            label: 'whodat',
          },
          consortium4,
        ],
        type: DO_UPDATE_CONSORTIA,
      }
    ),
    [
      consortium1,
      {
        _id: consortium2._id,
        label: 'whodat',
      },
      consortium3,
      consortium4,
    ].sort(consortiaSorter),
    'updates consortia'
  );

  t.end();
});

