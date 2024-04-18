import BBCodeText from 'phaser3-rex-plugins/plugins/bbcodetext.js';

import ResponsiveScene from './responsive';
import {getObject} from 'shared/services/localStorage';

export default class PedalsScene extends ResponsiveScene {
  pedals;
  pad;
  gamepadId;

  create() {
    super.create();

    const txt = new BBCodeText(
      this.scene.scene,
      ...this.fit(600, 1100),
      '', {
        fontSize: 16,
        fill: '#ffffff',
        align: 'center',
      });
    this.gamepadId = this.scene.scene.add.existing(txt);
    this.gamepadId
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.pedals = getObject('pedals');

    console.log('PEDALS', this.pedals);
  }

  
  update() {
    super.update();
    this.updatePedals();
  }

  updatePedals() {
    if (!this.gamepadId.text && this.pedals) {
      this.gamepadId.setText(`[color=#888]Game Controller:\n[/color]${this.pedals.gamepadId}`);
    } else if (!this.pad && this.pedals) {
      if (!this.input.gamepad.total) {
        this.gamepadId.setText(`[color=#a88]Game Controller:\n[/color][color=#faa]$${this.pedals.gamepadId}[/color]`);
      } else {
        for (let i = 0; i < this.input.gamepad.total; i++) {
          const pad = this.input.gamepad.getPad(i);
    
          if (pad.id === this.pedals.gamepadId) {
            this.pad = pad;
            this.gamepadId.setText(`[color=#888]Game Controller:\n[/color]${this.pedals.gamepadId}`);
            break;
          }
        }
      }
    }
  }

  getValue(info) {
    if (!info || !this.pad || info.index === null) {
      return 0;
    }

    const {index, min, max} = info;
    const value = index >= 1000
      ? this.pad.axes[index - 1000].value
      : this.pad.buttons[index].value;

    return Math.min(1, Math.max(0, (value - min) / (max - min)));
  }

  getPedals() {
    return {
      green: this.getValue(this.pedals?.green),
      red: this.getValue(this.pedals?.red),
      blue: this.getValue(this.pedals?.blue),
    };
  }

  get currentPedals() {
    return this.getPedals();
  }
}