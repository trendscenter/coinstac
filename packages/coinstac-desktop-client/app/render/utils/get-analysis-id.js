import sha1 from 'sha-1';

/**
 * Get an analysis's ID from its files' shas.
 *
 * @param  {array}  fileShas
 * @return {string}
 */
export default function getAnalysisId(fileShas) {
  return sha1(fileShas.sort().join(''));
}
