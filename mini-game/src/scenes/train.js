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
    console.log("Received data:", params.data);
    this.name = params.name;
    this.data = params.data.data;
    console.log("Received data:", params.data);
    this.oldScore = params.oldScore;

    this.maxTime = Math.max(...this.data.map(({ time }) => time));
    this.xWidth = this.baseWidth * this.maxTime / SECONDS_PER_SCREEN;

    this.green = this.getPointsForKey(this.data, 'green');
    this.red = this.getPointsForKey(this.data, 'red');
    this.blue = this.getPointsForKey(this.data, 'blue');

    // Inicijalizuj replay zapis – koristimo ga samo za replay, bez dodatnog push-ovanja tokom replaya.
    this.recording = [];
  }

  create() {
    super.create();
    this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escapeKey.on('down', () => {
      this.scene.start('LevelDetailsScene');
    });
    this.askedForSave = false;

    // Ako su potrebni UI elementi za replay, kreiramo ih:
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

  // U ovoj metodi sada se koristi replay logika – umesto da se u replay modu dodaju novi zapisi,
  // replayStep() se poziva da iscrta replay koristeći postojeće zapise u this.recording.
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

    // Ostatak logike za čuvanje rezultata
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
    if (this.redTrail) this.redTrail.clear();
    if (this.blueTrail) this.blueTrail.clear();

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

    // Ažuriraj pozicije igrača na osnovu poslednjeg zapisa
    const lastRecord = relevantRecords[relevantRecords.length - 1];
    if (lastRecord) {
      this.greenPlayer.setPosition(...this.fit(
        this.xPadding + lastRecord.time / this.maxTime * this.xWidth,
        this.yPadding + (1 - lastRecord.green) * this.yHeight
      ));
      this.redPlayer.setPosition(...this.fit(
        this.xPadding + lastRecord.time / this.maxTime * this.xWidth,
        this.yPadding + (1 - lastRecord.red) * this.yHeight
      ));
      this.bluePlayer.setPosition(...this.fit(
        this.xPadding + lastRecord.time / this.maxTime * this.xWidth,
        this.yPadding + (1 - lastRecord.blue) * this.yHeight
      ));
    }

    const [scrollX, dummy] = this.fit(time / this.maxTime * this.xWidth, 0);
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
