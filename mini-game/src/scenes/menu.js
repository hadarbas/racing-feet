import PedalsScene from './pedals';
import {getObject} from '../services/localStorage';
import menuBackground from "@assets/menu-background.png";

export default class MenuScene extends PedalsScene {
  items = null;
  container = null;
  firstItemIndex = 0;
  activeItemIndex = 0;
  cursors = null;
  enterKey = null;
  timeLastChange = 0;
  isWaitingForRelease = false;
  
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
    if (!this.items.length) {
      return;
    }

    if (this.container) {
      this.container.setVisible(false);
      this.container.destroy();
    }

    this.padding = this.baseHeight * 0.2;
    const innerHeight = this.baseHeight - 2 * this.padding;
    this.itemHeight = Math.floor(innerHeight / this.items.length);
    this.itemStyle = {
      fontSize: fontSize || Math.min(48, Math.floor(this.itemHeight / 2)),
      fill: '#888',
    };
    this.activeItemStyle = {
      fontSize: (fontSize || Math.min(48, Math.floor(this.itemHeight / 2))) * 1.2,
      fontWeight: 600,
      fill: '#fff',
    };
    
    this.container = this.add.container(
      0, 0,
      this.items
        .map((item, index) =>
          this.add.text(
            ...this.fit(600, this.padding + index * this.itemHeight),
            item,
            index === this.activeItemIndex ? this.activeItemStyle : this.itemStyle
          )
            .setOrigin(0.5)
            .setShadow(4, 4, 0x000000)
        )
    );
  }

  update() {
    super.update();

    if (!this.items.length) {
      return;
    }

    const {green, red, blue} = this.getPedals();

    if (this.isWaitingForRelease && red <= this.pedals?.red?.threshold) {
      this.setPrompt('');
      this.isWaitingForRelease = false;
      this.handleItemClick(this.items[this.activeItemIndex]);
    } else if (this.enterKey.isDown) {
      this.setPrompt('');
      this.handleItemClick(this.items[this.activeItemIndex]);
      return;
    } else if (red > 0.6) {
      this.isWaitingForRelease = true;
      this.setPrompt('Please [b]release all[/b] pedals');
      return;
    }
 
    const now = Date.now();

    const up = this.cursors.up.isDown || blue > 0.6;
    const down = this.cursors.down.isDown || green > 0.6;

    if (!(up || down)) {
      this.timeLastChange = 0;
    } else if (now - this.timeLastChange > 500) {
      this
        .container
        .list
        .forEach(item => item.setStyle(this.itemStyle));

      if (up) {
        this.activeItemIndex = this.activeItemIndex
          ? this.activeItemIndex - 1
          : this.items.length - 1;
        this.timeLastChange = now;
      } else if (down) {
        this.activeItemIndex = this.activeItemIndex < this.items.length - 1
          ? this.activeItemIndex + 1
          : 0;
        this.timeLastChange = now;
      }

      this.container.list[this.activeItemIndex].setStyle(this.activeItemStyle);
    }
  }

  handleItemClick(item) {
    console.debug('MenuScene.handleItemClick', item);
  }
}