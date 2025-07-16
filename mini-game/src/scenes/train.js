import BaseTrainScene from './train-base';
import { db } from "shared/services/firebase/db";
import { collection, query, where, getDocs, updateDoc, addDoc } from "firebase/firestore";

export default class TrainScene extends BaseTrainScene {
  askedForSave;
  recording;
  hasPlayedReplay = false;
  replayStartTime = 0;
  replayEndedText;
  replayButton;

  constructor() {
    super({ key: 'train-2' });
  }

  init(params) {
    super.init(params);
    this.name = params.data.name;
    this.data = params.data.data;
    this.oldScore = params.oldScore;

    this.maxTime = Math.max(...this.data.map(({ time }) => time));
    this.xWidth = this.baseWidth * this.maxTime / SECONDS_PER_SCREEN;

    this.green = this.getPointsForKey(this.data, 'green');
    this.red = this.getPointsForKey(this.data, 'red');
    this.blue = this.getPointsForKey(this.data, 'blue');

    this.recording = [];
  }

  create() {
    super.create();
    this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escapeKey.on('down', () => {
      this.scene.start('LevelDetailsScene');
    });
    this.askedForSave = false;

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

  handleStep_over_menu({ green, red }) {
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

    if (!this.askedForSave) {
      this.askedForSave = true;
      if (!this.oldScore) {
        this.oldScore = 0;
      }
      if (this.oldScore < MIN_POINTS_TO_PASS && this.currentScore >= MIN_POINTS_TO_PASS) {
        this.saveScore();
      } else if (this.oldScore < this.currentScore) {
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

replayStep(time) {
  const relevantRecords = this.recording.filter(p => p.time <= time);
  const trailWidth = this.radius * 0.05;

  if (this.greenTrail) this.greenTrail.clear();
  if (this.redTrail)   this.redTrail.clear();
  if (this.blueTrail)  this.blueTrail.clear();

  if (relevantRecords.length >= 2) {
    for (let i = 1; i < relevantRecords.length; i++) {
      const prev = relevantRecords[i - 1];
      const curr = relevantRecords[i];

      if (this.green && prev.green != null && curr.green != null) {
        const p0 = this.processPoint(prev, 'green');
        const p1 = this.processPoint(curr, 'green');
        if (p0 && p1) this.drawRaceCurve(this.greenTrail, p0, p1, 0x008000, trailWidth);
      }

      if (this.red && prev.red != null && curr.red != null) {
        const p0 = this.processPoint(prev, 'red');
        const p1 = this.processPoint(curr, 'red');
        if (p0 && p1) this.drawRaceCurve(this.redTrail, p0, p1, 0xff0000, trailWidth);
      }

      if (this.blue && prev.blue != null && curr.blue != null) {
        const p0 = this.processPoint(prev, 'blue');
        const p1 = this.processPoint(curr, 'blue');
        if (p0 && p1) this.drawRaceCurve(this.blueTrail, p0, p1, 0x0000ff, trailWidth);
      }
    }
  }

  const last = relevantRecords[relevantRecords.length - 1];
  if (last) {
    if (this.green && last.green != null) {
      this.greenPlayer
        .setVisible(true)
        .setPosition(...this.fit(
          this.xPadding + last.time / this.maxTime * this.xWidth,
          this.yPadding + (1 - last.green) * this.yHeight
        ));
    } else {
      this.greenPlayer.setVisible(false);
    }

    if (this.red && last.red != null) {
      this.redPlayer
        .setVisible(true)
        .setPosition(...this.fit(
          this.xPadding + last.time / this.maxTime * this.xWidth,
          this.yPadding + (1 - last.red) * this.yHeight
        ));
    } else {
      this.redPlayer.setVisible(false);
    }

    if (this.blue && last.blue != null) {
      this.bluePlayer
        .setVisible(true)
        .setPosition(...this.fit(
          this.xPadding + last.time / this.maxTime * this.xWidth,
          this.yPadding + (1 - last.blue) * this.yHeight
        ));
    } else {
      this.bluePlayer.setVisible(false);
    }
  }

  const [scrollX] = this.fit(time / this.maxTime * this.xWidth, 0);
  this.cameras.main.scrollX = scrollX;
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
      this.showScoreModal();
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

const MIN_POINTS_TO_PASS = 85;
const SECONDS_PER_SCREEN = 10;
