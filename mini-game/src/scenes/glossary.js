import Phaser from "phaser";
import MenuScene from "./menu";

export default class GlossaryScene extends MenuScene {
    constructor() {
        super([], "glossary");
    }

    create() {
        super.create();

        let startY = 70;

        this.content = this.add.container(0, 0);

        this.content.add(this.add.text(100, startY, "Glossary - Controls Guide", { fontSize: this.getFontSize(), fill: "#fff" }));
        startY += 50;

        const controls = [
            "🟢 FULL GAS - Start Exercise / Retry",
            "🔴 FULL BRAKE - Return to Main Menu",
            "⚪ RELEASE ALL PEDALS - Continue / Return to Results Menu",
            "⏸️ ESC key - Return to Main Menu",
            "🗑️ DELETE key - Delete a Level or Exercise",
            "⬆️ UP ARROW key- Move up through the Menu",
            "⬇️ DOWN ARROW key - Move down through the Menu"
        ];

        const spacing = this.getLineSpacing()

        controls.forEach((text, index) => {
            this.content.add(this.add.text(100, startY + index * spacing, text, { fontSize: this.getFontSize(), fill: "#ddd" }));
        });

        startY += controls.length * spacing + spacing;

        this.content.add(this.add.text(100, startY, "Glossary - Line Colors", { fontSize: this.getFontSize(), fill: "#fff" }));
        startY += 50;

        const colors = [
            "🔵 Blue Line - Wheel trail",
            "🟢 Green Line - Gas trail",
            "🔴 Red Line - Brakes trail",
        ];

        colors.forEach((text, index) => {
            this.content.add(this.add.text(100, startY + index * spacing, text, { fontSize: this.getFontSize(), fill: "#ddd" }));
        });

        startY += colors.length * spacing + spacing;

        this.content.add(this.add.text(100, startY, "Glossary - Scoring System", { fontSize: this.getFontSize(), fill: "#fff" }));
        startY += 50;

        const scoring = [
            "⭐ - Fail",
            "⭐⭐ - Bad Performance",
            "⭐⭐⭐ - OK",
            "⭐⭐⭐⭐ - Great Performance",
            "⭐⭐⭐⭐⭐ - Perfect Performance",
        ];

        scoring.forEach((text, index) => {
            this.content.add(this.add.text(100, startY + index * spacing, text, { fontSize: this.getFontSize(), fill: "#ddd" }));
        });

        startY += scoring.length * spacing + spacing;

        this.content.add(this.add.text(100, startY, "Press ESC to return", { fontSize: this.getFontSize(), fill: "#ff0" }));

        this.maxScrollY = Math.max(0, startY - this.scale.height + 100);

        this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
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

        this.input.keyboard.on("keydown-ESC", () => {
            this.scene.start("main-menu");
        });

        window.addEventListener('resize', this.resizeText.bind(this));

        this.resizeText();
    }

    getLineSpacing() {
        const baseSpacing = 40;
        const scaleFactor = this.scale.height / 1080; 
        return Math.max(baseSpacing, baseSpacing * scaleFactor);
    }
    

    getFontSize() {
        const baseFontSize = 30;
        const scaleFactor = this.scale.width / 1920; 
        return `${baseFontSize * scaleFactor}px`; 
    }

    resizeText() {
        if (this.content && this.content.list) {
            this.content.list.forEach(textObject => {
                textObject.setStyle({ fontSize: this.getFontSize() });
            });
        }
    }

    limitScroll() {
        this.cameras.main.scrollY = Phaser.Math.Clamp(this.cameras.main.scrollY, 0, this.maxScrollY);
    }
}
