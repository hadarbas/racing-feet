import Phaser from 'phaser';

export default class RecorderScene extends Phaser.Scene {
  gamepadId = null
  pad = null
  blueButtonIndex = null
  redButtonIndex = null
  greenButtonIndex = null
  blueButtonMax = 0
  redButtonMax = 0
  greenButtonMax = 0
  blueMaxIndicator = null
  redMaxIndicator = null
  greenMaxIndicator = null
  blueIndicator = null
  redIndicator = null
  greenIndicator = null

  prompt = null
  step = 1

  constructor () {
    super();
  }

  preload() {
    /*      
    //  This is an example of a bundled image:
    this.load.image('logo', logoImg);

    //  This is an example of loading a static image from the public folder:
    this.load.image('background', 'assets/bg.jpg');
    */
    this.load.plugin(
      'rexbbcodetextplugin',
      'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexbbcodetextplugin.min.js',
      true
    );
  }
      
  create() {
    this.prompt = this.add.rexBBCodeText(
      400, 400,
      '', {
        fontSize: 24,
        fill: '#ffffff',
        backgroundColor: '#000040',
        padding: 20,
        align: 'center',
      })
      .setOrigin(0.5);

    const xBlue = 100;
    const xRed = 500;
    const xGreen = 700;

    this.blueMaxIndicator = this.add.ellipse(xBlue, 200, 100, 100)
      .setStrokeStyle(3, 0x0000ff)
      .setScale(0);
    this.redMaxIndicator = this.add.ellipse(xRed, 200, 100, 100)
      .setStrokeStyle(3, 0xff0000)
      .setScale(0);
    this.greenMaxIndicator = this.add.ellipse(xGreen, 200, 100, 100)
      .setStrokeStyle(3, 0x00ff00)
      .setScale(0);
    this.blueIndicator = this.add.ellipse(xBlue, 200, 100, 100, 0x000080)
      .setScale(0);
    this.redIndicator = this.add.ellipse(xRed, 200, 100, 100, 0x800000)
      .setScale(0);
    this.greenIndicator = this.add.ellipse(xGreen, 200, 100, 100, 0x008000)
      .setScale(0);
  }

  updatePrompt() {
    switch (this.step) {
      case 1:
      case 4: 
      case 7:
      case 9:
      case 11:
      case 13:
      case 16: {
        this.setPrompt('Please [b]release all[/b] pedals');

        const {blue, red, green} = this.getPedals();
        if (!blue && !green && !red) {
          this.step += 1;
        }
        break;
      }

      case 2:
        this.setPrompt('Please [b]press GREEN[/b] pedal');
      
        this.greenButtonIndex = this.getAxisOrButtonIndex();
        if (this.greenButtonIndex) {
          this.step = 3;
        }
        break;

      case 3: {
        this.setPrompt('Please [b]release GREEN[/b] pedal');

        const {green} = this.getPedals();
        if (!green) {
          this.step = 4; // release all
        }
        break;
      }

      case 5:
        this.setPrompt('Please [b]press RED[/b] pedal');

        this.redButtonIndex = this.getAxisOrButtonIndex();
        if (this.redButtonIndex) {
          this.step = 7;
        }
        break;

      case 6: {
        this.setPrompt('Please [b]release RED[/b] pedal');
  
          const {red} = this.getPedals();
          if (!red) {
            this.step = 7; // release all
          }
          break;
        }

      case 8: {
        this.setPrompt('Please press both [b]GREEN and RED[/b] pedals');

        const {red, green} = this.getPedals();
        if (red && green) {
          this.step = 9; // release all
        }
        break;
      }

      case 10: {
        this
          .setPrompt('Please press [b]GREEN[/b] pedal to the [b]END[/b]' +
            (this.greenButtonMax > 0.5 ? ', then release' : ''));

        const {green} = this.getPedals();
        if (!green && this.greenButtonMax) {
          this.step = 11; // release all
        } else if (green) {
          this.greenButtonMax = Math.max(green, this.greenButtonMax);
          this.greenMaxIndicator
            .setScale(this.greenButtonMax);
        }
        break;
      }

      case 12: {
        this
          .setPrompt('Please press [b]RED[/b] pedal to the [b]END[/b]' +
            (this.redButtonMax > 0.5 ? ', then release' : ''));

        const {red} = this.getPedals();
        if (!red && this.redButtonMax) {
          this.step = 13; // release all
        } else if (red) {
          this.redButtonMax = Math.max(red, this.redButtonMax);
          this.redMaxIndicator
            .setScale(this.redButtonMax);
        }
        break;
      }

      case 14: {
        this.setPrompt('Please press BLUE pedal\nor RED for menu');

        this.blueButtonIndex = this.getAxisOrButtonIndex();
        if (this.blueButtonIndex) {
          this.step = 15;
        }

        const {red} = this.getPedals();
        if (red) {
          this.step = 99;
        }
  
        break;
      }

      case 15: {
        this.setPrompt('Please [b]release BLUE[/b] pedal');
  
          const {blue} = this.getPedals();
          if (!blue) {
            this.step = 16; // release all
          }
          break;
      }

      case 17: {
        this
          .setPrompt('Please press [b]BLUE[/b] pedal to the [b]END[/b]' +
            (this.blueButtonMax > 0.5 ? ', then release' : ''));

        const {blue} = this.getPedals();
        if (!blue && this.blueButtonMax) {
          this.step = 99;
        } else if (blue) {
          this.blueButtonMax = Math.max(blue, this.blueButtonMax);
          this.blueMaxIndicator
            .setScale(this.blueButtonMax);
        }
        break;
      }

      case 99:
        this.setPrompt('MAIN MENU\n(placeholder)');
        break;
    }
  }

