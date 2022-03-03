export class KeyPressListener {
  keydownFunction: Function;
  keyupFunction: Function;

  constructor(keyCode: string, callback: Function) {
    let keySafe = true;
    this.keydownFunction = function (event: KeyboardEvent) {
      if (event.code === keyCode) {
        if (keySafe) {
          keySafe = false;
          callback();
        }
      }
    };
    this.keyupFunction = function (event: KeyboardEvent) {
      if (event.code === keyCode) {
        keySafe = true;
      }
    };
    document.addEventListener("keydown", this.keydownFunction as any);
    document.addEventListener("keyup", this.keyupFunction as any);
  }

  unbind() {
    document.removeEventListener("keydown", this.keydownFunction as any);
    document.removeEventListener("keyup", this.keyupFunction as any);
  }
}
