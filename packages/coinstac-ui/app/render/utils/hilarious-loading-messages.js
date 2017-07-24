export default {
  messages: [
    'Sit tight, big cat!  We\'ll be right back with your data...',
    'It\'s a bird, it\'s a plane, ...it\'s all your data comin\' in hot',
    'Data-fett... data-fett... where? - Dr. Han Solo',
    'Data be nimble, data be quick, data jumped over a processing stick',
    'I see your data is as big as mine!',
    'Data-weiss, data-weiss, every morning, you greet me',
  ],
  random() {
    const ndx = Math.floor(Math.random() * this.messages.length);
    return this.messages[ndx];
  },
};
