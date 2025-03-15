import Phaser from "phaser";
import MenuScene from "./menu";

export default class GlossaryScene extends MenuScene {
    constructor() {
        super([], 'glossary');
    }

    create() {
        super.create();

        this.add.text(100, 50, "Glossary - Controls Guide", { fontSize: "32px", fill: "#fff" });

        const controls = [
            "➡️ Right Arrow - Steer Right",
            "⬅️ Left Arrow - Steer Left",
            "⬆️ Up Arrow - Accelerate",
            "⬇️ Down Arrow - Brake",
            "🅿️ Space - Pause"
        ];

        controls.forEach((text, index) => {
            this.add.text(100, 100 + index * 40, text, { fontSize: "24px", fill: "#ddd" });
        });

        this.add.text(100, 350, "Press ESC to return", { fontSize: "20px", fill: "#ff0" });

        this.input.keyboard.on("keydown-ESC", () => {
            this.scene.start("main-menu");
        });
    }
}
