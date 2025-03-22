
import BaseTrainScene from './train-base';
import {db} from "shared/services/firebase/db"
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";

export default class TrainScene extends BaseTrainScene {
  askedForSave;

  constructor() {
    super({ key: 'train-2' });
  }

  create() {
    super.create();
    this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.escapeKey.on('down', () => {
        this.scene.start('LevelDetailsScene'); 
    });
    this.askedForSave = false
}

handleStep_over_menu({green, red}) {
  const [minX, _] = this.fit(this.xPadding, 0);
  const [maxX, __] = this.fit(this.xWidth - this.xPadding * 0.8, 0);
  if (this.cameras.main.scrollX <= minX) {
    this.scoreScrollDirection = maxX * 0.003;
  } else if (this.cameras.main.scrollX >= maxX) {
    this.scoreScrollDirection = maxX * -0.05;
  }
  this.cameras.main.scrollX += this.scoreScrollDirection;

  if (!this.askedForSave){
    this.askedForSave = true

    if (!this.oldScore) {
      this.oldScore = 0
    }

    if (this.oldScore < MIN_POINTS_TO_PASS && this.currentScore >= MIN_POINTS_TO_PASS){
      this.saveScore();
    } else if (this.oldScore < this.currentScore){
        const wantsToSave = confirm("Do you want to save your score?");
         if (wantsToSave) {
        this.saveScore();
        }
  }
  }

  if (green > 0.6) {
    this.currentStep = 'retry';
  } else if (red > 0.2) {
    this.currentStep = 'over_release_2';
  }
}

async saveScore() {
  try {
      const name = localStorage.getItem("name"); 
      if (!name) {
          console.error("User name not found in localStorage.");
          return;
      }

      const userLevelRef = collection(db, "user_levels");
      const q = query(userLevelRef, where("user", "==", name), where("level", "==", this.name));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0].ref;
          await updateDoc(docRef, { score: this.currentScore });
      } else {
          await addDoc(userLevelRef, { user: name, level: this.name, score: this.currentScore });
      }

      console.log(`Score ${this.currentScore} saved for user: ${name}, level: ${this.name}`);

      this.showScoreModal()

  } catch (error) {
      console.error("Error saving score:", error);
  }
}

showScoreModal() {
  const message = this.currentScore > MIN_POINTS_TO_PASS
      ? "Congratulations! You have advanced to the next level."
      : "Sorry, you need at least " + MIN_POINTS_TO_PASS + " points to advance to the next level.";

  alert(message); 

}

}

const MIN_POINTS_TO_PASS = 85



