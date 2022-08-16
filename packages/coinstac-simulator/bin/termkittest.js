
const TerminalKit = require('terminal-kit');

const colorA = Math.floor(Math.random() * 255);
const colorB = Math.floor(Math.random() * 255);

(async () => {
  const term = TerminalKit.terminal;
  term('starting');

  const mainScreenBuffer = new TerminalKit.ScreenBuffer({
    dst: term,
  });
  const leftScreenBuffer = new TerminalKit.ScreenBuffer({
    dst: mainScreenBuffer,
    width: Math.floor(mainScreenBuffer.width / 2) - 1,
  });
  const rightScreenBuffer = new TerminalKit.ScreenBuffer({
    dst: mainScreenBuffer,
    width: Math.floor(mainScreenBuffer.width / 2),
    x: mainScreenBuffer.width / 2,
  });

  const rightScreen = { text: 'starting' };

  function draw() {
    leftScreenBuffer.clear();
    leftScreenBuffer.fill({ attr: { bgColor: colorA } });
    leftScreenBuffer.put({ x: 0 }, Math.random());
    leftScreenBuffer.draw();

    rightScreenBuffer.clear();
    rightScreenBuffer.fill({ attr: { bgColor: colorB } });
    rightScreenBuffer.put({ x: 0 }, rightScreen.text);
    rightScreenBuffer.draw();

    mainScreenBuffer.draw();
  }

  const eventHandler = (name) => {
    console.log('here');
    if (name === 'CTRL_C') {
      process.exit();
    }
  };

  mainScreenBuffer.on('resize', eventHandler);
  mainScreenBuffer.on('terminal', eventHandler);
  mainScreenBuffer.on('mouse', eventHandler);

  leftScreenBuffer.on('resize', eventHandler);
  leftScreenBuffer.on('terminal', eventHandler);
  leftScreenBuffer.on('mouse', eventHandler);

  rightScreenBuffer.on('resize', eventHandler);
  rightScreenBuffer.on('terminal', eventHandler);
  rightScreenBuffer.on('mouse', eventHandler);

  term.on('resize', eventHandler);
  term.on('terminal', eventHandler);
  term.on('mouse', eventHandler);

  draw();
  setInterval(() => {
    // draw();
    if (false) {
      process.exit();
    }
  }, 1000);
})();
