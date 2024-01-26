import MenuScene from "./menu";
import {setObject} from '../services/localStorage';

export default class SelectControllerScene extends MenuScene {
  constructor() {
    super([], 'setup');
  }

  update() {
    super.update();

    if (this.input.gamepad.total) {
      this.setPrompt('Please select a controller');

      const items = [];
      for (let i = 0; i < this.input.gamepad.total; i++) {
        items.push(this.input.gamepad.getPad(i).id);
      }
      super.items = items;
      super.createItems(14);
    } else {
      this.setPrompt('Please press a pedal');
    }
  } 

  handleItemClick(item) {
    setObject('pedals', {gamepadId: item});
  
    const setup = this.scene.get('setup-2');
    setup.scene.restart();
    this.scene.start('setup-2');
  }
}