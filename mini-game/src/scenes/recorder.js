import PedalsScene from './pedals';
import {setDocument} from '../services/firebase/db';

export default class RecorderScene extends PedalsScene {
  step = 1;
  recording = [
    {time: 0, green: 0, red: 0, blue: 0},
    {time: 2.9, green: 0, red: 0, blue: 0}
  ];
  timeStart = null;
  leadTime = 3;
  maxTime = this.leadTime + 10;
  graphics;

  constructor() {
    super({key: 'record-a-new-exercise'});
  }

  create() {
    super.create();
    this.graphics = this.add.graphics();
  }

  update() {
    super.update();

    switch (this.step) {
      case 1: {

        this.setPrompt('Press release [b]all pedals[/b]');

        const {green, red, blue} = this.getPedals();
        if (!green && !red && !blue) {
          this.step = 2;
        }
        break;
      }
      case 2: {
        this.setPrompt('Press [b][color=red]brake[/color][/b] to start');

        const {red} = this.getPedals();
        if (!red) {
          break;
        }
        this.timeStart = Date.now() - this.leadTime * 1000;
        this.step = 3;
      }

      case 3: {
        const time = (Date.now() - this.timeStart) / 1000;

        if (time >= this.maxTime) {
          this.step = 4;
          console.debug('recoding', this.recording);
          break;
        }

        this.setPrompt(`[b]${(time - this.leadTime).toFixed(2)}[/b] seconds`);

        const pedals = this.getPedals();
        this.recording.push({
          time,
          ...pedals,
        });

        if (pedals.green >= 1) {
          this.step = 4;
        }

        break;
      }

      case 4: {
        this.setPrompt('[i]Saving ...[/i]');
        this.save();
        this.step = 5;
        break;
      }

      case 5: {
        // wait for async save to step up
        break;
      }

      case 6: {
        const {time} = this.recording[this.recording.length-1];
        this.setPrompt(`Done ([b]${(time - this.leadTime).toFixed(2)}[/b] seconds)\nPress [b]any pedal[/b] for main menu`);

        const {green, red, blue} = this.getPedals();
        if (green || red || blue) {
          this.step = 7;
        }
    
        break;
      }

      case 7: {
        this.setPrompt('Please [b]release all[/b] pedals');

        const {blue, red, green} = this.getPedals();
        if (!blue && !green && !red) {
          this.step = 8;
        }
        break;
      }

      case 8: {
        const mainMenu = this.scene.get('main-menu');
        mainMenu.scene.restart();
        this.scene.start('main-menu');
        break;
      }
    }

    this.updateCurve();
  }

  updateCurve() {
    if (!this.recording.length) {
      return;
    }

    const colors = ['red', 'green', 'blue'];
    const xPadding = 0.1 * this.baseWidth;
    const xWidth = this.baseWidth - 2 * xPadding;
    const yPadding = 0.25 * this.baseHeight;
    const yHeight = this.baseHeight - 2 * yPadding;
    const curves = Object.fromEntries(
      colors
        .map(color => [
          color,
          this.recording
            .reduce((points, {time, [color]: value}) => [
              ...points,
              this.fit(
                xPadding + time / this.maxTime * xWidth,
                yPadding + (1 - value) * yHeight
              ),
            ], [])
        ])
    );
    
    this.graphics.clear();
    this.graphics.lineStyle(3, 0x0000ff, 0.5);
    this.drawCurve(curves.blue);
    this.graphics.lineStyle(3, 0x00ff00, 0.7);
    this.drawCurve(curves.green);
    this.graphics.lineStyle(3, 0xff0000, 1);
    this.drawCurve(curves.red);
  }

  drawCurve(points) {
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i-1];
      const p2 = points[i];
      this.graphics.lineBetween(p1[0], p1[1], p2[0], p2[1]);
    }
  }

  async save() {
    const name = window.prompt('Please enter name for exercise');
    if (!name) {
      const mainMenu = this.scene.get('main-menu');
      mainMenu.scene.restart();
      this.scene.start('main-menu');
      return;
    }

    await setDocument({data: this.recording}, 'exercise', name);
    this.step = 6;
  }
}