/*
`import SteppedScene from './stepped';
import trainBackground from "@assets/train-background.png";

export default class TrainScene extends SteppedScene {
  greenGraphics;
  redGraphics;
  blueGraphics;
  name;
  data;
  green;
  red;
  blue;
  score;

  corner;
  cornerEnd;
  scorePerCorner;
  distancesInOneCorner;
  levelDifficulty;
  distanceBonus;

  greenPlayer;
  redPlayer;
  
  radius = 15;

  xPadding = this.baseWidth / 3;
  xWidth;
  yPadding = this.baseHeight / 4;
  yHeight = this.baseHeight / 3;
  maxTime;
  recording;

  greenTrail;
  redTrail;
  blueTrails;

  playerSize = 30;
  scoreScrollDirection;

  constructor() {
    super({key: 'train-2'});
  }

  preload() {
    super.preload();

    this.load.image('train-background', trainBackground);
  }

  init(params) {
    super.init(params);

    this.name = params.name;
    this.data = params.data;

    this.maxTime = Math.max(...this.data.map(({time}) => time));
    this.xWidth = this.baseWidth * this.maxTime / SECONDS_PER_SCREEN;

    this.green = this.getPointsForKey(this.data, 'green');
    this.red = this.getPointsForKey(this.data, 'red');
    this.blue = this.getPointsForKey(this.data, 'blue');

    this.recording = [];
    this.currentScore = 0;

    this.corner = false
    this.cornerEnd = false
    this.scorePerCorner = []
    this.distancesInOneCorner = []
    this.levelDifficulty = 0
    this.distanceBonus = 5
  }

  process = (data, key) => data
    .filter(({[key]: value}) => typeof value === 'number')
    .reduce((points, {time, [key]: value}) => [
      ...points,
      this.fit(
        this.xPadding + time / this.maxTime * this.xWidth,
        this.yPadding + (1 - value) * this.yHeight
      ),
    ], []);
  
  getMaxTime = (data, key) => Math.max(...data
    .map(({[key]: value}) => value)
  );

  getPointsForKey = (data, key) =>
    this.getMaxTime(data, key) ? this.process(data, key) : null;

  create() {
    super.create();

    this.add.image(...this.fit(this.baseWidth / 2, this.baseHeight / 2), 'train-background')
      .setDepth(-1)
      .setTint(0x02020, 0x000020, 0x002000, 0x202020)
      .setScrollFactor(0);

    this.greenGraphics = this.add.graphics();
    this.redGraphics = this.add.graphics();
    this.blueGraphics = this.add.graphics();
    this.greenTrail = this.add.graphics();
    this.redTrail = this.add.graphics();
    this.blueTrail = this.add.graphics();

    this.drawCurve(this.greenGraphics, this.green, 0x00ff00, this.radius);
    this.drawCurve(this.redGraphics, this.red, 0xff0000, this.radius);
    this.drawCurve(this.blueGraphics, this.blue, 0x0000ff, this.radius);

    this.greenPlayer = this.add.ellipse(...this.fit(this.xPadding, this.yPadding + this.yHeight), this.playerSize, this.playerSize, 0x00ff00)
      .setStrokeStyle(this.playerSize * 0.2, 0x008000, 0.5);
    this.redPlayer = this.add.ellipse(...this.fit(this.xPadding, this.yPadding), this.playerSize * 0.8, this.playerSize * 0.8, 0xff0000)
      .setStrokeStyle(this.playerSize * 0.2, 0x800000, 0.5);
    this.bluePlayer = this.add.ellipse(...this.fit(this.xPadding, this.yPadding), this.playerSize  * 0.6, this.playerSize * 0.6, 0x0000ff)
      .setStrokeStyle(this.playerSize * 0.2, 0x000080, 0.5);

    this.prompt.setPosition(...this.fit(600, 950));
  }

  handleStep_init() {
    super.handleStep_init();

    [this.greenPlayer, this.redPlayer, this.bluePlayer]
      .forEach(player => player.setVisible(false));
  }

  handleStep_start({green, red}) {
    if (green >= 1) {
      Object.entries({
        green: this.greenPlayer,
        red: this.redPlayer,
        blue: this.bluePlayer,
      })
        .forEach(([key, player]) => player.setVisible(!!this.getMaxTime(this.data, key)));

      this.currentStep = 'play';
      this.currentTime = 0;
    }
    if (red >= 1) {
      this.currentStep = 'over_release_2';
    }
  }

  handleStep_play({time, green, red, blue}) {
    if (time >= this.maxTime) {
      this.currentStep = 'over_release_1';
      this.scoreScrollDirection = -100;
      return;
    }

    this.recording.push({time, green, red, blue});

    const greenTrailPoints = this.getPointsForKey(this.recording, 'green');
    const redTrailPoints = this.getPointsForKey(this.recording, 'red');
    const blueTrailPoints = this.getPointsForKey(this.recording, 'blue');

    const trailWidth = this.radius * 0.05;
    this.drawCurve(this.greenTrail, greenTrailPoints, 0x008000, trailWidth);
    this.drawCurve(this.redTrail, redTrailPoints, 0x800000, trailWidth);
    this.drawCurve(this.blueTrail, blueTrailPoints, 0x000080, trailWidth);

    this.greenPlayer.setPosition(...this.fit(
      this.xPadding + time / this.maxTime * this.xWidth,
      this.yPadding + (1 - green) * this.yHeight
    ));
    this.redPlayer.setPosition(...this.fit(
      this.xPadding + time / this.maxTime * this.xWidth,
      this.yPadding + (1 - red) * this.yHeight
    ));
    this.bluePlayer.setPosition(...this.fit(
      this.xPadding + time / this.maxTime * this.xWidth,
      this.yPadding + (1 - blue) * this.yHeight
    ));

    const [scrollX, _] = this.fit(time / this.maxTime * this.xWidth, 0);
    this.cameras.main.scrollX = scrollX;

    let greenData = 0;
    let redData = 0;
    let blueData = 0;
    for (let i = 0; i < this.data.length; i++) {
      const p1 = this.data[i];
      if (p1.time >= time) {
        greenData = p1.green;
        redData = p1.red;
        blueData = p1.blue;
        break;
      }
    }

    const greenDist = Math.abs(green - greenData);
    const redDist = Math.abs(red - redData);
    const blueDist = Math.abs(blue - blueData);

    if (greenData < 1 || redData > 0){
      this.corner = true
    } else if (greenData == 1 && redData == 0){
      
      if (this.corner){
        this.cornerEnd = true

        let sum = this.distancesInOneCorner.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        this.scorePerCorner.push(100 - (sum / this.distancesInOneCorner.length * 100) + this.distanceBonus + this.levelDifficulty)
        this.distancesInOneCorner = []

        this.currentScore = Math.round(this.scorePerCorner.reduce((accumulator, currentValue) => accumulator + currentValue, 0) / this.scorePerCorner.length);
      } else {
        this.cornerEnd = false
      }
      
      this.corner = false
    }

    if (this.corner) {
      if (greenData > 0){
      this.distancesInOneCorner.push(greenDist)
      }

      if (redData > 0){
      this.distancesInOneCorner.push(redDist)
    }
  }
    

    if (greenDist < 0.2 && greenData > 0) {
      this.greenPlayer.setStrokeStyle()
        .setFillStyle(0x00ff00, 1 - greenDist);
    } else {
      this.greenPlayer.setStrokeStyle()
        .setFillStyle(0x00ff00, 0.2);
    }{}

    if (redDist < 0.2 && redData > 0) {
      this.redPlayer
        .setFillStyle(0xff0000, 1 - redDist);
    } else {
      this.redPlayer
      .setFillStyle(0xff0000, 0.2);
    }

    if (blueDist < 0.2 && blueData > 0) {
      this.bluePlayer
        .setFillStyle(0x0000ff, 1 - blueDist);
    } else {
      this.bluePlayer
        .setFillStyle(0x0000ff, 0.2);
    }
  }

  handleStep_over_release_1(pedals) {
    super.handleStepRelease(pedals, 'over_menu');
  }

  handleStep_over_release_2(pedals) {
    super.handleStepRelease(pedals, 'main_menu');
  }

  handleStep_over_menu({green, red}) {
    const [minX, _] = this.fit(this.xPadding, 0);
    const [maxX, __] = this.fit(this.xWidth - this.xPadding * 0.8, 0);
    if (this.cameras.main.scrollX <= minX) {
      this.scoreScrollDirection = maxX * 0.003;
    } else if (this.cameras.main.scrollX >= maxX) {
      this.scoreScrollDirection = maxX * -0.05;
    }
    this.cameras.main.scrollX += this.scoreScrollDirection;

    if (green > 0.6) {
      this.currentStep = 'retry';
    } else if (red > 0.2) {
      this.currentStep = 'over_release_2';
    }
  }

  handleStep_retry() {
    this.scene.restart();
  }

  handleAnyStep(step) {
    if (['init', 'main_menu', 'retry'].includes(step)) {
      return;
    }

    this.setPrompt([
      `Score: [b]${this.score}[/b]`, {
        start: 'Please press [b]full gas[/b] to start\n'
          + 'or [b]full brake[/b] to return to main menu',
        over_release_1: 'Please release all pedals',
        over_menu: `Please press [b][color=green]full gas[/color][/b] to retry\nor [b][color=red]brake[/color][/b] for main menu`,
        over_release_2: 'Please release all pedals for main menu',
      }[step],
    ]
      .filter(line => !!line)
      .join('\n')
    );
  }

  getReplayPedals(time) {
    for (let i = 0; i < this.recording.length; i++) {
      const p1 = this.recording[i];
      if (p1.time >= time) {
        return p1;
      }
    }

    return {green: 0, red: 0, belu: 0};
  }

  drawCurve(graphics, points, color, radius) {
    if (!points) {
      return;
    }

    const maskGraphics = this.make.graphics();
    maskGraphics.lineStyle(radius * 2, 0xffffff).fillStyle(0xffffff);

    const [_, maxY] = this.fit(0, this.yPadding + this.yHeight);
    for (let i = 0; i < points.length; i++) {
      const p0 = points[i-1];
      const p1 = points[i];

      if (!i) {
        continue;
      }
      if (p0[1] >= maxY && p1[1] >= maxY) {
        continue;
      }

      maskGraphics.lineBetween(p0[0], p0[1], p1[0], p1[1]);
      maskGraphics.fillCircle(p1[0], p1[1], radius);
    }

    const mask = new Phaser.Display.Masks.BitmapMask(this, maskGraphics);
    graphics.fillStyle(color, 0.3).fillRect(0, 0, ...this.fit(this.xPadding + this.xWidth, this.baseHeight));
    graphics.setMask(mask);
  }

  score;
  get currentScore() {
    return this.score;
  }
  set currentScore(score) {
    this.score = score;
    super.updateStep();
  }
}

const SECONDS_PER_SCREEN = 10;`
*/