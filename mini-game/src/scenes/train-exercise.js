import BaseTrainScene from './train-base';

export default class TrainExerciseScene extends BaseTrainScene {
  constructor() {
    super({ key: 'train-3' });
  }

  init(params){
    super.init(params);
    console.log("Received data:", params.data);
    this.name = params.name;
    this.data = params.data;
    this.oldScore = params.oldScore;

    this.maxTime = Math.max(...this.data.map(({time}) => time));
    this.xWidth = this.baseWidth * this.maxTime / SECONDS_PER_SCREEN;

    this.green = this.getPointsForKey(this.data, 'green');
    this.red = this.getPointsForKey(this.data, 'red');
    this.blue = this.getPointsForKey(this.data, 'blue');
  }

  create() {
    super.create();
    this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.escapeKey.on('down', () => {
        this.scene.start('recorded-exercises'); 
    });
    
}
}
const SECONDS_PER_SCREEN = 10;

