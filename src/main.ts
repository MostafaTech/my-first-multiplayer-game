import { getAuth, signInAnonymously } from 'firebase/auth'
import {
  getDatabase, DatabaseReference,
  onDisconnect as onRefDisconnect, onValue as onRefValue, onChildAdded as onRefChildAdded, onChildRemoved as onRefChildRemoved,
  ref as firebaseRef, set as refSet, update as refUpdate, remove as refRemove
} from 'firebase/database'
import { app as firebaseApp } from './firebase'
import { KeyPressListener } from './utils/KeyPressListener'
import { createName, getKeyString, randomFromArray } from './utils/helpers'
import { isSolid, getRandomSafeSpot } from './map'
import { Player } from './types/models'
import './style.css'

// Options for Player Colors... these are in the same order as our sprite sheet
const playerColors = ["blue", "red", "orange", "yellow", "green", "purple"];

(function () {

  let playerId: string;
  let playerRef: DatabaseReference;
  let players: { [key: string]: Player } = {};
  let playerElements: { [key: string]: HTMLDivElement } = {};
  let coins: any = {};
  let coinElements: any = {};

  const gameContainer = document.querySelector<HTMLDivElement>(".game-container")!;
  const playerNameInput = document.querySelector<HTMLInputElement>("#player-name")!;
  const playerColorButton = document.querySelector<HTMLButtonElement>("#player-color")!;

  const firebaseDb = getDatabase(firebaseApp)
  const firebaseAuth = getAuth(firebaseApp)

  function placeCoin() {
    const { x, y } = getRandomSafeSpot();
    const coinRef = firebaseRef(firebaseDb, `coins/${getKeyString(x, y)}`);
    refSet(coinRef, {
      x,
      y,
    })

    const coinTimeouts = [2000, 3000, 4000, 5000];
    setTimeout(() => {
      placeCoin();
    }, randomFromArray(coinTimeouts));
  }

  function attemptGrabCoin(x: number, y: number) {
    const key = getKeyString(x, y);
    if (coins[key]) {
      // Remove this key from data, then uptick Player's coin count
      refRemove(firebaseRef(firebaseDb, `coins/${key}`));
      refUpdate(playerRef, {
        coins: players[playerId].coins + 1,
      })
    }
  }


  function handleArrowPress(xChange: number = 0, yChange: number = 0) {
    const newX = players[playerId].x + xChange;
    const newY = players[playerId].y + yChange;
    if (!isSolid(newX, newY)) {
      //move to the next space
      players[playerId].x = newX;
      players[playerId].y = newY;
      if (xChange === 1) {
        players[playerId].direction = "right";
      }
      if (xChange === -1) {
        players[playerId].direction = "left";
      }
      refSet(playerRef, players[playerId]);
      attemptGrabCoin(newX, newY);
    }
  }

  function initGame() {

    new KeyPressListener("ArrowUp", () => handleArrowPress(0, -1))
    new KeyPressListener("ArrowDown", () => handleArrowPress(0, 1))
    new KeyPressListener("ArrowLeft", () => handleArrowPress(-1, 0))
    new KeyPressListener("ArrowRight", () => handleArrowPress(1, 0))

    const allPlayersRef = firebaseRef(firebaseDb, `players`);
    const allCoinsRef = firebaseRef(firebaseDb, `coins`);

    onRefValue(allPlayersRef, (snapshot) => {
      //Fires whenever a change occurs
      players = snapshot.val() || {};
      Object.keys(players).forEach((key) => {
        const characterState = players[key];
        let el = playerElements[key];
        // Now update the DOM
        el.querySelector<HTMLDivElement>(".Character_name")!.innerText = characterState.name;
        el.querySelector<HTMLDivElement>(".Character_coins")!.innerText = characterState.coins.toString();
        el.setAttribute("data-color", characterState.color);
        el.setAttribute("data-direction", characterState.direction);
        const left = 16 * characterState.x + "px";
        const top = 16 * characterState.y - 4 + "px";
        el.style.transform = `translate3d(${left}, ${top}, 0)`;
      })
    })
    onRefChildAdded(allPlayersRef, (snapshot) => {
      //Fires whenever a new node is added the tree
      const addedPlayer = snapshot.val();
      const characterElement = document.createElement("div");
      characterElement.classList.add("Character", "grid-cell");
      if (addedPlayer.id === playerId) {
        characterElement.classList.add("you");
      }
      characterElement.innerHTML = (`
        <div class="Character_shadow grid-cell"></div>
        <div class="Character_sprite grid-cell"></div>
        <div class="Character_name-container">
          <span class="Character_name"></span>
          <span class="Character_coins">0</span>
        </div>
        <div class="Character_you-arrow"></div>
      `);
      playerElements[addedPlayer.id] = characterElement;

      //Fill in some initial state
      characterElement.querySelector<HTMLDivElement>(".Character_name")!.innerText = addedPlayer.name;
      characterElement.querySelector<HTMLDivElement>(".Character_coins")!.innerText = addedPlayer.coins;
      characterElement.setAttribute("data-color", addedPlayer.color);
      characterElement.setAttribute("data-direction", addedPlayer.direction);
      const left = 16 * addedPlayer.x + "px";
      const top = 16 * addedPlayer.y - 4 + "px";
      characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
      gameContainer.appendChild(characterElement);
    })

    //Remove character DOM element after they leave
    onRefChildRemoved(allPlayersRef, (snapshot) => {
      const removedKey = snapshot.val().id;
      gameContainer.removeChild(playerElements[removedKey]);
      delete playerElements[removedKey];
    })


    onRefChildAdded(allCoinsRef, (snapshot) => {
      const coin = snapshot.val();
      const key = getKeyString(coin.x, coin.y);
      coins[key] = true;

      // Create the DOM Element
      const coinElement = document.createElement("div");
      coinElement.classList.add("Coin", "grid-cell");
      coinElement.innerHTML = `
        <div class="Coin_shadow grid-cell"></div>
        <div class="Coin_sprite grid-cell"></div>
      `;

      // Position the Element
      const left = 16 * coin.x + "px";
      const top = 16 * coin.y - 4 + "px";
      coinElement.style.transform = `translate3d(${left}, ${top}, 0)`;

      // Keep a reference for removal later and add to DOM
      coinElements[key] = coinElement;
      gameContainer.appendChild(coinElement);
    })
    onRefChildRemoved(allCoinsRef, (snapshot) => {
      const { x, y } = snapshot.val();
      const keyToRemove = getKeyString(x, y);
      gameContainer.removeChild(coinElements[keyToRemove]);
      delete coinElements[keyToRemove];
    })

    //Updates player name with text input
    playerNameInput.addEventListener("change", (e: any) => {
      const newName = e.target.value || createName();
      playerNameInput.value = newName;
      refUpdate(playerRef, {
        name: newName
      })
    })

    //Update player color on button click
    playerColorButton.addEventListener("click", () => {
      const mySkinIndex = playerColors.indexOf(players[playerId].color);
      const nextColor = playerColors[mySkinIndex + 1] || playerColors[0];
      refUpdate(playerRef, {
        color: nextColor
      })
    })

    //Place my first coin
    placeCoin();

  }

  firebaseAuth.onAuthStateChanged((user) => {
    console.log(user)
    if (user) {
      //You're logged in!
      playerId = user.uid;
      playerRef = firebaseRef(firebaseDb, `players/${playerId}`);

      const name = createName();
      playerNameInput!.value = name;

      const { x, y } = getRandomSafeSpot();


      refSet(playerRef, {
        id: playerId,
        name,
        direction: "right",
        color: randomFromArray(playerColors),
        x,
        y,
        coins: 0,
      })

      //Remove me from Firebase when I diconnect
      onRefDisconnect(playerRef).remove();

      //Begin the game now that we are signed in
      initGame();
    } else {
      //You're logged out.
    }
  })

  signInAnonymously(firebaseAuth).catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    // ...
    console.log(errorCode, errorMessage);
  });


})();
