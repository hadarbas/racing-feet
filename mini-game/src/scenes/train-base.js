import SteppedScene from './stepped';
import trainBackground from "@assets/train-background.png";
import { collection, query, where, getDocs, updateDoc, addDoc } from "firebase/firestore";
import { db } from "shared/services/firebase/db";

export default class TrainExerciseScene extends SteppedScene {
  greenGraphics;
  redGraphics;
  blueGraphics;
  name;
  data;
  green;
  red;
  blue;
  score;
  lastCornerScore;

  corner;
  cornerEnd;
  scorePerCorner;
  distancesInOneCorner;
  levelDifficultyPoints;
  levelDifficulty;
  distanceBonus;

  greenPlayer;
  redPlayer;
  oldScore;
  
  radius = 15;

  xPadding = this.baseWidth / 3;
  xWidth;
  yPadding = this.baseHeight / 4;
  yHeight = this.baseHeight / 5;
  maxTime;
  recording;

  greenTrail;
  redTrail;
  blueTrail;

  playerSize = 30;
  scoreScrollDirection;

  adminMode;

  hasPlayedReplay = false; 
  replayStartTime = 0;     
  replayEndedText;         
  replayButton;            

  preload() {
    super.preload();
    this.load.image('train-background', trainBackground);
  }

  init(params) {
    super.init(params);
    this.scorePerCorner = [];
    this.distancesInOneCorner = [];
    this.recording = [];
    this.currentScore = 0;
    this.lastCornerScore = 0;
    this.corner = false;
    this.cornerEnd = false;
    this.scorePerCorner = [];
    this.distancesInOneCorner = [];
    this.distanceBonus = 5;
    this.askedForSave = false;

    switch (params.levelDifficulty) {
      case "easy":
        this.levelDifficultyPoints = 30;
        break;
      case "normal":
        this.levelDifficultyPoints = 20;
        break;
      case "hard":
        this.levelDifficultyPoints = 10;
        break;
      default:
        this.levelDifficultyPoints = 0;
    }
  }

  process = (data, key) =>
    data
      .filter(({ [key]: value }) => typeof value === 'number')
      .reduce((points, { time, [key]: value }) => [
        ...points,
        this.fit(
          this.xPadding + (time / this.maxTime) * this.xWidth,
          this.yPadding + (1 - value) * this.yHeight
        ),
      ], []);

  getMaxTime = (data, key) =>
    Math.max(...data.map(({ [key]: value }) => value));

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
    this.bluePlayer = this.add.ellipse(...this.fit(this.xPadding, this.yPadding), this.playerSize * 0.6, this.playerSize * 0.6, 0x0000ff)
      .setStrokeStyle(this.playerSize * 0.2, 0x000080, 0.5);

    this.prompt.setPosition(...this.fit(600, 950));

