import ResponsiveScene from './responsive';
import {getObject} from '../services/localStorage';

export default class PedalsScene extends ResponsiveScene {
  pedals;
  pad;
  gamepadId;

  create() {
    super.create();

    this.gamepadId = this.add.rexBBCodeText(
      ...this.fit(600, 1100),
      '', {
        fontSize: 16,
        fill: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.pedals = getObject('pedals');
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

  getValue(index) {
    return index === null || this.pad === undefined || !this.pedals?.green
      ? 0
      : index >= 1000
        ? Math.max(0, this.pad.axes[index - 1000].value - this.pad.axes[index - 1000].threshold)
        : this.pad.buttons[index].value
  }

  getPedals() {
    return {
      green: this.getValue(this.pedals?.green?.index) / (this.pedals?.green?.max ?? 1),
      red: this.getValue(this.pedals?.red?.index) / (this.pedals?.red?.max ?? 1),
      blue: this.getValue(this.pedals?.blue?.index) / (this.pedals?.blue?.max ?? 1),
    };
  }

  get currentPedals() {
    return this.getPedals();
  }
}