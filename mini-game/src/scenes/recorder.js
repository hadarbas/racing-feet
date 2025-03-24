import SteppedScene from './stepped';
import {setDocument} from 'shared/services/firebase/db';

export default class RecorderScene extends SteppedScene {
  recording;
  maxTime = 5000;
  graphics;

  constructor() {
    super({key: 'record-a-new-exercise'});
  }

  create() {
    super.create();
    this.graphics = this.add.graphics();
  }

  init(params) {
    super.init(params);
    this.recording = [];
    this.bestGreen = -Infinity;      
    this.indexBestGreen = null;      
    this.timeLastRelease = null;     
  }

  handleStep_start(pedals) {
    this.setPrompt('Please release [b]all pedals[/b]');
    super.handleStepRelease(pedals, 'trigger');
  }
  
  handleStep_trigger({green, red}) {
    this.setPrompt('Please press [b]full gas[/b] to start recording\n'
      + 'or [b]full brake[/b] to cancel');
    if (green >= 1) {
      this.currentTime = 0;
      this.currentStep = 'record';
    } else if (red >= 1) {
      this.currentStep = 'release_main_menu';
    }
  }

  timeLastRelease;
  indexLastFullGreen;
  handleStep_record({ time, green, red, blue }) {
    if (time >= this.maxTime) {
      const spliceIndex = (this.indexBestGreen !== null && this.indexBestGreen !== undefined)
                            ? this.indexBestGreen
                            : 0;
      this.recording = this.recording.slice(spliceIndex);
      this.currentStep = 'save';
      return;
    }
  
    this.setPrompt(`[b]${time.toFixed(2)}[/b] seconds`);
  
    this.recording.push({ time, green, red, blue });
    this.updateCurve();
  
    if (green > 0.01 || red > 0.01 || blue > 0.01) {
      this.timeLastRelease = null;
      if (green > this.bestGreen) {
        this.bestGreen = green;
        this.indexBestGreen = this.recording.length - 1;
      }
    } else {
      if (this.timeLastRelease === null) {
        this.timeLastRelease = time;
      } else if (time - this.timeLastRelease >= 3) {
        const spliceIndex = (this.indexBestGreen !== null && this.indexBestGreen !== undefined)
                              ? this.indexBestGreen
                              : 0;
        this.recording = this.recording.slice(spliceIndex);
        this.updateCurve();
        this.currentStep = 'save';
      }
    }
  }

  handleStep_save() {
    this.updateCurve();
    this.currentStep = 'saving';
    this.save().then(() => {
      this.currentStep = 'trigger_main_menu';
    });
  }

  handleStep_saving() {
    this.setPrompt('[i]Saving ...[/i]');
  }

  handleStep_trigger_main_menu({time, green, red, blue}) {
    const endTime = this.recording[this.recording.length - 1].time;

    this.setPrompt(`Done ([b]${(endTime).toFixed(2)}[/b] seconds)\n`
    + 'Press [b]any pedal[/b] for main menu');

    if (green > 0.6 || red > 0.6) {
      this.currentStep = 'release_main_menu';
    }
  }

  handleStep_release_main_menu({green, red}) {
    this.setPrompt(`Release all pedals for main menu`);
    super.handleStepRelease({green, red}, 'main_menu');
  }

  handleAnyStep() {
    // Do nothing
  }

  updateCurve() {
    if (!this.recording.length) {
      return;
    }

    const colors = ['red', 'green', 'blue'];
    const xPadding = this.baseWidth / 3;
    const xWidth = this.baseWidth - 2 * xPadding;
    const yPadding = 0.25 * this.baseHeight;
    const yHeight = this.baseHeight / 4;
    const curves = Object.fromEntries(
      colors
        .map(color => [
          color,
          this.recording
            .reduce((points, {time, [color]: value}) => [
              ...points,
              this.fit(
                xPadding + time * this.baseWidth / SECONDS_PER_SCREEN,
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

    const endTime = this.recording[this.recording.length - 1].time;
    const [scrollX, _] = this.fit(endTime * this.baseWidth / SECONDS_PER_SCREEN, 0);
    this.cameras.main.scrollX = scrollX;
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

const SECONDS_PER_SCREEN = 10;