    this.replayEndedText = this.add.text(...this.fit(600, 100), '').setOrigin(0.5).setVisible(false);
    this.replayButton = this.add.text(...this.fit(600, 150), '🔁 Replay again', {
      fontSize: '28px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setVisible(false)
      .on('pointerdown', () => {
        this.hasPlayedReplay = false;
        this.replayStartTime = this.time.now;
        this.replayEndedText.setVisible(false);
        this.replayButton.setVisible(false);
      });
    this.replayButton.setScrollFactor(0);
    this.replayButton.setDepth(1000);
    this.replayEndedText.setScrollFactor(0);
    this.replayEndedText.setDepth(1000);
  }

  getStarRating(score) {
    if (score <= 60) return "⭐";
    if (score <= 75) return "⭐⭐";
    if (score <= 85) return "⭐⭐⭐";
    if (score <= 95) return "⭐⭐⭐⭐";
    return "⭐⭐⭐⭐⭐";
  }

  handleStep_init() {
    super.handleStep_init();
    [this.greenPlayer, this.redPlayer, this.bluePlayer]
      .forEach(player => player.setVisible(false));
  }

  handleStep_start({ green, red }) {
    if (green >= 1) {
      Object.entries({
        green: this.greenPlayer,
        red: this.redPlayer,
        blue: this.bluePlayer,
      }).forEach(([key, player]) => player.setVisible(!!this.getMaxTime(this.data, key)));
      this.currentStep = 'play';
      this.currentTime = 0;
    }
    if (red >= 1) {
      this.currentStep = 'over_release_2';
    }
  }

handleStep_play({ time, green, red, blue }) {
  if (time >= this.maxTime) {
    if (this.corner) {
      const sum = this.distancesInOneCorner.reduce((acc, val) => acc + val, 0);
      const avgDeviation = this.distancesInOneCorner.length > 0
        ? sum / this.distancesInOneCorner.length
        : 0;
      let cornerScore = 100 - (avgDeviation * 100)
        + this.distanceBonus
        + this.levelDifficultyPoints;
      if (cornerScore > 100) cornerScore = 100;

      this.scorePerCorner.push(cornerScore);
      this.lastCornerScore = Math.round(cornerScore);
      const totalScore = this.scorePerCorner.reduce((a, v) => a + v, 0);
      this.currentScore = Math.round(totalScore / this.scorePerCorner.length);
      if (this.currentScore > 100) this.currentScore = 100;

      this.corner = false;
      this.cornerEnd = true;
      this.distancesInOneCorner = [];
    }
    this.currentStep = 'over_release_1';
    this.scoreScrollDirection = -100;
    return;
  }

  const rec = { time };
  if (this.green) rec.green = green;
  if (this.red)   rec.red   = red;
  if (this.blue)  rec.blue  = blue;
  this.recording.push(rec);

  const trailWidth = this.radius * 0.05;

  if (this.green) {
    const prevG = this.getSecondLastPointForKey(this.recording, 'green');
    const lastG = this.getLastPointForKey(this.recording, 'green');
    if (prevG && lastG) {
      this.drawRaceCurve(this.greenTrail, prevG, lastG, 0x008000, trailWidth);
    }
    this.greenPlayer
      .setVisible(true)
      .setPosition(...this.fit(
        this.xPadding + (time / this.maxTime) * this.xWidth,
        this.yPadding + (1 - green) * this.yHeight
      ));
  } else {
    this.greenTrail.clear();
    this.greenPlayer.setVisible(false);
  }

  if (this.red) {
    const prevR = this.getSecondLastPointForKey(this.recording, 'red');
    const lastR = this.getLastPointForKey(this.recording, 'red');
    if (prevR && lastR) {
      this.drawRaceCurve(this.redTrail, prevR, lastR, 0xff0000, trailWidth);
    }
    this.redPlayer
      .setVisible(true)
      .setPosition(...this.fit(
        this.xPadding + (time / this.maxTime) * this.xWidth,
        this.yPadding + (1 - red) * this.yHeight
      ));
  } else {
    this.redTrail.clear();
    this.redPlayer.setVisible(false);
  }

  if (this.blue) {
    const prevB = this.getSecondLastPointForKey(this.recording, 'blue');
    const lastB = this.getLastPointForKey(this.recording, 'blue');
    if (prevB && lastB) {
      this.drawRaceCurve(this.blueTrail, prevB, lastB, 0x0000ff, trailWidth);
    }
    this.bluePlayer
      .setVisible(true)
      .setPosition(...this.fit(
        this.xPadding + (time / this.maxTime) * this.xWidth,
        this.yPadding + (1 - blue) * this.yHeight
      ));
  } else {
    this.blueTrail.clear();
    this.bluePlayer.setVisible(false);
  }

  const [scrollX] = this.fit((time / this.maxTime) * this.xWidth, 0);
  this.cameras.main.scrollX = scrollX;

  let greenData = -1, redData = -1, blueData = 0;
  for (let i = 0; i < this.data.length; i++) {
    const p = this.data[i];
    if (p.time >= time) {
      greenData = p.green;
      redData   = p.red;
      blueData  = p.blue;
      break;
    }
  }

  const greenDist = Math.abs(green - greenData);
  const redDist   = Math.abs(red - redData);
  const blueDist  = Math.abs(blue - blueData);

  if (!this.corner && (green < 1 || red > -1)) {
    this.corner = true;
    this.cornerEnd = false;
    this.distancesInOneCorner = [];
  }

  if (this.corner) {
    if (greenData < 1) this.distancesInOneCorner.push(greenDist);
    if (redData   > -1) this.distancesInOneCorner.push(redDist);
  }

  if (this.corner && green === 1 && red === -1) {
    const sum = this.distancesInOneCorner.reduce((a, v) => a + v, 0);
    const avgDeviation = this.distancesInOneCorner.length
      ? sum / this.distancesInOneCorner.length
      : 0;
    let cornerScore = 100 - (avgDeviation * 100)
      + this.distanceBonus
      + this.levelDifficultyPoints;
    if (cornerScore > 100) cornerScore = 100;

    this.scorePerCorner.push(cornerScore);
    this.lastCornerScore = Math.round(cornerScore);
    const totalScore = this.scorePerCorner.reduce((a, v) => a + v, 0);
    this.currentScore = Math.round(totalScore / this.scorePerCorner.length);
    if (this.currentScore > 100) this.currentScore = 100;

    this.corner = false;
    this.cornerEnd = true;
    this.distancesInOneCorner = [];
  }

  let progressiveScore;
  if (this.corner) {
    const sumPartial = this.distancesInOneCorner.reduce((a, v) => a + v, 0);
    const avgPartial = this.distancesInOneCorner.length
      ? sumPartial / this.distancesInOneCorner.length
      : 0;
    let partialScore = 100 - (avgPartial * 100)
      + this.distanceBonus
      + this.levelDifficultyPoints;
    if (partialScore > 100) partialScore = 100;

    const completed = this.scorePerCorner.length;
    if (completed > 0) {
      const sumCompleted = this.scorePerCorner.reduce((a, v) => a + v, 0);
      progressiveScore = Math.round((sumCompleted + partialScore) / (completed + 1));
    } else {
      progressiveScore = Math.round(partialScore);
    }
  } else {
    progressiveScore = this.currentScore;
  }
  this.currentScore = progressiveScore;

  const greenAlpha = (greenDist < 0.2 && greenData > -1 ? 1 - greenDist : 0.2);
  const redAlpha   = (redDist   < 0.2 && redData   > -1 ? 1 - redDist   : 0.2);
  const blueAlpha  = (blueDist  < 0.2 && blueData  > -1 ? 1 - blueDist  : 0.2);

  this.greenPlayer.setFillStyle(0x00ff00, greenAlpha);
  this.redPlayer  .setFillStyle(0xff0000, redAlpha);
  this.bluePlayer .setFillStyle(0x0000ff, blueAlpha);
}

  getLastPointForKey(data, key) {
    if (!data || data.length === 0) return null;
    return this.processPoint(data[data.length - 1], key);
  }

  getSecondLastPointForKey(data, key) {
    if (!data || data.length < 2) return null;
    return this.processPoint(data[data.length - 2], key);
  }

  processPoint(point, key) {
    if (!point || typeof point[key] !== 'number') return null;
    return this.fit(
      this.xPadding + (point.time / this.maxTime) * this.xWidth,
      this.yPadding + (1 - point[key]) * this.yHeight
    );
  }

  handleStep_over_release_1(pedals) {
    super.handleStepRelease(pedals, 'over_menu');
  }

  handleStep_over_release_2(pedals) {
    super.handleStepRelease(pedals, 'main_menu');
  }

  handleStep_over_menu({ green, red }) {
    if (!this.askedForSave) {
      this.askedForSave = true;
      const wantsToSave = confirm("Do you want to save your exercise score?");
      if (wantsToSave) {
        this.saveExerciseScore();
      }
    }

    if (!this.hasPlayedReplay) {
      this.replayStartTime = this.time.now;
      this.hasPlayedReplay = true;
      this.replayEndedText.setVisible(false);
      this.replayButton.setVisible(false);
    }

    const elapsed = (this.time.now - this.replayStartTime) / 1000;
    const totalTime = this.maxTime;

    if (elapsed <= totalTime) {
      this.replayStep(elapsed);
    } else {
      this.replayEndedText.setVisible(true);
      this.replayButton.setVisible(true);
      this.cameras.main.scrollX = 0;
    }

    if (green > 0.6) {
      this.currentStep = 'retry';
    } else if (red > 0.2) {
      this.currentStep = 'over_release_2';
    }
  }

  replayStep(time) {
    const relevantRecords = this.recording.filter(p => p.time <= time);
    const trailWidth = this.radius * 0.05;

    this.greenTrail.clear();
    this.redTrail.clear();
    this.blueTrail.clear();

    if (relevantRecords.length >= 2) {
      for (let i = 1; i < relevantRecords.length; i++) {
        const prevGreenPoint = this.processPoint(relevantRecords[i - 1], 'green');
        const lastGreenPoint = this.processPoint(relevantRecords[i], 'green');
        if (prevGreenPoint && lastGreenPoint) {
          this.drawRaceCurve(this.greenTrail, prevGreenPoint, lastGreenPoint, 0x008000, trailWidth);
        }
        const prevRedPoint = this.processPoint(relevantRecords[i - 1], 'red');
        const lastRedPoint = this.processPoint(relevantRecords[i], 'red');
        if (prevRedPoint && lastRedPoint) {
          this.drawRaceCurve(this.redTrail, prevRedPoint, lastRedPoint, 0xff0000, trailWidth);
        }
        const prevBluePoint = this.processPoint(relevantRecords[i - 1], 'blue');
        const lastBluePoint = this.processPoint(relevantRecords[i], 'blue');
        if (prevBluePoint && lastBluePoint) {
          this.drawRaceCurve(this.blueTrail, prevBluePoint, lastBluePoint, 0x0000ff, trailWidth);
        }
      }
    }

    const lastRecord = relevantRecords[relevantRecords.length - 1];
    if (lastRecord) {
      this.greenPlayer.setPosition(...this.fit(
        this.xPadding + (lastRecord.time / this.maxTime) * this.xWidth,
        this.yPadding + (1 - lastRecord.green) * this.yHeight
      ));
      this.redPlayer.setPosition(...this.fit(
        this.xPadding + (lastRecord.time / this.maxTime) * this.xWidth,
        this.yPadding + (1 - lastRecord.red) * this.yHeight
      ));
      this.bluePlayer.setPosition(...this.fit(
        this.xPadding + (lastRecord.time / this.maxTime) * this.xWidth,
        this.yPadding + (1 - lastRecord.blue) * this.yHeight
      ));
    }

    const [scrollX, dummy] = this.fit((time / this.maxTime) * this.xWidth, 0);
    this.cameras.main.scrollX = scrollX;
  }

  handleStep_retry() {
    this.scene.restart();
  }

  handleAnyStep(step) {
    if (['init', 'main_menu', 'retry'].includes(step)) {
      return;
    }

    this.setPrompt([
      ['over_release_1', 'over_release_2', 'over_menu'].includes(step)
        ? `Score: [b]${this.getStarRating(this.currentScore)} (${Math.round(this.currentScore)})[/b]`
        : `Score: [b]${Math.round(this.currentScore)}[/b]`,
      {
        start: 'Please press [b]full gas[/b] to start\n' +
               'or [b]full brake[/b] to return to main menu',
        over_release_1: 'Please release all pedals',
        over_menu: `Please press [b][color=green]full gas[/color][/b] to retry\nor [b][color=red]brake[/color][/b] for main menu`,
        over_release_2: 'Please release all pedals for main menu',
      }[step],
    ]
    .filter(line => !!line)
    .join('\n'));
  }

  getReplayPedals(time) {
    for (let i = 0; i < this.recording.length; i++) {
      const p1 = this.recording[i];
      if (p1.time >= time) {
        return p1;
      }
    }
    return { green: 0, red: 0, belu: 0 };
  }

  drawCurve(graphics, points, color, radius) {
    if (!points || points.length < 2) {
      return;
    }

    const maskGraphics = this.make.graphics();
    maskGraphics.lineStyle(radius * 2, 0xffffff).fillStyle(0xffffff);
    const [_, maxY] = this.fit(0, this.yPadding + this.yHeight);

    let flatCount = 0;
    let nonFlatCount = 0;

    maskGraphics.beginPath();
    maskGraphics.moveTo(points[0][0], points[0][1]);

    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const dy = Math.abs(p1[1] - p0[1]);
      const isFlat = dy < radius * 0.5;
      if (isFlat) {
        flatCount++;
        maskGraphics.lineTo(p1[0], p1[1]);
      } else {
        nonFlatCount++;
        const midX = (p0[0] + p1[0]) / 2;
        const midY = (p0[1] + p1[1]) / 2;
        maskGraphics.lineTo(midX, midY);
        maskGraphics.lineTo(p1[0], p1[1]);
      }
    }

    maskGraphics.strokePath();
    const mask = new Phaser.Display.Masks.BitmapMask(this, maskGraphics);
    graphics.fillStyle(color, 0.3).fillRect(0, 0, ...this.fit(this.xPadding + this.xWidth, this.baseHeight));
    graphics.setMask(mask);
  }

  drawRaceCurve(graphics, p0, p1, color, radius) {
    if (!p0 || !p1) {
      return;
    }
    graphics.lineStyle(radius * 2, color, 1);
    graphics.beginPath();
    graphics.moveTo(p0[0], p0[1]);
    graphics.lineTo(p1[0], p1[1]);
    graphics.strokePath();
  }

  get currentScore() {
    return this.score;
  }
  set currentScore(score) {
    this.score = score;
    super.updateStep();
  }

  async saveExerciseScore() {
    try {
      const user = localStorage.getItem("name");
      if (!user) {
        console.error("User name not found in localStorage.");
        return;
      }

      const userExercisesRef = collection(db, "user_exercises");
      const q = query(
        userExercisesRef,
        where("user", "==", user),
        where("exercise", "==", this.name)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, { score: this.currentScore });
      } else {
        await addDoc(userExercisesRef, {
          user: user,
          exercise: this.name,
          score: this.currentScore
        });
      }

      console.log(`Exercise score ${this.currentScore} saved for user: ${user}, exercise: ${this.name}`);
    } catch (error) {
      console.error("Error saving exercise score:", error);
    }
  }
}

const SECONDS_PER_SCREEN = 10;
