import PedalsScene from './pedals';

export default class SteppedScene extends PedalsScene {
  currentTime;

  init() {
    this.currentTime = 0;
    this.currentStep = 'init';
  }

  update(time, delta) {
    const cpuStart = performance.now(); // Početak merenja CPU vremena

    super.update(time, delta);

    // Proveravamo da li postoji metoda za trenutni step
    const method = `handleStep_${this.currentStep}`;
    if (!(method in this)) {
        throw new Error(`cannot handle step ${this.currentStep}`);
    }

    this[method]({
        time: this.currentTime,
        ...this.currentPedals,
    });

    this.currentTime += delta / 1000;

    // FPS, Frame Time i Heap Usage
    if (!this.lastTime) this.lastTime = time;
    const frameTime = time - this.lastTime;
    this.lastTime = time;

    const fps = frameTime > 0 ? (1000 / frameTime).toFixed(2) : "N/A";
    const heapUsed = (performance.memory ? performance.memory.usedJSHeapSize / 1024 / 1024 : "N/A").toFixed(2);

    const cpuEnd = performance.now(); // Kraj merenja CPU vremena
    const cpuTime = (cpuEnd - cpuStart).toFixed(2); // Računamo CPU vreme

    //console.log(`FPS: ${fps} | Delta Time: ${frameTime.toFixed(2)} ms | CPU Time: ${cpuTime} ms | Heap Used: ${heapUsed} MB`);
}




  handleStep_init() {
    this.currentStep = 'start';
  }

  handleStep_main_menu() {
    const mainMenu = this.scene.get('main-menu');
    mainMenu.scene.restart();
    this.scene.start('main-menu');
  }

  handleStepRelease({green, red}, nextStep) {
    if (green < 0.2 && red < 0.2) {
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
