import { getDocument, getDocuments } from "shared/services/firebase/db";
import MenuScene from "./menu";

export default class HighScore extends MenuScene {
  execises;
  selectedCategory;

  constructor() {
    super([], 'high-score');
  }

  init(params) {
    this.firstItemIndex = 0;
    this.activeItemIndex = 0;
    this.timeLastChange = 0;
    this.container = null;
    this.items = [];
    this.itemHeight = 40; 

    this.levelItems = [];
    this.exerciseItems = [];

    this.levelContainer = null;
    this.exerciseContainer = null;
    this.levelTextObjects = [];
    this.exerciseTextObjects = [];

    this.levelScrollOffset = 0;
    this.exerciseScrollOffset = 0;

    this.levelSelectedIndex = 0;
    this.exerciseSelectedIndex = 0;

    this.activeColumn = "levels";

    this.loadLevels();
    this.loadExercises();
  }

  create() {
    super.create();

    const { width, height } = this.scale;

    this.columnWidth = 300;
    this.dividerWidth = 1; 
    this.containerHeight = 400; 

    const leftColumnX = (width / 2) - this.columnWidth - (this.dividerWidth / 2) - 20; 
    const rightColumnX = (width / 2) + (this.dividerWidth / 2) + 20;

    const headingY = (height - this.containerHeight - 60) / 2;
    const containerY = headingY + 60; 

    this.add.text(leftColumnX + this.columnWidth / 2, headingY, 'LEVELS', {
      fontSize: '24px',
      fill: '#FFFF00'
    }).setOrigin(0.5);
    this.add.text(rightColumnX + this.columnWidth / 2, headingY, 'EXERCISES', {
      fontSize: '24px',
      fill: '#FFFF00'
    }).setOrigin(0.5);

    this.levelContainer = this.add.container(leftColumnX, containerY);
    this.levelContainerOriginalY = containerY;
    this.exerciseContainer = this.add.container(rightColumnX, containerY);
    this.exerciseContainerOriginalY = containerY;

    const levelMask = this.make.graphics({ x: leftColumnX, y: containerY, add: false });
    levelMask.fillStyle(0xffffff);
    levelMask.fillRect(0, 0, this.columnWidth, this.containerHeight);
    this.levelContainer.setMask(new Phaser.Display.Masks.GeometryMask(this, levelMask));

    const exerciseMask = this.make.graphics({ x: rightColumnX, y: containerY, add: false });
    exerciseMask.fillStyle(0xffffff);
    exerciseMask.fillRect(0, 0, this.columnWidth, this.containerHeight);
    this.exerciseContainer.setMask(new Phaser.Display.Masks.GeometryMask(this, exerciseMask));

    this.add.rectangle(width / 2, containerY + this.containerHeight / 2, this.dividerWidth, this.containerHeight, 0x808080);

    this.setupKeyboardControls();

    if (this.levelItems.length > 0) {
      this.displayLevels();
    }
    if (this.exerciseItems.length > 0) {
      this.displayExercises();
    }
  }

  update() {
    super.update();
  } 

