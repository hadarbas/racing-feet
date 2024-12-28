import BBCodeText from 'phaser3-rex-plugins/plugins/bbcodetext.js';
import uniq from 'lodash/uniq';

import ResponsiveScene from './responsive';
import {getObject} from 'shared/services/localStorage';

export default class PedalsScene extends ResponsiveScene {
  pedals;
  gamepadId;
  pedalsText;

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

    this.pedalsText = this.add.rexBBCodeText(
      ...this.fit(600, 1160),
      '', {
        fontSize: 24,
        fill: '#ffffff',
        backgroundColor: '#404000',
        padding: 5,
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.pedals = getObject('pedals');

    console.log('PEDALS', this.pedals);
  }

  get controllerIds() {
    return uniq(Object.values(this.pedals)
      .map(pedal => pedal.padId)
    )
      .filter(id => id)
      .map(id => id.replace(/\s*\(.*\)/, ''))
      .join(', ');
  }

  padById(id) {
    if (!id) return null;
  
    for (let i = 0; i < this.input.gamepad.total; i++) {
      const pad = this.input.gamepad.getPad(i);
      if (pad?.id === id) {
        return pad;
      }
    }
    return null;
  }
  
  
  update() {
    super.update();
    this.updatePedals();
    this.updatePedalsText();
  }

  updatePedals() {
    if (!this.gamepadId.text && this.pedals) {
      this.gamepadId.setText(
        `[color=#888]Game Controllers:\n[/color]${this.controllerIds}`);
    } else if (!this.pad && this.pedals) {
      if (!this.input.gamepad.total) {
        this.gamepadId.setText(
          `[color=#a88]Game Controllers:\n[/color][color=#faa]$${this.controllerIds}[/color]`);
      } else {
        for (let i = 0; i < this.input.gamepad.total; i++) {
          const pad = this.input.gamepad.getPad(i);
          if (!pad) {
            continue;
          }
    
          if (pad.id === this.pedals.gamepadId) {
            this.pad = pad;
            this.gamepadId.setText(`[color=#888]Game Controllers:\n[/color]${this.controllerIds}`);
            break;
          }
        }
      }
    }
  }

  getValue(info) {
    if (!info || !this.pedals || info.index === null) {
      return 0;
    }

    if (info.padId != "G923 Racing Wheel for PlayStation and PC (Vendor: 046d Product: c266)"){
    const {padId, type, index, min, max} = info;
    
    const pad = this.padById(padId);
    if (!pad) {
      return 0;
    }

    const value = type === 'axis' ?
      pad.axes[index].value : pad.buttons[index].value;

    return Math.min(1, Math.max(0, (value - min) / (max - min)));
  } else if (info.padId == "G923 Racing Wheel for PlayStation and PC (Vendor: 046d Product: c266)"){
    const {padId, type, index, min, max} = info;
    
    const pad = this.padById(padId);
    if (!pad) {
      return 0;
    }

    const value = type === 'axis' ?
      pad.axes[index].value : pad.buttons[index].value;

    return Math.min(1, Math.max(0, (-1 * value - min) / (max - min)));
  } 
  }

  getPedals() {
    const wheelPad = this.padById(this.pedals?.wheel?.padId);
    const wheelInput = wheelPad ?
      (this.pedals.wheel.type === 'axis' ?
        wheelPad?.axes?.[this.pedals.wheel.index] :
        wheelPad?.buttons?.[this.pedals.wheel.index]) :
      null;

    const gas = this.getValue(this.pedals?.gas);
    const brake = this.getValue(this.pedals?.brake);
    const wheel = wheelInput?.value;

    return {
      gas, brake, wheel,
      green: gas,
      red: brake,
      blue: wheel,
    };
  }

  get currentPedals() {
    return this.getPedals();
  }

  updatePedalsText() {
    const pedals = this.getPedals();

    if (!pedals) {
      return;
    }
    
    const {gas = 0, brake = 0, wheel = 0} = pedals;

    this.pedalsText.setText(`${
      this.textForValue(wheel, 'gray')} | ${
      this.textForValue(brake, 'red')} ${
      this.textForValue(gas, 'green')}`);
  }

  textForColor = (value, color) =>
    `[color=${color}]${value.toFixed(2)}[/color]`;

  textForValue = (value, color) => Math.abs(value) > 0.2 ?
    `[b]${this.textForColor(value, color)}[/b]` :
    this.textForColor(value, color);
}