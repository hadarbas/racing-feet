import Phaser from "phaser";
import MenuScene from "./menu";

export default class GlossaryScene extends MenuScene {
    constructor() {
        super([], "glossary");
    }

    create() {
        super.create();

        let startY = 70; // Početna Y koordinata

        // Dodajemo grupu u kojoj će biti sav tekst
        this.content = this.add.container(0, 0);

        // Kontrole
        this.content.add(this.add.text(100, startY, "Glossary - Controls Guide", { fontSize: "30px", fill: "#fff" }));
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

        controls.forEach((text, index) => {
            this.content.add(this.add.text(100, startY + index * 40, text, { fontSize: "24px", fill: "#ddd" }));
        });

        startY += controls.length * 40 + 40;

        // Boje linija
        this.content.add(this.add.text(100, startY, "Glossary - Line Colors", { fontSize: "30px", fill: "#fff" }));
        startY += 50;

        const colors = [
            "🔵 Blue Line - Wheel trail",
            "🟢 Green Line - Gas trail",
            "🔴 Red Line - Brakes trail",
        ];

        colors.forEach((text, index) => {
            this.content.add(this.add.text(100, startY + index * 40, text, { fontSize: "24px", fill: "#ddd" }));
        });

        startY += colors.length * 40 + 40;

        // Scoring sistem
        this.content.add(this.add.text(100, startY, "Glossary - Scoring System", { fontSize: "30px", fill: "#fff" }));
        startY += 50;

        const scoring = [
            "⭐ - Fail",
            "⭐⭐ - Bad Performance",
            "⭐⭐⭐ - OK",
            "⭐⭐⭐⭐ - Great Performance",
            "⭐⭐⭐⭐⭐ - Perfect Performance",
        ];

        scoring.forEach((text, index) => {
            this.content.add(this.add.text(100, startY + index * 40, text, { fontSize: "24px", fill: "#ddd" }));
        });

        startY += scoring.length * 40 + 40;

        // ESC tekst
        this.content.add(this.add.text(100, startY, "Press ESC to return", { fontSize: "20px", fill: "#ff0" }));

        // *** PODEŠAVANJE SCROLLING SISTEMA ***
        this.maxScrollY = Math.max(0, startY - this.scale.height + 100); // Maksimalni scroll

        // Scroll pomoću točkića miša
        this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
            this.cameras.main.scrollY += deltaY * 0.5;
            this.limitScroll();
        });

        // Scroll pomoću strelica ↑ ↓
        this.input.keyboard.on("keydown-UP", () => {
            this.cameras.main.scrollY -= 30;
            this.limitScroll();
        });

        this.input.keyboard.on("keydown-DOWN", () => {
            this.cameras.main.scrollY += 30;
            this.limitScroll();
        });

        // ESC za povratak u meni
        this.input.keyboard.on("keydown-ESC", () => {
            this.scene.start("main-menu");
        });
    }

    limitScroll() {
        // Ograničava kretanje kamere da ne ide izvan sadržaja
        this.cameras.main.scrollY = Phaser.Math.Clamp(this.cameras.main.scrollY, 0, this.maxScrollY);
    }
}
