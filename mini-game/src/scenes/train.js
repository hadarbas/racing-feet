
import BaseTrainScene from './train-base';
import {db} from "shared/services/firebase/db"
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";

export default class TrainScene extends BaseTrainScene {
  askedForSave;

  constructor() {
    super({ key: 'train-2' });
  }

  init(params){
    super.init(params);
    console.log("Received data:", params.data);
    this.name = params.name;
    this.data = params.data.data;
    console.log("Received data:", params.data);
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
const SECONDS_PER_SCREEN = 10;
