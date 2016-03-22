import {checkImage} from './presbyopia';

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    [...document.getElementsByTagName('img')].forEach(checkImage);
  }, 2000);
});
