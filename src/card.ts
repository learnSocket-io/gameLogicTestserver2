export default class Card {
  color: 'white' | 'black';

  value: number;

  constructor(color: 'white' | 'black', value: number) {
    this.color = color;
    this.value = value;
  }
}