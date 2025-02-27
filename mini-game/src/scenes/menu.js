import PedalsScene from './pedals';
import {getObject} from 'shared/services/localStorage';
import menuBackground from "@assets/menu-background.png";

export default class MenuScene extends PedalsScene {
  items = null;
  container = null;
  firstItemIndex = 0;
  activeItemIndex = 0;
  cursors = null;
  enterKey = null;
  timeLastChange = 0;
  waitingForPedal = null;
  
  constructor (items, key) {
    super({key});

    this.items = items;

    this.pedals = getObject('pedals');
  }

  preload() {
    super.preload();

    this.load.image('menu-background', menuBackground);
  }


  create() {
    super.create();

    this.add.image(...this.fit(this.baseWidth / 2, this.baseHeight / 2), 'menu-background')
      .setDepth(-1)
      .setTint(0x04040, 0x000040, 0x004000, 0x404040);

    this.createItems();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.enterKey = this.input.keyboard.addKey('ENTER');
}

createItems(fontSize) {
  if (!this.items || !this.items.length) {
    return;
  }

  if (this.container) {
    this.container.each(item => item.destroy());
    this.container.removeAll(true);
    this.container.destroy();
    this.container = null;
  }

  this.padding = this.baseHeight * 0.2;
  const innerHeight = this.baseHeight - 2 * this.padding;
  this.itemHeight = Math.floor(innerHeight / this.items.length);

  const defaultFontSize = fontSize || Math.min(48, Math.floor(this.itemHeight / 2));
  this.itemStyle = {
    fontSize: defaultFontSize,
    fill: '#888',
  };

  this.activeItemStyle = {
    fontSize: defaultFontSize * 1.2,
    fontWeight: 600,
    fill: '#fff',
  };

  const tempContainer = this.add.container(0, 0).setVisible(false);

  this.items.forEach((item, index) => {
    const text = this.add.text(
      ...this.fit(600, this.padding + index * this.itemHeight),
      item,
      index === this.activeItemIndex ? this.activeItemStyle : this.itemStyle
    )
      .setOrigin(0.5)
      .setShadow(4, 4, 0x000000);

    tempContainer.add(text);
  });

  this.container = tempContainer.setVisible(true);
}

update() {
  super.update();

  if (!this.items.length) {
      return;
  }

  const { gas, brake, wheel } = this.getPedals();

  if (this.waitingForPedal && gas < 0.2 && brake < 0.2 && !this.itemClicked) {
      this.setPrompt(this.waitingForPedal);
      if (this.waitingForPedal === "gas") {
          this.handleItemClick(this.items[this.activeItemIndex]);
      } else {
          this.scene.start('main-menu');
      }
      this.waitingForPedal = null;
      this.itemClicked = true; 
  } else if (Phaser.Input.Keyboard.JustDown(this.enterKey)) { 
      this.setPrompt('');
      this.handleItemClick(this.items[this.activeItemIndex]);
  } else if (brake >= this.pedals?.brake?.threshold) {
      this.waitingForPedal = 'brake';
      this.setPrompt('Please [b]release all[/b] pedals');
  } else if (gas >= this.pedals?.gas?.threshold) {
      this.waitingForPedal = 'gas';
      this.setPrompt('Please [b]release all[/b] pedals');
  }

  const now = Date.now();

  const up = this.cursors.up.isDown;
  const down = this.cursors.down.isDown;

  if (!(up || down)) {
      this.timeLastChange = 0;
  } else if (now - this.timeLastChange > 1500) {
      this.container.list.forEach(item => item.setStyle(this.itemStyle));

      if (up) {
          this.activeItemIndex = this.activeItemIndex ? this.activeItemIndex - 1 : this.items.length - 1;
          this.timeLastChange = now;
      } else if (down) {
          this.activeItemIndex = this.activeItemIndex < this.items.length - 1 ? this.activeItemIndex + 1 : 0;
          this.timeLastChange = now;
      }

      this.container.list[this.activeItemIndex].setStyle(this.activeItemStyle);
  }
}


  handleItemClick(item) {
    console.debug('MenuScene.handleItemClick', item);
  }
}