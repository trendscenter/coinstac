export default function (state) {
  switch (state) {
    case undefined:
    case 'pristine':
      return 'default';
    case 'invalid':
      return 'error';
    case 'valid':
      return 'success';
    default:
      throw new ReferenceError([
        'unable to map `',
        state,
        '` to bootstrap class',
      ].join(' '));
  }
}
