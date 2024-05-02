import ResponsiveScene from './responsive';
import {getObject, setObject} from 'shared/services/localStorage';

export default class SetupScene extends ResponsiveScene {
  gamepadId = null;
  pad = null;
  blueButtonIndex = null;
  redButtonIndex = null;
  greenButtonIndex = null;
  greenButtonMin = 0.1;
  redButtonMin = 0.1;
  blueButtonMin = 0.1;
  greenButtonMax = 0;
  redButtonMax = 0;
  blueButtonMax = 0;
  greenButtonThreshold = 0;
  redButtonThreshold = 0;
  blueButtonThreshold = 0;
  blueMaxIndicator;
  redMaxIndicator;
  greenMaxIndicator;
  blueIndicator;
  greenIndicator;
  pedalStats = {};
  pedalsText;
  timeGreen;
  timeRed;
  timeBlue;

  buttons = {
    gas: null,
    brake: null,
    wheel: null,
  };
  step = 1;

  constructor () {
    super({key: 'setup-2'});
  }
      
  create() {
    super.create();

    const pedals = getObject('pedals');
    if (!pedals?.gamepadId) {
      const mainMenu = this.scene.get('main-menu');
      mainMenu.scene.restart();
      this.scene.start('main-menu');
    }

    for (let i = 0; i < this.input.gamepad.total; i++) {
      const pad = this.input.gamepad.getPad(i);

      if (pad.id === pedals.gamepadId) {
        this.pad = pad;
        break;
      }
    }

    this.gamepadId = this.add.rexBBCodeText(
      ...this.fit(600, 1100),
      pedals.gamepadId, {
        fontSize: 16,
        fill: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);
    this.pedalsText = this.add.rexBBCodeText(
      ...this.fit(600, 100),
      '', {
        fontSize: 24,
        fill: '#ffffff',
        backgroundColor: '#404000',
        padding: 5,
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
  
    const [xBlue, yBlue] = this.fit(200, 400);
    const [xRed, yRed] = this.fit(800, 400);
    const [xGreen, yGreen] = this.fit(1000, 400);

    this.blueMaxIndicator = this.add.ellipse(xBlue, yBlue, 100, 100)
      .setStrokeStyle(3, 0x0000ff)
      .setScale(0);
    this.redMaxIndicator = this.add.ellipse(xRed, yRed, 100, 100)
      .setStrokeStyle(3, 0xff0000)
      .setScale(0);
    this.greenMaxIndicator = this.add.ellipse(xGreen, yGreen, 100, 100)
      .setStrokeStyle(3, 0x00ff00)
      .setScale(0);
    this.blueIndicator = this.add.ellipse(xBlue, yBlue, 100, 100, 0x000080)
      .setScale(0);
    this.redIndicator = this.add.ellipse(xRed, yRed, 100, 100, 0x800000)
      .setScale(0);
    this.greenIndicator = this.add.ellipse(xGreen, yGreen, 100, 100, 0x008000)
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
      case 17:
      case 99:
      case 101: {
        this.setPrompt('Please [b]release all[/b] pedals');

        const pressed = this.detectGamepadPressed();
        if (!pressed) {
          this.step += 1;
        }
        break;
      }

      case 2: {
        this.setPrompt('Please [b]press GAS[/b] pedal');
      
        const pressed = this.detectGamepadPressed();
        if (pressed) {
          this.buttons.gas = pressed;
          this.timeGreen = Date.now();
          this.step++;
        }
      } break;

      case 3: {
        this.setPrompt('Please [b]release GAS[/b] pedal');

        const {gas} = this.getPedals();
        const minValue = this.buttons.gas.minValue ??
          this.buttons.gas.threshold;
        if (gas < minValue) {
          this.buttons.gas.minValue = gas;
          this.timeGreen = Date.now();
        } else if (gas === minValue && Date.now() - this.timeGreen > 1000) {
          this.greenButtonThreshold = minValue +
            this.buttons.gas.threshold;
          this.step++;
        }
      } break;

      case 5: {
        this.setPrompt('Please [b]press BRAKE[/b] pedal');

        const pressed = this.detectGamepadPressed();
        if (pressed) {
          this.buttons.brake = pressed;
          this.timeRed = Date.now();
          this.step++;
        }
      } break;

      case 6: {
        this.setPrompt('Please [b]release BRAKE[/b] pedal');

        const {brake} = this.getPedals();
        const minValue = this.buttons.brake.minValue ??
          this.buttons.brake.threshold;
        if (brake < minValue) {
          this.buttons.brake.minValue = brake;
          this.timeRed = Date.now();
        } else if (brake === minValue && Date.now() - this.timeRed > 1000) {
          this.redButtonThreshold = minValue +
            this.buttons.brake.threshold;
          this.step++;
        }
      } break;
  
      case 8: {
        this.setPrompt('Please press both [b]GAS and BRAKE[/b] pedals');

        const {gas, brake} = this.getPedals();
        if (brake > this.redButtonThreshold &&
          gas > this.greenButtonThreshold) {
          this.step++; // release all
        }
      } break;

      case 10: {
        this
          .setPrompt('Please press [b]GAS[/b] pedal to the [b]END[/b]' +
            (this.greenButtonMax > this.greenButtonThreshold ? ', then release' : ''));

        const {gas} = this.getPedals();
        if (gas <= this.greenButtonThreshold && this.greenButtonMax) {
          this.step ++; // release all
        } else if (gas > this.greenButtonThreshold) {
          this.greenButtonMax = Math.max(gas, this.greenButtonMax);
          this.greenMaxIndicator
            .setScale(this.greenButtonMax);
        }
        break;
      }

      case 12: {
        this
          .setPrompt('Please press [b]BRAKE[/b] pedal to the [b]END[/b]' +
            (this.redButtonMax > 0.5 ? ', then release' : ''));

        const {brake} = this.getPedals();
        if (brake <= this.redButtonThreshold && this.redButtonMax) {
          this.step++; // release all
        } else if (brake > this.redButtonThreshold) {
          this.redButtonMax = Math.max(brake, this.redButtonMax);
          this.redMaxIndicator
            .setScale(this.redButtonMax);
        }
        break;
      }

      case 14: {
        this.setPrompt('Please turn [b]WHEEL[/b] left or right\n(skip with [b]BRAKE[/b] for menu)');

        this.blueButtonIndex = this.getAxisOrButtonIndex();
        if (this.blueButtonIndex) {
          this.step = 15;
        }

        const {red} = this.getPedals();
        if (red > this.redButtonThreshold) {
          this.step = 99;
        }
  
        break;
      }

      case 15: {
        this.setPrompt('Please [b]press WHEEL[/b] pedal');
  
        const {blue} = this.getPedals();
        if (blue <= this.blueButtonThreshold) {
          this.timeBlue = Date.now();
          this.step = 16; // release all
        }
        break;
      }

      case 16: {
        this.setPrompt('Please [b]release WHEEL[/b] pedal');

        const {blue} = this.getPedals();
        if (blue < this.blueButtonMin) {
          this.blueButtonMin = blue;
          this.timeBlue = Date.now();
        } else if (Date.now() - this.timeBlue > 2000) {
          this.blueButtonThreshold = this.blueButtonMin + this.getThreshold(this.blueButtonIndex);
          this.step = 17; // release all
        }
        break;
      }

      case 18: {
        this
          .setPrompt('Please press [b]WHEEL[/b] pedal to the [b]END[/b]' +
            (this.blueButtonMax > this.blueButtonThreshold ? ', then release' : ''));

        const {blue} = this.getPedals();
        if (blue <= 0 && this.blueButtonMax) {
          this.step = 99;
        } else if (blue > 0.5) {
          this.blueButtonMax = Math.max(blue, this.blueButtonMax);
          this.blueMaxIndicator
            .setScale(this.blueButtonMax);
        }
        break;
      }

      case 100:
        this.setPrompt('You\'re all set\nPress any pedal for main menu');

        const {green, red, blue} = this.getPedals();
        if (green > this.greenButtonThreshold
          || red > this.redButtonThreshold
          || blue > this.blueButtonThreshold) {
          setObject('pedals', {
            gamepadId: this.pad.id,
            green: {
              index: this.greenButtonIndex,
              min: this.greenButtonMin,
              max: this.greenButtonMax,
              threshold: this.greenButtonThreshold,
            },
            red: {
              index: this.redButtonIndex,
              min: this.redButtonMin,
              max: this.redButtonMax,
              threshold: this.redButtonThreshold,
            },
            blue: {
              index: this.blueButtonIndex,
              min: this.blueButtonMin,
              max: this.blueButtonMax,
              threshold: this.blueButtonThreshold,
            }
          });
          this.step = 101;
        }
        break;

      case 102:
        const mainMenu = this.scene.get('main-menu');
        mainMenu.scene.restart();
        this.scene.start('main-menu');
        break;
    }
  }

  get pads() {
    const result = [];

    for (let i = 0; i < this.input.gamepad.total; i++) {
      result.push(this.input.gamepad.getPad(i));
    }

    return result;
  }

  collectPedalStats() {
    for (let i = 0; i < this.input.gamepad.total; i++) {
      const pad = this.input.gamepad.getPad(i);
      for (const axis of pad.axes) {
        if (axis.value !== 0) {
          const id = `${pad.id}-${axis.index}`;

          if (!(id in this.pedalStats)) {
            this.pedalStats[id] = {min:1000, max:-1000};
          }
          const stats = this.pedalStats[id];
          stats.min = Math.min(stats.min, axis.value);
          stats.max = Math.max(stats.max, axis.value);
        }
      }
    }
  }

  detectGamepadPressed() {
    for (const pad of this.pads) {
      for (const button of pad.buttons) {
        if (button.value >= button.threshold && button.value <= 1) {
          return {
            type: 'button',
            padId: pad.id,
            index: button.index,
            threshold: button.threshold,
          };
        }
      }
      for (const axis of pad.axes) {
        if (axis.value >= axis.threshold && axis.value <= 1) {
          return {
            type: 'axis',
            padId: pad.id,
            index: axis.index,
            threshold: axis.threshold,
          };
        }
      }
    }

    return null;
  }

  updateGamepadId() {
    this.gamepadId.setText(`[color=#888]Game Controller:\n[/color]${this.pad.id}`);
  }

  getValue(key) {
    if (key === null) {
      return 0;
    }
    const {type, padId, index} = key;

    const pad = this.pads.find(pad => pad.id === padId);
    return type === 'axis'
      ? pad?.axes[index].value ?? 0
      : pad?.buttons[index].value ?? 0;
  }

  update() {
    super.update();
    
    this.updatePrompt();
    this.updatePedals();
  }

  getPedals() {
    return {
      gas: this.getValue(this.buttons.gas),
      brake: this.getValue(this.buttons.brake),
      wheel: this.getValue(this.buttons.wheel),
    };
  }

  updatePedals() {
    const {gas, brake, wheel} = this.getPedals();

    this.greenIndicator
      .setScale(gas);
    this.redIndicator
      .setScale(brake);
    this.blueIndicator
      .setScale(wheel);

    this.pedalsText.setText(`[b][color=green]${
      gas.toFixed(2)}[/color] [color=red]${
      brake.toFixed(2)}[/color] [color=blue]${
      wheel.toFixed(2)}[/color][/b]`);
  }

  handleGamepadConnected(pad) {
    console.debug('Connected', pad);
  }

  handleGamepadDisconnected(pad) {
    console.debug('Disconnected', pad);
  }
}
