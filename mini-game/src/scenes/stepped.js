import PedalsScene from './pedals';

export default class SteppedScene extends PedalsScene {
  currentTime;

  init() {
    this.currentTime = 0;
    this.currentStep = 'init';
  }

  update(time, delta) {
    super.update(time, delta);

    const method = `handleStep_${this.currentStep}`;
    if (!(method in this)) {
      throw new Error(`cannot handle step ${this.currentStep}`);
    }

    this[method]({
      time: this.currentTime,
      ...this.currentPedals,
    });
    this.currentTime += delta / 1000;
  }

  handleStep_init() {
    this.currentStep = 'start';
  }

  handleStep_main_menu() {
    const mainMenu = this.scene.get('main-menu');
    mainMenu.scene.restart();
    this.scene.start('main-menu');
  }

  handleStepRelease({green, red, blue}, nextStep) {
    if (!(green > 0.6
      || red > 0.6
      || blue > 0.6)) {
      this.currentStep = nextStep;
    }
  }  

  updateStep() {
    this.handleAnyStep(this.currentStep);
  }

  step;
  get currentStep() {
    return this.step;
  }
  set currentStep(step) {
    this.step = step;
    this.updateStep();
  }
}
