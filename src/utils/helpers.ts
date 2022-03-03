import { BlockAddress } from '../types/models'

export function randomFromArray(array: Array<any>) {
  return array[Math.floor(Math.random() * array.length)];
}
export function getBlockAddress(x: number, y: number) {
  return `${x}x${y}` as BlockAddress;
}

export function createName() {
  const prefix = randomFromArray([
    "COOL",
    "SUPER",
    "HIP",
    "SMUG",
    "COOL",
    "SILKY",
    "GOOD",
    "SAFE",
    "DEAR",
    "DAMP",
    "WARM",
    "RICH",
    "LONG",
    "DARK",
    "SOFT",
    "BUFF",
    "DOPE",
  ]);
  const animal = randomFromArray([
    "BEAR",
    "DOG",
    "CAT",
    "FOX",
    "LAMB",
    "LION",
    "BOAR",
    "GOAT",
    "VOLE",
    "SEAL",
    "PUMA",
    "MULE",
    "BULL",
    "BIRD",
    "BUG",
  ]);
  return `${prefix} ${animal}`;
}

export function createElement(tag: string, id: string | null,
  cssClasses: string[] | null, attrs: { [key: string]: any } | null,
  innerHTML: string | null, left: number = 0, top: number = 0) {
  const elm = document.createElement(tag);
  if (id && id.length > 0) {
    elm.id = id;
  }
  if (cssClasses && cssClasses.length > 0) {
    cssClasses.forEach(x => elm.classList.add(x))
  }
  if (attrs && Object.keys(attrs).length > 0) {
    Object.keys(attrs).forEach(k =>
      elm.setAttribute(k, attrs[k]))
  }
  if (innerHTML && innerHTML.length > 0) {
    elm.innerHTML = innerHTML;
  }
  elm.style.transform = `translate3d(${left}px, ${top}px, 0)`;

  return elm;
}