  getAxisOrButtonIndex() {
    let result = null;

    for (let i = 0; i < this.input.gamepad.total; i++) {
      const pad = this.input.gamepad.getPad(i);

      if (this.gamepadId && pad.id !== this.gamepadId) {
        continue;
      }

      for (const button of pad.buttons) {
        if (button.value == 0 || button.value >= 1) {
          continue;
        }
        if (result) {
          return null;
        }
        const index = button.index
        if (this.redButtonIndex === index) {
          continue;
        }
        if (this.greenButtonIndex === index) {
          continue;
        }

        this.pad = pad;
        result = index;
      }

      for (const axis of pad.axes) {
        if (axis.value < axis.threshold) {
          continue;
        }
        if (result) {
          return null;
        }

        const index = 1000 + axis.index;
        if (this.redButtonIndex === index) {
          continue;
        }
        if (this.greenButtonIndex === index) {
          continue;
        }

        this.pad = pad;
        result = index;
      }
    }

    return result;
  }

  getValue(index) {
    return index === null
      ? 0
      : index >= 1000
        ? Math.max(0, this.pad.axes[index - 1000].value - this.pad.axes[index - 1000].threshold)
        : this.pad.buttons[index].value
  }

  colors = ['RED', 'GREEN', 'BLUE'];
  textWithColors(text) {
    return this.colors
      .reduce((t, color) => t
        .replace(`${color}`, `[color=${color.toLowerCase()}]${color}[/color]`)
      , text);
  }

  setPrompt(text) {
    this.prompt.setText(this.textWithColors(text));
  }

  update() {
    this.updatePrompt();
    this.updatePedals();
  }

  getPedals() {
    return {
      blue: this.getValue(this.blueButtonIndex),
      red: this.getValue(this.redButtonIndex),
      green: this.getValue(this.greenButtonIndex),
    };
  }

  updatePedals() {
    const {red, green, blue} = this.getPedals();

    this.blueIndicator
      .setScale(blue);
    this.redIndicator
      .setScale(red);
    this.greenIndicator
      .setScale(green);
  }

  handleGamepadConnected(pad) {
    console.debug('Connected', pad);
  }

  handleGamepadDisconnected(pad) {
    console.debug('Disconnected', pad);
  }
}
