import ResponsiveScene from './responsive';
import {setObject} from 'shared/services/localStorage';

export default class SetupScene extends ResponsiveScene {
  gamepadId;
  pad;
  blueButtonIndex;
  redButtonIndex;
  greenButtonIndex;
  greenButtonMin;
  redButtonMin;
  greenButtonMax;
  redButtonMax;
  greenButtonThreshold;
  redButtonThreshold;
  blueButtonThreshold;
  blueMaxIndicator;
  redMaxIndicator;
  greenMaxIndicator;
  blueIndicator;
  greenIndicator;
  pedalStats;
  pedalsText;
  timeGreen;
  timeRed;
  timeBlue;
  buttons;
  step;

  constructor () {
    super({key: 'setup'});
  }

  init() {
    this.gamepadId = null;
    this.pad = null;
    this.blueButtonIndex = null;
    this.redButtonIndex = null;
    this.greenButtonIndex = null;
    this.greenButtonMin = null;
    this.redButtonMin = null;
    this.greenButtonMax = 0;
    this.redButtonMax = 0;
    this.greenButtonThreshold = 0;
    this.redButtonThreshold = 0;
    this.blueButtonThreshold = 0;
    this.blueMaxIndicator;
    this.redMaxIndicator;
    this.greenMaxIndicator;
    this.blueIndicator;
    this.greenIndicator;
    this.pedalStats = {};
    this.buttons = {
      gas: null,
      brake: null,
      wheel: null,
    };
    this.step = 1;
  }

