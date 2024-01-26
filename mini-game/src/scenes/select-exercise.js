import MenuScene from "./menu";
import {setObject} from '../services/localStorage';
import {getDocuments} from "../services/firebase/db";

export default class SelectExerciseScene extends MenuScene {
  execises;

  constructor() {
    super([], 'train');
  }

  create() {
    super.create();

    this.loadExercises();
  }

  update() {
    super.update();
  } 

  async loadExercises() {
    const list = await getDocuments('exercise');
    this.execises = Object.fromEntries(
      list
        .docs
        .map(doc => [
          doc.id,
          doc.data().data,
        ])
    );
    this.items = Object.keys(this.execises);
    this.createItems(24);
  }

  handleItemClick(name) {
    this.scene.start('train-2', {name, data: this.execises[name]})
  }
}