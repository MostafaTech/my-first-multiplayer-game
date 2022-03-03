import {
  Database, DatabaseReference,
  ref as firebaseRef, set as refSet, update as refUpdate, remove as refRemove,
  onValue as onRefValue, onChildAdded as onRefChildAdded, onChildRemoved as onRefChildRemoved,
  onDisconnect as onRefDisconnect,
} from 'firebase/database'
import { isSolid, getRandomSafeSpot } from './map'
import { KeyPressListener } from './utils/KeyPressListener'
import { createName, getBlockAddress, randomFromArray, createElement } from './utils/helpers'
import { Player, GameUiElements } from './types/models'
import { playerColors } from './types/consts'

export class Game {

  public playerId: string = '';
  public playerRef?: DatabaseReference;
  public players: { [key: string]: Player } = {};
  playerElements: { [key: string]: HTMLElement } = {};
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
        this.updatePlayerElement(characterState);
      })
    })
    onRefChildAdded(allPlayersRef, (snapshot) => {
      //Fires whenever a new node is added the tree
      const addedPlayer = snapshot.val();
      const characterElement = this.createPlayerElement(addedPlayer)
      this.playerElements[addedPlayer.id] = characterElement;
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
      const key = getBlockAddress(coin.x, coin.y);
      this.coins[key] = true;

      const coinElement = this.createCoinElement(coin, key);
      this.coinElements[key] = coinElement;
      this.uiElements.container.appendChild(coinElement);
    })
    onRefChildRemoved(allCoinsRef, (snapshot) => {
      const { x, y } = snapshot.val();
      const keyToRemove = getBlockAddress(x, y);
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
    const coinRef = firebaseRef(this.firebaseDb, `coins/${getBlockAddress(x, y)}`);
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
    const key = getBlockAddress(x, y);
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

  private createPlayerElement(player: any) {
    const cssClasses = ["Character", "grid-cell"]
    if (player.id === this.playerId) {
      cssClasses.push("you");
    }
    const attrs = {
      "data-color": player.color,
      "data-direction": player.direction
    };
    const innerHTML = (`
      <div class="Character_shadow grid-cell"></div>
      <div class="Character_sprite grid-cell"></div>
      <div class="Character_name-container">
        <span class="Character_name">${player.name}</span>
        <span class="Character_coins">${player.coins}</span>
      </div>
      <div class="Character_you-arrow"></div>
    `);
    const left = 16 * player.x;
    const top = 16 * player.y - 4;
    return createElement("div", `player-${player.id}`,
      cssClasses, attrs, innerHTML, left, top);
  }

  private updatePlayerElement(player: any) {
    const el = this.playerElements[player.id];
    // Now update the DOM
    el.querySelector<HTMLDivElement>(".Character_name")!.innerText = player.name;
    el.querySelector<HTMLDivElement>(".Character_coins")!.innerText = player.coins.toString();
    el.setAttribute("data-color", player.color);
    el.setAttribute("data-direction", player.direction);
    const left = 16 * player.x + "px";
    const top = 16 * player.y - 4 + "px";
    el.style.transform = `translate3d(${left}, ${top}, 0)`;
  }

  private createCoinElement(coin: any, key: string) {
    const innerHTML = `
      <div class="Coin_shadow grid-cell"></div>
      <div class="Coin_sprite grid-cell"></div>
    `;
    const left = 16 * coin.x;
    const top = 16 * coin.y - 4;
    return createElement("div", `coin-${key}`, ["Coin", "grid-cell"], null, innerHTML, left, top);
  }

}