  async loadLevels() {
    try {
      const levelsSnapshot = await getDocuments("levels");

      const levels = levelsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (a.order_id ?? Infinity) - (b.order_id ?? Infinity));

      this.levelItems = levels.map(level => `${level.id}`);
      this.levelSelectedIndex = 0; 

      if (this.levelContainer) {
        this.displayLevels();
      }
    } catch (error) {
      console.error("Greška pri učitavanju levela:", error);
      return [];
    }
  }

  async loadExercises() {
    try {
      const exercisesSnapshot = await getDocuments("exercise");

      const exercises = exercisesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }));

      this.exerciseItems = exercises.map(ex => (ex.name ? `${ex.name}` : `${ex.id}`));
      this.exerciseSelectedIndex = 0; 

      if (this.exerciseContainer) {
        this.displayExercises();
      }
    } catch (error) {
      console.error("Greška pri učitavanju exercises:", error);
      return [];
    }
  }

  displayLevels() {
    this.levelContainer.removeAll(true);
    this.levelTextObjects = [];

    this.levelItems.forEach((name, index) => {
      const style = {
        fontSize: '20px',
        fill: (this.activeColumn === 'levels' && this.levelSelectedIndex === index) ? '#ffff00' : '#fff'
      };

      const text = this.add.text(0, index * this.itemHeight, name, style)
        .setInteractive()
        .on('pointerdown', () => {
          this.levelSelectedIndex = index;
          this.activeColumn = 'levels';
          this.updateHighlights();
        })
        .on('pointerover', () => {
          if (this.activeColumn === 'levels') {
            this.levelSelectedIndex = index;
            this.updateHighlights();
          }
        });
      this.levelTextObjects.push(text);
      this.levelContainer.add(text);
    });

    this.updateScroll();
  }

  displayExercises() {
    this.exerciseContainer.removeAll(true);
    this.exerciseTextObjects = [];

    this.exerciseItems.forEach((name, index) => {
      const style = {
        fontSize: '20px',
        fill: (this.activeColumn === 'exercises' && this.exerciseSelectedIndex === index) ? '#ffff00' : '#fff'
      };

      const text = this.add.text(0, index * this.itemHeight, name, style)
        .setInteractive()
        .on('pointerdown', () => {
          this.exerciseSelectedIndex = index;
          this.activeColumn = 'exercises';
          this.updateHighlights();
        })
        .on('pointerover', () => {
          if (this.activeColumn === 'exercises') {
            this.exerciseSelectedIndex = index;
            this.updateHighlights();
          }
        });
      this.exerciseTextObjects.push(text);
      this.exerciseContainer.add(text);
    });

    this.updateScroll();
  }

  updateHighlights() {
    this.levelTextObjects.forEach((text, index) => {
      text.setStyle({ fill: (this.activeColumn === 'levels' && this.levelSelectedIndex === index) ? '#ffff00' : '#fff' });
    });
    this.exerciseTextObjects.forEach((text, index) => {
      text.setStyle({ fill: (this.activeColumn === 'exercises' && this.exerciseSelectedIndex === index) ? '#ffff00' : '#fff' });
    });
    this.updateScroll();
  }

  updateScroll() {
    if (this.activeColumn === 'levels') {
      const maxScroll = Math.max(0, (this.levelItems.length * this.itemHeight) - this.containerHeight);
      const newOffset = Math.min(this.levelSelectedIndex * this.itemHeight, maxScroll);
      this.levelContainer.y = this.levelContainerOriginalY - newOffset;
    } else {
      const maxScroll = Math.max(0, (this.exerciseItems.length * this.itemHeight) - this.containerHeight);
      const newOffset = Math.min(this.exerciseSelectedIndex * this.itemHeight, maxScroll);
      this.exerciseContainer.y = this.exerciseContainerOriginalY - newOffset;
    }
  }

  setupKeyboardControls() {
    this.input.keyboard.on('keydown-LEFT', () => {
      if (this.activeColumn !== 'levels') {
        this.activeColumn = 'levels';
        this.levelSelectedIndex = 0; 
        this.updateHighlights();
      }
    });

    this.input.keyboard.on('keydown-RIGHT', () => {
      if (this.activeColumn !== 'exercises') {
        this.activeColumn = 'exercises';
        this.exerciseSelectedIndex = 0; 
        this.updateHighlights();
      }
    });

    this.input.keyboard.on('keydown-UP', () => {
      if (this.activeColumn === 'levels') {
        if (this.levelSelectedIndex > 0) {
          this.levelSelectedIndex--;
          this.updateHighlights();
        }
      } else {
        if (this.exerciseSelectedIndex > 0) {
          this.exerciseSelectedIndex--;
          this.updateHighlights();
        }
      }
    });

    this.input.keyboard.on('keydown-DOWN', () => {
      if (this.activeColumn === 'levels') {
        if (this.levelSelectedIndex < this.levelItems.length - 1) {
          this.levelSelectedIndex++;
          this.updateHighlights();
        }
      } else {
        if (this.exerciseSelectedIndex < this.exerciseItems.length - 1) {
          this.exerciseSelectedIndex++;
          this.updateHighlights();
        }
      }
    });

    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.activeColumn === 'levels') {
        const selectedLevel = this.levelItems[this.levelSelectedIndex];
        this.handleItemClick(selectedLevel);
      } else if (this.activeColumn === 'exercises') {
        const selectedExercise = this.exerciseItems[this.exerciseSelectedIndex];
        this.handleExerciseClick(selectedExercise);
      }
    });
  }

  async handleItemClick(name) {
    try {
      console.log(`Dohvatam level '${name}'...`);

      const levelDoc = await getDocument("levels", name);

      if (!levelDoc.exists()) {
        console.error(`Level '${name}' ne postoji!`);
        alert(`Level '${name}' nije pronađen.`);
        return;
      }

      const levelData = levelDoc.data();
      console.log(`Level '${name}' pronađen:`, levelData);

      this.scene.start('high-score-level', { name });
    } catch (error) {
      console.error("Greška pri dohvaćanju levela:", error);
      alert("Check console for error.");
    }
  }

  async handleExerciseClick(name) {
    try {
      console.log(`Dohvatam exercise '${name}'...`);
      this.scene.start('high-score-exercise', { name });
    } catch (error) {
      console.error("Greška pri dohvaćanju exercise:", error);
      alert("Check console for error.");
    }
  }
}
