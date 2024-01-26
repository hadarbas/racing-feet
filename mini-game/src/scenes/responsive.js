import Phaser from 'phaser';

export default class ResponsiveScene extends Phaser.Scene {
  baseWidth = 1200;
  baseHeight = 1200;
  escKey;
  prompt;

  preload() {
    this.load.plugin(
      'rexbbcodetextplugin',
      'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexbbcodetextplugin.min.js',
      true
    );
  }

  create () {
    this.escKey = this.input.keyboard.addKey('ESC');
    this.prompt = this.add.rexBBCodeText(
      ...this.fit(600, 900),
      '', {
        fontSize: 24,
        fill: '#ffffff',
        backgroundColor: '#000040',
        padding: 20,
        align: 'center',
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setScrollFactor(0);
  }

  update () {
    if (this.escKey.isDown) {
      this.scene.start('main-menu');
    }
  }

  fit (x1, y1, x2, y2) {
    const {width, height} = this.sys.game.config;
    const scaleX = x => x * width / this.baseWidth;
    const scaleY = y => y * height / this.baseHeight;

    return x2 !== undefined
      ? [scaleX(x1), scaleY(y1), scaleX(x2), scaleY(y2)]
      : [scaleX(x1), scaleY(y1)];
  }

  get width() {
    return this.sys.game.config.width;
  }

  get height() {
    return this.sys.game.config.height;
  }

  colors = ['GREEN', 'RED', 'BLUE'];
  pedalColors = {
    gas: 'GREEN',
    brake: 'RED',
    clutch: 'BLUE',
  };
  textWithColors(text) {
    return this.colors
      .reduce((t, color) => t
        .replace(`${color}`, `[color=${color.toLowerCase()}]${color}[/color]`)
      , text);
  }

  setPrompt(text = '') {
    this.prompt
      ?.setText(this.textWithColors(text))
      ?.setVisible(!!text);
  }

}
