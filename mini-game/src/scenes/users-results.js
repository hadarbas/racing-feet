import MenuScene from "./menu";
import { getDocuments } from "shared/services/firebase/db";

export default class UsersResultsSceneNonValid extends MenuScene {
  constructor() {
    super([], "users-results-non-valid");
    this.results = [];
    this.filteredResults = [];
    this.currentPage = 0;
    this.resultsPerPage = 10;
    this.resultTexts = [];
    this.prevButton = null;
    this.nextButton = null;
    this.pageText = null;
    this.escText = null;
    this.userFilter = "";
    this.levelFilter = "";
    this.userInput = null;
    this.levelInput = null;
    this.maxScrollY = 0; 
  }

  async create() {
    super.create();

    if (localStorage.getItem("name") !== "admin") {
      console.error("Access denied. Only admin can view user results.");
      this.scene.start("main-menu");
      return;
    }
    
    this.scale.on("resize", this.resize, this);
    const centerX = this.scale.width / 2;

    this.add.text(centerX, 70, "Users and Their Results", {
      fontSize: "24px",
      fill: "#fff",
    }).setOrigin(0.5);

    this.userInput = this.add.dom(0, 0, "input");
    this.userInput.node.setAttribute("placeholder", "Search User...");
    this.userInput.node.setAttribute("type", "text");
    this.userInput.node.style.width = "200px";
    this.userInput.node.style.fontSize = "16px";
    this.userInput.setPosition(centerX - 130, 110);

    this.levelInput = this.add.dom(0, 0, "input");
    this.levelInput.node.setAttribute("placeholder", "Search Level / Exercise...");
    this.levelInput.node.setAttribute("type", "text");
    this.levelInput.node.style.width = "200px";
    this.levelInput.node.style.fontSize = "16px";
    this.levelInput.setPosition(centerX + 130, 110);

    this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.userInput.node.addEventListener("keyup", (e) => {
      this.userFilter = e.target.value.toLowerCase();
      this.filterAndDisplayResults();
    });
    

    this.levelInput.node.addEventListener("keyup", (e) => {
      this.levelFilter = e.target.value.toLowerCase();
      this.filterAndDisplayResults();
    });
    

    this.results = await this.getUsersResults();
    this.filterAndDisplayResults();
    //this.createPaginationButtons();

    this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      this.cameras.main.scrollY += deltaY * 0.5;
      this.limitScroll();
    });

    this.input.keyboard.on("keydown-UP", () => {
      this.cameras.main.scrollY -= 30;
      this.limitScroll();
    });

    this.input.keyboard.on("keydown-DOWN", () => {
      this.cameras.main.scrollY += 30;
      this.limitScroll();
    });

    this.input.keyboard.on("keydown-LEFT", () => {
      this.changePage(-1);
    });

    this.input.keyboard.on("keydown-RIGHT", () => {
      this.changePage(1);
    });

    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.start("main-menu");
    });
  }

  async getUsersResults() {
    try {
      const userLevelsSnapshot = await getDocuments("user_levels");
      const userExercisesSnapshot = await getDocuments("user_exercises");

      const levelResults = userLevelsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          resultType: "level",     
          resultName: data.level,  
        };
      });

      const exerciseResults = userExercisesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          resultType: "exercise",      
          resultName: data.exercise,  
        };
      });

      const mergedResults = levelResults.concat(exerciseResults);
      return mergedResults.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error("Error fetching user results:", error);
      return [];
    }
  }

  filterAndDisplayResults() {
    const userSearch = this.userFilter;
    const levelSearch = this.levelFilter;



    this.filteredResults = this.results.filter(({ user, resultName }) => {
      const matchUser = userSearch.length < 3 || user.toLowerCase().includes(userSearch);
      const matchResult = levelSearch.length < 3 || resultName.toLowerCase().includes(levelSearch);
      return matchUser && matchResult;
    });

    this.currentPage = 0;
    this.displayFilteredResults();
    this.updatePageText();
  }

  displayFilteredResults() {
    if (!this.resultTexts) this.resultTexts = [];
    this.resultTexts.forEach((text) => text.destroy());
    this.resultTexts = [];

    const centerX = this.cameras.main.width / 2;
    let yOffset = 150;

    const referenceWidth = 3840;
    const referenceHeight = 2160;
    const scaleFactor = Math.min(this.scale.width / referenceWidth, this.scale.height / referenceHeight);

    const columnSpacing = Math.min(1000, Math.round(500 * scaleFactor));
    const columnWidth = Math.min(750, Math.round(350 * scaleFactor));
    const baseFontSize = Math.max(14, Math.round(40 * scaleFactor));
    const headerFontSize = Math.max(16, Math.round(50 * scaleFactor));

    const baseTextStyle = {
      fontSize: `${baseFontSize}px`,
      fill: "#fff",
      wordWrap: { width: columnWidth, useAdvancedWrap: true },
      align: "center"
    };

    const headerStyle = {
      fontSize: `${headerFontSize}px`,
      fill: "#ff0",
      wordWrap: { width: columnWidth, useAdvancedWrap: true },
      align: "center"
    };

    const headerUser = this.add.text(centerX - columnSpacing, yOffset, "User", headerStyle).setOrigin(0.5);
    const headerLevel = this.add.text(centerX, yOffset, "Level / Exercise", headerStyle).setOrigin(0.5);
    const headerScore = this.add.text(centerX + columnSpacing, yOffset, "Score", headerStyle).setOrigin(0.5);
    this.resultTexts.push(headerUser, headerLevel, headerScore);

    const maxHeaderHeight = Math.max(headerUser.height, headerLevel.height, headerScore.height);
    yOffset += maxHeaderHeight + 20;

    // Grupisanje rezultata po useru
    const groupedResults = {};
    this.filteredResults.forEach(item => {
      if (!groupedResults[item.user]) groupedResults[item.user] = [];
      groupedResults[item.user].push(item);
    });

    const sortedUsers = Object.keys(groupedResults).sort((a, b) => a.localeCompare(b));
    let orderedResults = [];
    sortedUsers.forEach(user => {
      const levels = groupedResults[user]
        .filter(item => item.resultType === "level")
        .sort((a, b) => a.timestamp - b.timestamp);
      const exercises = groupedResults[user]
        .filter(item => item.resultType === "exercise")
        .sort((a, b) => a.timestamp - b.timestamp);
      orderedResults = orderedResults.concat(levels, exercises);
    });

    // Paginacija
    const startIdx = this.currentPage * this.resultsPerPage;
    const paginatedResults = orderedResults.slice(startIdx, startIdx + this.resultsPerPage);

    paginatedResults.forEach(({ user, resultType, resultName, score }) => {
      const levelText = resultType === "level"
        ? `${resultName} - level`
        : `${resultName} - exercise`;

      const userText = this.add.text(centerX - columnSpacing, yOffset, user, baseTextStyle).setOrigin(0.5, 0);
      const levelTextObj = this.add.text(centerX, yOffset, levelText, baseTextStyle).setOrigin(0.5, 0);
      const scoreText = this.add.text(centerX + columnSpacing, yOffset, score.toString(), baseTextStyle).setOrigin(0.5, 0);

      this.resultTexts.push(userText, levelTextObj, scoreText);

      const maxRowHeight = Math.max(userText.height, levelTextObj.height, scoreText.height);
      yOffset += maxRowHeight + 15;
    });

    const paddingBelowContent = 200;
    const contentHeight = yOffset;
    const totalContentHeight = contentHeight + paddingBelowContent;
    const scrollHeight = Math.max(totalContentHeight, this.scale.height);

    this.cameras.main.setBounds(0, 0, this.scale.width, scrollHeight);
    this.maxScrollY = Math.max(0, scrollHeight - this.scale.height);

    this.contentHeight = contentHeight;
    this.totalContentHeight = totalContentHeight;
    this.createPaginationButtons();
  }

  createPaginationButtons() {
    console.log(this.cameras.main.width)
    const centerX = this.cameras.main.width / 2;

    const referenceWidth = 1920;
    const referenceHeight = 1080;
    const scaleFactor = Math.min(this.scale.width / referenceWidth, this.scale.height / referenceHeight);

    const columnWidth = Math.round(450 * scaleFactor);
    const headerFontSize = Math.max(15, Math.round(25 * scaleFactor));

    const headerStyle = {
      fontSize: `${headerFontSize}px`,
      fill: "#ff0",
      wordWrap: { width: columnWidth, useAdvancedWrap: true },
      align: "center"
    };

    const spacing = Math.max(150, 150 * scaleFactor);

    if (!this.prevButton || this.prevButton._destroyed || !this.prevButton.scene) {
      this.prevButton = this.add.text(0, 0, "Previous page", headerStyle)
        .setInteractive()
        .setOrigin(0.5)
        .on("pointerdown", () => this.changePage(-1));
    }
    
    if (!this.nextButton || this.nextButton._destroyed || !this.nextButton.scene) {
      this.nextButton = this.add.text(0, 0, "Next page", headerStyle)
        .setInteractive()
        .setOrigin(0.5)
        .on("pointerdown", () => this.changePage(1));
    }    

    if (!this.pageText || this.pageText._destroyed || !this.pageText.scene) {
      this.pageText = this.add.text(0, 0, `${this.currentPage + 1}`, headerStyle).setOrigin(0.5);
    } else if (typeof this.pageText.setText === 'function') {
      this.pageText.setText(`${this.currentPage + 1}`);
    } else {
      this.pageText = this.add.text(0, 0, `${this.currentPage + 1}`, headerStyle).setOrigin(0.5);
    }
    
    

    const pageWidth = this.pageText.width;

    this.prevButton.setX(centerX - pageWidth / 2 - spacing);
    this.pageText.setX(centerX);
    this.nextButton.setX(centerX + pageWidth / 2 + spacing);

    const paddingBelowContent = 50;
    const contentHeight = this.contentHeight || 0;

    const buttonsY = contentHeight + paddingBelowContent;

    this.prevButton.setY(buttonsY);
    this.pageText.setY(buttonsY);
    this.nextButton.setY(buttonsY);

    if (this.escText) this.escText.destroy();
    this.escText = this.add.text(centerX, buttonsY + headerFontSize + 10, "Press ESC to return", headerStyle)
      .setOrigin(0.5);
  }

  changePage(direction) {
    const groupedCount = (() => {
      const grouped = {};
      this.filteredResults.forEach(item => {
        if (!grouped[item.user]) grouped[item.user] = [];
        grouped[item.user].push(item);
      });
      let total = 0;
      Object.keys(grouped).forEach(user => {
        total += grouped[user].length;
      });
      return total;
    })();

    const totalPages = Math.ceil(groupedCount / this.resultsPerPage);
    this.currentPage = (this.currentPage + direction + totalPages) % totalPages;
    this.displayFilteredResults();
    this.updatePageText();
    this.cameras.main.scrollY = 0;
  }

  updatePageText() {
    if (this.pageText) {
      this.pageText.setText(`${this.currentPage + 1}`);
    }
  }

  limitScroll() {
    this.cameras.main.scrollY = Phaser.Math.Clamp(this.cameras.main.scrollY, 0, this.maxScrollY);
  }

  resize() {
    const centerX = this.scale.width / 2;
    const buttonY = this.scale.height - 100;

    this.prevButton.setPosition(centerX - 100, buttonY);
    this.nextButton.setPosition(centerX + 100, buttonY);
    this.pageText.setPosition(centerX, buttonY);
    this.escText.setPosition(centerX - 100, buttonY + 25);

    const contentHeight = this.maxScrollY + this.scale.height;
    this.cameras.main.setBounds(0, 0, this.scale.width, contentHeight);
    this.maxScrollY = Math.max(0, contentHeight - this.scale.height);
  }
}
