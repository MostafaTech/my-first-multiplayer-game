import {
  Database, DatabaseReference,
  ref as firebaseRef, set as refSet, update as refUpdate, remove as refRemove,
  onValue as onRefValue, onChildAdded as onRefChildAdded, onChildRemoved as onRefChildRemoved,
  onDisconnect as onRefDisconnect,
} from 'firebase/database'
import { isSolid, getRandomSafeSpot } from './map'
import { KeyPressListener } from './utils/KeyPressListener'
import { createName, getKeyString, randomFromArray } from './utils/helpers'
import { Player, GameUiElements } from './types/models'
import { playerColors } from './types/consts'

export class Game {

  public playerId: string = '';
  public playerRef?: DatabaseReference;
  public players: { [key: string]: Player } = {};
  playerElements: { [key: string]: HTMLDivElement } = {};
  public coins: any = {};
  coinElements: any = {};

  constructor(
    private firebaseDb: Database,
    private uiElements: GameUiElements
  ) {
  }

  public start() {

    new KeyPressListener("ArrowUp", () => this.handleArrowPress(0, -1))
    new KeyPressListener("ArrowDown", () => this.handleArrowPress(0, 1))
    new KeyPressListener("ArrowLeft", () => this.handleArrowPress(-1, 0))
    new KeyPressListener("ArrowRight", () => this.handleArrowPress(1, 0))

    const allPlayersRef = firebaseRef(this.firebaseDb, `players`);
    const allCoinsRef = firebaseRef(this.firebaseDb, `coins`);

    onRefValue(allPlayersRef, (snapshot) => {
      //Fires whenever a change occurs
      this.players = snapshot.val() || {};
      Object.keys(this.players).forEach((key) => {
        const characterState = this.players[key];
        let el = this.playerElements[key];
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
      if (addedPlayer.id === this.playerId) {
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
      this.playerElements[addedPlayer.id] = characterElement;

      //Fill in some initial state
      characterElement.querySelector<HTMLDivElement>(".Character_name")!.innerText = addedPlayer.name;
      characterElement.querySelector<HTMLDivElement>(".Character_coins")!.innerText = addedPlayer.coins;
      characterElement.setAttribute("data-color", addedPlayer.color);
      characterElement.setAttribute("data-direction", addedPlayer.direction);
      const left = 16 * addedPlayer.x + "px";
      const top = 16 * addedPlayer.y - 4 + "px";
      characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
      this.uiElements.container.appendChild(characterElement);
    })

    //Remove character DOM element after they leave
    onRefChildRemoved(allPlayersRef, (snapshot) => {
      const removedKey = snapshot.val().id;
      this.uiElements.container.removeChild(this.playerElements[removedKey]);
      delete this.playerElements[removedKey];
    })

    onRefChildAdded(allCoinsRef, (snapshot) => {
      const coin = snapshot.val();
      const key = getKeyString(coin.x, coin.y);
      this.coins[key] = true;

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
      this.coinElements[key] = coinElement;
      this.uiElements.container.appendChild(coinElement);
    })
    onRefChildRemoved(allCoinsRef, (snapshot) => {
      const { x, y } = snapshot.val();
      const keyToRemove = getKeyString(x, y);
      this.uiElements.container.removeChild(this.coinElements[keyToRemove]);
      delete this.coinElements[keyToRemove];
    })

    //Updates player name with text input
    this.uiElements.playerNameInput.addEventListener("change", (e: any) => {
      const newName = e.target.value || createName();
      this.uiElements.playerNameInput.value = newName;
      refUpdate(this.playerRef!, {
        name: newName
      })
    })

    //Update player color on button click
    this.uiElements.playerColorButton.addEventListener("click", () => {
      const mySkinIndex = playerColors.indexOf(this.players[this.playerId].color);
      const nextColor = playerColors[mySkinIndex + 1] || playerColors[0];
      refUpdate(this.playerRef!, {
        color: nextColor
      })
    })

    //Place my first coin
    this.placeCoin();

  }

  public registerPlayer(uid: string, name: string) {
    //You're logged in!
    this.playerId = uid;
    this.playerRef = firebaseRef(this.firebaseDb, `players/${uid}`);

    // find a safe and random place for the user
    const { x, y } = getRandomSafeSpot();

    refSet(this.playerRef!, {
      id: this.playerId,
      name,
      direction: "right",
      color: randomFromArray(playerColors),
      x,
      y,
      coins: 0,
    })

    //Remove me from Firebase when I diconnect
    onRefDisconnect(this.playerRef!).remove();
  }

  private placeCoin() {
    const { x, y } = getRandomSafeSpot();
    const coinRef = firebaseRef(this.firebaseDb, `coins/${getKeyString(x, y)}`);
    refSet(coinRef, {
      x,
      y,
    })

    const coinTimeouts = [2000, 3000, 4000, 5000];
    setTimeout(() => {
      this.placeCoin();
    }, randomFromArray(coinTimeouts));
  }

  private attemptGrabCoin(x: number, y: number) {
    const key = getKeyString(x, y);
    if (this.coins[key]) {
      // Remove this key from data, then uptick Player's coin count
      refRemove(firebaseRef(this.firebaseDb, `coins/${key}`));
      refUpdate(this.playerRef!, {
        coins: this.players[this.playerId].coins + 1,
      })
    }
  }

  private handleArrowPress(xChange: number = 0, yChange: number = 0) {
    const newX = this.players[this.playerId].x + xChange;
    const newY = this.players[this.playerId].y + yChange;
    if (!isSolid(newX, newY)) {
      //move to the next space
      this.players[this.playerId].x = newX;
      this.players[this.playerId].y = newY;
      if (xChange === 1) {
        this.players[this.playerId].direction = "right";
      }
      if (xChange === -1) {
        this.players[this.playerId].direction = "left";
      }
      refSet(this.playerRef!, this.players[this.playerId]);
      this.attemptGrabCoin(newX, newY);
    }
  }

}
