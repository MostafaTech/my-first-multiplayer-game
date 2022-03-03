
export interface Player {
  id: string;
  name: string;
  coins: number;
  color: string;
  direction: string;
  x: number;
  y: number;
}

export type BlockAddress = string;

export interface MapData {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  blockedSpaces: {
    [key: BlockAddress]: boolean
  };
}

export interface GameUiElements {
  container: HTMLDivElement;
  playerNameInput: HTMLInputElement;
  playerColorButton: HTMLButtonElement;
}
