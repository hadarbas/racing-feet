import MenuScene from "./menu";
import { getDocument, getDocuments, deleteDocument } from "shared/services/firebase/db";
import { db } from "shared/services/firebase/db";
import { collection, query, where, getDocs, deleteDoc } from "firebase/firestore";

export default class SelectExerciseScene extends MenuScene {
  execises;
  deleteKey;
  selectedCategory;
  adminMode = localStorage.getItem("name") === "admin";

  constructor() {
    super([], 'train');
  }

  create() {
    super.create();
    this.backSpaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);
    this.deleteKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DELETE);
  }

  getStarRating(score) {
    if (score <= 60) return "⭐";
    if (score <= 75) return "⭐⭐";
    if (score <= 85) return "⭐⭐⭐";
    if (score <= 95) return "⭐⭐⭐⭐";
    return "⭐⭐⭐⭐⭐";
  }

  async deleteCurrentLevel(level) {
    if (!level) {
      console.error("  No level selected for deletion.");
      return;
    }

    const lastDashIndex = level.lastIndexOf(" - ");
    level = lastDashIndex !== -1 ? level.substring(0, lastDashIndex) : level;

    const confirmDelete = confirm(`Are you sure you want to delete the level '${level}'?`);
    if (!confirmDelete) return;

    try {
      const userLevelsRef = collection(db, "user_levels");
      const q = query(userLevelsRef, where("level", "==", level));

      const querySnapshot = await getDocs(q);
      const deletePromises = [];

      querySnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });

      await Promise.all(deletePromises);

      console.log(`All user-levels with level '${level}' have been deleted.`);

      await deleteDocument("levels", level);
      console.log(`Level '${level}' has been deleted.`);

      alert(`Level '${level}' and all related user-levels deleted successfully.`);
      this.scene.start("train");
    } catch (error) {
      console.error("Error deleting level and user-levels:", error);
      alert("An error occurred while deleting the level and related user-levels.");
    }
  }

  init(params) {
    this.firstItemIndex = 0;
    this.activeItemIndex = 0;
    this.timeLastChange = 0;
    this.container = null;
    this.items = [];
    this.itemHeight = 0;
    const name = localStorage.getItem("name") || null;
    this.loadLevels(name);
  }

  update() {
    super.update();

    if (this.adminMode && (this.deleteKey.isDown || this.backSpaceKey.isDown)) {
      this.deleteCurrentLevel(this.items[this.activeItemIndex]);
    }
  }

  async loadLevels(name) {
    try {
      const userLevelsSnapshot = await getDocuments("user_levels");
      const levelsSnapshot = await getDocuments("levels");

      const userLevels = userLevelsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(level => level.user === name);

      const levels = levelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const levelsWithOrder = userLevels.map(userLevel => {
        const levelData = levels.find(level => level.id === userLevel.level);
        return {
          ...userLevel,
          order_id: levelData ? parseInt(levelData.order_id, 10) || Infinity : Infinity,
          lock: levelData ? levelData.lock : false
        };
      }).sort((a, b) => a.order_id - b.order_id);

      let filteredLevels = [];
      let firstLockedLowScoreAdded = false;

      levelsWithOrder.forEach(level => {
        const stars = this.getStarRating(level.score);
        if (level.lock === false) {
          filteredLevels.push(`${level.level} - ${stars}`);
        } else if (level.score >= MIN_POINTS_TO_PASS || (!firstLockedLowScoreAdded && level.score < MIN_POINTS_TO_PASS)) {
          filteredLevels.push(`${level.level} - ${stars}`);
          if (level.score < MIN_POINTS_TO_PASS) {
            firstLockedLowScoreAdded = true;
          }
        }
      });

      this.items = this.adminMode
        ? levelsWithOrder.map(level => `${level.level} - ${this.getStarRating(level.score)} (${Math.round(level.score)})`)
        : filteredLevels;

      this.createItems(32);

      this.time.delayedCall(50, () => {
        this.cameras.main.setVisible(true);
      });

    } catch (error) {
      console.error("Error:", error);
      return [];
    }
  }

  async handleItemClick(name) {
    try {
      const lastDashIndex = name.lastIndexOf(" - ");
      name = lastDashIndex !== -1 ? name.substring(0, lastDashIndex) : name;


      console.log(`Fetching level '${name}'...`);

      const levelDoc = await getDocument("levels", name);

      if (!levelDoc.exists()) {
        console.error(`  Level '${name}' not found!`);
        alert(`  Level '${name}' not found.`);
        return;
      }

      const levelData = levelDoc.data();
      console.log(`  Level '${name}' found:`, levelData);

      const userName = localStorage.getItem("name");
      if (!userName) {
        console.error("User name not found in localStorage.");
        return;
      }

      const userLevelRef = collection(db, "user_levels");
      const q = query(userLevelRef, where("user", "==", userName), where("level", "==", name));
      const querySnapshot = await getDocs(q);

      let oldScore = null;

      if (!querySnapshot.empty) {
        const userLevelData = querySnapshot.docs[0].data();
        oldScore = userLevelData.score ?? 0;
        console.log(`  Old Score for user '${userName}', level '${name}':`, oldScore);
      } else {
        console.log(`  No previous score found for user '${userName}', level '${name}'.`);
      }

      this.scene.start('LevelDetailsScene', { levelData: levelData});

    } catch (error) {
      console.error("Error:", error);
      alert("Check console for error.");
    }
  }
}

const MIN_POINTS_TO_PASS = 85;
