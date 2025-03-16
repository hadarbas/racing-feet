import MenuScene from "./menu";
import { getDocument, getDocuments, deleteDocument } from "shared/services/firebase/db";

export default class SelectRecordedExerciseScene extends MenuScene {
  exercises;
  deleteKey;
  selectedExercise = null; // 🔹 Holds the selected item
  adminMode = localStorage.getItem("name") === "admin";

  constructor() {
    super([], 'recorded-exercises');
  }

  create() {
    super.create();

    this.deleteKey = this.input.keyboard.addKey('delete');
  }

  async deleteCurrentExercise() {
    if (!this.selectedExercise) {
      console.error("  No exercise selected for deletion.");
      return;
    }

    const confirmDelete = confirm(`Are you sure you want to delete the exercise '${this.selectedExercise}'?`);
    if (!confirmDelete) return;

    try {
      await deleteDocument("exercise", this.selectedExercise); // Delete exercise from database
      console.log(`  Exercise '${this.selectedExercise}' has been deleted.`);

      alert(`Exercise '${this.selectedExercise}' deleted successfully.`);
      this.scene.start("recorded-exercises"); // Return user to the main menu
    } catch (error) {
      console.error("  Error deleting exercise:", error);
      alert("  An error occurred while deleting the exercise.");
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
    this.loadExercises();
  }

  update() {
    super.update();

    if (this.items.length > 0) {
      this.selectedExercise = this.items[this.activeItemIndex];
    }

    if (this.adminMode && this.deleteKey.isDown) {
      this.deleteCurrentExercise();
    }
  }

  async loadExercises() {
    try {
      const levelsSnapshot = await getDocuments("exercise");

      const levels = levelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      this.categories = levels.map(level => level.id);
      this.items = [...this.categories];

      // 🔹 Set the first item as selected
      if (this.items.length > 0) {
        this.selectedExercise = this.items[0];
      }

      this.createItems(20);

      this.time.delayedCall(50, () => {
        this.cameras.main.setVisible(true);
      });

    } catch (error) {
      console.error("  Error loading exercises:", error);
      return [];
    }
  }

  async handleItemClick(name) {
    try {
      console.log(`🔍 Fetching exercise '${name}'...`);

      const levelDoc = await getDocument("exercise", name);

      if (!levelDoc.exists()) {
        console.error(`  Exercise '${name}' does not exist!`);
        alert(`  Exercise '${name}' not found.`);
        return;
      }

      const levelData = levelDoc.data();
      console.log(`  Exercise '${name}' found:`, levelData);

      this.scene.start('train-3', { name, data: levelData.data });

    } catch (error) {
      console.error("  Error fetching exercise:", error);
      alert("Error fetching exercise, check the console for details.");
    }
  }
}
