\`\`\`markdown
# Racing Feet Project

This project consists of three main sub-folders: `mini-game`, `ibt-import`, and `shared`. The `shared` sub-folder contains shared code between the other two projects.

## Getting Started

To get started, you can run `yarn` from the project root. This will install all dependencies and propagate to the sub-folders: `mini-game`, `ibt-import`, and `shared`.

```sh
yarn
```

## Sub-Folders

### mini-game

The `mini-game` sub-folder contains the code for the Racing Feet mini-game. You can start the development server by running:

```sh
yarn start
```

#### Structure

- `src/`
  - `index.js`: Entry point for the Phaser game.
  - `scenes/`: Contains various game scenes such as `main-menu`, `setup`, `train`, etc.
- `public/`
  - `assets/`: Static assets like images and audio files.
  - `index.html`: HTML template for the game.
- `webpack/`
  - `base.js`: Webpack configuration for development.
  - `prod.js`: Webpack configuration for production.

### ibt-import

The `ibt-import` sub-folder contains the code for the IBT Importer tool. You can start the development server by running:

```sh
yarn start
```

#### Structure

- `src/`
  - `index.js`: Entry point for the React application.
  - `App.js`: Main application component.
  - `tabs/`: Contains various tabs such as `IbtToCsv` and `Import`.
  - `tools/`: Utility functions for file loading.
- `public/`
  - `index.html`: HTML template for the application.
- `buffer.js`: Buffer-related utilities.

### shared

The `shared` sub-folder contains shared code between the `mini-game` and `ibt-import` projects.

#### Structure

- `services/`
  - `firebase/`: Firebase-related utilities and configurations.
  - `localStorage.js`: Utility functions for local storage.

## Basic Information

### mini-game

The `mini-game` project is a Phaser-based game that simulates racing. It includes various scenes such as the main menu, setup, training, and more. The game is configured using Webpack for both development and production builds.

### ibt-import

The `ibt-import` project is a React-based tool for importing and converting IBT files to CSV format. It includes various tabs for different functionalities and uses Firebase for data storage.

### shared

The `shared` project contains common utilities and configurations used by both the `mini-game` and `ibt-import` projects. This includes Firebase configurations and local storage utilities.
