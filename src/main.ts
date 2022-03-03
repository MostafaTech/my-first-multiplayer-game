import { getDatabase } from 'firebase/database'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { app as firebaseApp } from './firebase'
import { createName } from './utils/helpers'
import { GameUiElements } from './types/models'
import { Game } from './Game'
import './style.css'

(function () {

  const uiElements: GameUiElements = {
    container: document.querySelector<HTMLDivElement>(".game-container")!,
    playerNameInput: document.querySelector<HTMLInputElement>("#player-name")!,
    playerColorButton: document.querySelector<HTMLButtonElement>("#player-color")!,
  }

  const firebaseDb = getDatabase(firebaseApp)
  const firebaseAuth = getAuth(firebaseApp)
  const game = new Game(firebaseDb, uiElements)

  firebaseAuth.onAuthStateChanged((user) => {
    console.log(user)
    if (user) {
      const name = createName();
      uiElements.playerNameInput!.value = name;
      // register the user
      game.registerPlayer(user.uid, name);
      //Begin the game now that we are signed in
      game.start();
    } else {
      //You're logged out.
    }
  });

  signInAnonymously(firebaseAuth).catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    // ...
    console.log(errorCode, errorMessage);
  });

})();