  create() {
    super.create();

    this.gamepadId = this.add.rexBBCodeText(
      ...this.fit(600, 1100),
      '?', {
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

  updateState() {
    switch (this.step) {
      case 1:
      case 4:
      case 7:
      case 9:
      case 11:
      case 13:
      case 15:
      case 17:
      case 19:
      case 21:
      case 99:
      case 101: {
        this.setPrompt('Please [b]release all[/b] pedals');
        const pressed = this.detectGamepadPressed();
        // Sada je pressed niz. Prazan je ako nema ničeg "aktivnog"
        if (pressed.length === 0) {
          if (this.greenButtonMin !== null && this.buttons.gas) {
            this.greenButtonMin = Math.min(
              this.getValue(this.buttons.gas),
              this.greenButtonMin
            );
          } else {
            this.greenButtonMin = this.getValue(this.buttons.gas);
          }

          if (this.redButtonMin !== null && this.buttons.brake) {
            this.redButtonMin = Math.min(
              this.getValue(this.buttons.brake),
              this.redButtonMin
            );
          } else {
            this.redButtonMin = this.getValue(this.buttons.brake);
          }

          this.step += 1;
        } else {
          // Ako ima pritisnutih inputa, samo ispišemo  i čekamo
          // console.log(pressed);
        }
        break;
      }

      case 2: {
        this.setPrompt('Please [b]press GAS[/b] pedal');

        const pressed = this.detectGamepadPressed();
        if (pressed.length > 0) {
          // Uzmemo prvi input iz niza
          this.buttons.gas = pressed[0];
          this.timeGreen = Date.now();
          this.step++;
        }
      }
      break;

      case 3: {
        this.setPrompt('Please [b]release GAS[/b] pedal and wait 1 second');

        const {gas} = this.getPedals();
        const minValue = isNaN(this.buttons.gas.minValue)
          ? this.buttons.gas.threshold
          : this.buttons.gas.minValue;

        if (gas < minValue) {
          this.buttons.gas.minValue = Math.min(gas, minValue);
          this.timeGreen = Date.now();
        } else if (gas === minValue && Date.now() - this.timeGreen > 1000) {
          this.step++;
        } else if (gas > minValue){
          this.buttons.gas.minValue = undefined;
        }
      }
      break;

      case 5: {
        this.setPrompt('Please [b]press BRAKE[/b] pedal');

        const pressed = this.detectGamepadPressed();
        if (pressed.length > 0) {
          this.buttons.brake = pressed[0];
          this.timeRed = Date.now();
          this.step++;
        }
      }
      break;

      case 6: {
        this.setPrompt('Please [b]release BRAKE[/b] pedal and wait 1 second');

        const {brake} = this.getPedals();
        const minValue = this.buttons.brake.minValue ??
          this.buttons.brake.threshold;

        if (brake < minValue) {
          this.buttons.brake.minValue = brake;
          this.timeRed = Date.now();
        } else if (brake > minValue){
          this.buttons.brake.minValue = undefined;
        }
        if (brake === minValue && Date.now() - this.timeRed > 1000) {
          this.redButtonThreshold = Math.min(1, minValue +
            this.buttons.brake.threshold);
          this.step++;
        }
      }
      break;

      case 8: {
        this.setPrompt('Please press both [b]GAS and BRAKE[/b] pedals');

        const {gas, brake} = this.getPedals();
        if (brake >= this.redButtonThreshold &&
          gas >= this.greenButtonThreshold) {
          this.step++; // release all
        }
      }
      break;

      case 10: {
        this.setPrompt(
          'Please press [b]GAS[/b] pedal to the [b]THRESHOLD[/b],\n' +
          'then release and wait 1 second'
        );

        const {gas} = this.getPedals();
        this.greenButtonThreshold = Math.max(gas, this.greenButtonThreshold);

        if (gas > this.greenButtonThreshold) {
          this.timeGreen = Date.now();
          this.greenButtonMax = this.greenButtonThreshold;
          this.greenMaxIndicator.setScale(this.greenButtonThreshold);
        } else if (
          this.greenButtonThreshold > 0.2 &&
          Date.now() - this.timeGreen > 1000
        ) {
          this.step++; // release all
        }
      }
      break;

      case 12: {
        this.setPrompt(
          'Please press [b]GAS[/b] pedal to the [b]END[/b]' +
          (this.greenButtonMax >= this.greenButtonThreshold
            ? ', then release'
            : '')
        );

        const {gas} = this.getPedals();
        if (gas < this.greenButtonThreshold && this.greenButtonMax) {
          this.step ++; // release all
        } else if (gas >= this.greenButtonThreshold) {
          this.greenButtonMax = Math.max(gas, this.greenButtonMax);
          this.greenMaxIndicator.setScale(this.greenButtonMax);
        }
      }
      break;

      case 14: {
        this.setPrompt(
          'Please press [b]BRAKE[/b] pedal to the [b]THRESHOLD[/b],\n' +
          'then release and wait 1 second'
        );

        const {brake} = this.getPedals();
        this.redButtonThreshold = Math.max(brake, this.redButtonThreshold);

        if (brake > this.redButtonThreshold) {
          this.timeRed = Date.now();
          this.redButtonMax = this.redButtonThreshold;
          this.redMaxIndicator.setScale(this.redButtonThreshold);
        } else if (
          this.redButtonThreshold > 0.2 &&
          Date.now() - this.timeRed > 1000
        ) {
          this.step++; // release all
        }
      }
      break;

      case 16: {
        this.setPrompt(
          'Please press [b]BRAKE[/b] pedal to the [b]END[/b]' +
          (this.redButtonMax >= this.redButtonThreshold ? ', then release' : '')
        );

        const {brake} = this.getPedals();
        if (brake < this.redButtonThreshold && this.redButtonMax) {
          this.step++;
        } else if (brake >= this.redButtonThreshold) {
          this.redButtonMax = Math.max(brake, this.redButtonMax);
          this.redMaxIndicator.setScale(this.redButtonMax);
        }
      }
      break;

      case 18: {
        this.setPrompt('Please turn [b]steering wheel RIGHT[/b]');

        const pressed = this.detectGamepadPressed();
        if (pressed.length === 0) {
          break;
        }
        const value = this.getValue(pressed[0]);

        if (value > 0) {
          this.buttons.wheel = pressed[0];
          this.step++;
        }
      }
      break;

      case 20: {
        this.setPrompt('Please turn[b]steering wheel LEFT[/b]');

        const {wheel} = this.getPedals();

        if (wheel < -this.buttons.wheel.threshold) {
          this.timeBlue = Date.now();
          this.step++;
        }
      }
      break;

      case 22: {
        this.setPrompt('Please [b]release steering wheel[/b] and wait 1 second');

        const {wheel} = this.getPedals();
        if (Math.abs(wheel) >= this.buttons.wheel.threshold) {
          this.timeBlue = undefined;
        } else if (Date.now() - this.timeBlue > 1000) {
          this.step = 99;
        } else if (!this.timeBlue) {
          this.timeBlue = Date.now();
        }
      }
      break;

      case 100: {
        this.setPrompt('You\'re all set\nPress any pedal for main menu');

        const {gas, brake} = this.getPedals();

        if (gas >= this.greenButtonThreshold || brake >= this.redButtonThreshold) {
          setObject('pedals', {
            gas: {
              index: this.buttons.gas.index,
              padId: this.buttons.gas.padId,
              type: this.buttons.gas.type,
              min: this.greenButtonMin,
              max: this.greenButtonMax,
              threshold: this.greenButtonThreshold,
            },
            brake: {
              index: this.buttons.brake.index,
              padId: this.buttons.brake.padId,
              type: this.buttons.brake.type,
              min: this.redButtonMin,
              max: this.redButtonMax,
              threshold: this.redButtonThreshold,
            },
            wheel: {
              index: this.buttons.wheel.index,
              padId: this.buttons.wheel.padId,
              type: this.buttons.wheel.type,
              threshold: this.buttons.wheel.threshold,
            }
          });
          this.step = 101;
        }
      }
      break;

      case 102: {
        const mainMenu = this.scene.get('main-menu');
        mainMenu.scene.restart();
        this.scene.start('main-menu');
      }
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

  // Ova funkcija sada UVIJEK vraća niz sa svim detektovanim inputima
  // (umjesto samo prvog ili null).

  detectGamepadPressed() {
    let detectedInputs = []; // Sakuplja sve detektovane inpute

    for (const pad of this.pads) {
      if (!pad) continue;

      // Normalizacija ID-ja:
      // 1) Sve u mala slova  2) Uklonimo sve razmake
      const normalizedId = pad.id.toLowerCase().replace(/\s+/g, '');

      // Poređenje po dijelovima stringa, bez obzira na razmake i velika/mala slova
      if (normalizedId.includes('g923racingwheelforplaystationandpc(vendor:046dproduct:c266)')) {
        // Logika za G923
        for (const axis of pad.axes) {
          if (
            ((axis.index > 0 && (axis.index < 3 || axis.index == 5)) && axis.value < 1) ||
            (axis.index == 0 && (axis.value > 0 + axis.threshold || axis.value < 0 - axis.threshold))
          ) {
            let threshold = axis.threshold;
            if (axis.index == 2 || axis.index == 5) {
              threshold = 1;
            }
            detectedInputs.push({
              type: 'axis',
              padId: pad.id,
              index: axis.index,
              threshold: threshold,
            });
          }
        }
      }
      else if (normalizedId.includes('simucube2pro(vendor:16d0product:0d60)')) {
        // Logika za Simucube 2 Pro (volan)
        for (const axis of pad.axes) {
          let threshold = axis.threshold;
          if (axis.index === 0) {
            if (axis.value < -0.01 || axis.value > 0.01) {
              detectedInputs.push({
                type: 'axis',
                padId: pad.id,
                index: axis.index,
                value: axis.value,
                threshold: threshold,
              });
            }
          }
        }
      }
      else if (normalizedId.includes('hesimpedals')) {
        // Logika za HE SIM PEDALS (gas i kočnica)
        for (const axis of pad.axes) {
          const value = axis.value;
          // Brake
          //if (axis.index === 1 && value > -0.9) {
          if (axis.index === 1) {
            detectedInputs.push({
              type: 'axis',
              padId: pad.id,
              index: axis.index,
              value: value,
              action: "brake"
            });
          }
          // Throttle
          //else if (axis.index === 2 && value > -0.8) {
          else if (axis.index === 2) {
            detectedInputs.push({
              type: 'axis',
              padId: pad.id,
              index: axis.index,
              value: value,
              action: "throttle"
            });
          }
        }
      }
      else {
        // Defaultna logika za druge gamepade
        for (const button of pad.buttons) {
          if (button.value >= button.threshold) {
            detectedInputs.push({
              type: 'button',
              padId: pad.id,
              index: button.index,
              threshold: button.threshold,
            });
          }
        }
        for (const axis of pad.axes) {
          if (axis.value >= axis.threshold && axis.value <= 1) {
            detectedInputs.push({
              type: 'axis',
              padId: pad.id,
              index: axis.index,
              threshold: axis.threshold,
            });
          }
        }
      }
    }
    // Vraćamo cjelokupan niz detektovanih inputa
    return detectedInputs;
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
    return (type === 'axis')
      ? pad?.axes[index].value ?? 0
      : pad?.buttons[index].value ?? 0;
  }

  update() {
    super.update();

    this.updateState();
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
  const inGasValue   = this.buttons.gas   != null ? this.getValue(this.buttons.gas)   : null;
  const inBrakeValue = this.buttons.brake != null ? this.getValue(this.buttons.brake) : null;
  const rawWheel     = this.getValue(this.buttons.wheel);

  const rawGas   = inGasValue   != null
    ? Phaser.Math.Clamp(-inGasValue,   -1, 1)
    : -1;
  const rawBrake = inBrakeValue != null
    ? Phaser.Math.Clamp(-inBrakeValue, -1, 1)
    : -1;

  const scaleGas   = Phaser.Math.Clamp((rawGas   + 1) / 2, 0, 1);
  const scaleBrake = Phaser.Math.Clamp((rawBrake + 1) / 2, 0, 1);

  this.greenIndicator.setScale(scaleGas);
  this.redIndicator  .setScale(scaleBrake);

  const [baseX, baseY] = this.fit(200, 400);
  this.blueIndicator
    .setScale(rawWheel)
    .setPosition(baseX + 100 * rawWheel, baseY);

  this.pedalsText.setText(
    `[b][color=green]${rawGas.toFixed(2)}[/color] ` +
    `[color=red]${rawBrake.toFixed(2)}[/color] ` +
    `[color=blue]${rawWheel.toFixed(2)}[/color][/b]`
  );
}


  handleGamepadConnected(pad) {
    console.debug('Connected', pad);
  }

  handleGamepadDisconnected(pad) {
    console.debug('Disconnected', pad);
  }
}
