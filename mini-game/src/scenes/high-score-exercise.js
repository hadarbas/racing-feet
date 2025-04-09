import MenuScene from "./menu";
import { getDocuments } from "shared/services/firebase/db";

export default class HighScoreExercise extends MenuScene {
  exercises;
  deleteKey;
  selectedCategory;
  level;

  constructor() {
    super([], "high-score-exercise");
  }

  create() {
    super.create();
  }

  getStarRating(score) {
    if (score <= 60) return "⭐";
    if (score <= 75) return "⭐⭐";
    if (score <= 85) return "⭐⭐⭐";
    if (score <= 95) return "⭐⭐⭐⭐";
    return "⭐⭐⭐⭐⭐";
  }

  init(params) {
    this.firstItemIndex = 0;
    this.activeItemIndex = 0;
    this.timeLastChange = 0;
    this.container = null;
    this.items = [];
    this.itemHeight = 0;
    this.level = params.name;
    this.loadExerciseScores(this.level);
  }

  update() {
    super.update();
  }

  async loadExerciseScores(name) {
    try {
      const exerciseSnapshot = await getDocuments("user_exercises");

      const exercises = exerciseSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(ex => ex.exercise === name)
        .sort((a, b) => b.score - a.score);

      this.items = exercises
        .map(ex => `${ex.user} - ${this.getStarRating(ex.score)} (${Math.round(ex.score)})`)
        .slice(0, 10);

      console.log("Sorted Exercises:", this.items);

      if (this.items.length === 0) {
        const { width, height } = this.scale;
        this.add.text(width / 2, height / 2, "There is not data for this exercise.", {
          fontSize: "24px",
          fill: "#fff"
        }).setOrigin(0.5);
      } else {
        this.createItems(32);
        this.time.delayedCall(50, () => {
          this.cameras.main.setVisible(true);
        });
      }
      
    } catch (error) {
      console.error("Greška pri učitavanju exercise:", error);
      return [];
    }
  }
}
