// @flow

/* eslint-disable import/no-duplicates */
import {
  loadImageData,
  checkPixelDensity,
  checkSrcsetWidthAccuracy,
} from '../src/presbyopia';
import type {ImageData} from '../src/presbyopia';
/* eslint-enable import/no-duplicates */

const WIDTH = 1732;
const IMAGE = `melbourne-${WIDTH}.jpg`;

const WIDTH2 = 866;
const IMAGE2 = `melbourne-${WIDTH2}.jpg`;

function testWithInnerHTML(
  innerHTML: string,
  callback: (imageData: ImageData) => any
) {
  const div = document.createElement('div');
  document.body.appendChild(div);
  div.innerHTML = innerHTML;
  const img = div.children[0];
  img.addEventListener('load', () => {
    loadImageData(img).then(callback).then(() => {
      // comment out this to leave the image in the page
      div.remove();
    });
  });
}

describe('presbyopia', () => {
  describe('checkPixelDensity', () => {
    it('detects images that are way too big', done => {
      testWithInnerHTML(`
        <img
          src='${IMAGE}'
          style='width: 100px;'
        >
      `, imageData => {
        const errors = checkPixelDensity(imageData);
        expect(errors[0]).toContain('> 2');
        done();
      });
    });

    it('detects images that are stretched', done => {
      testWithInnerHTML(`
        <img
          src='${IMAGE}'
          style='width: ${WIDTH * 1.1}px;'
        >
      `, imageData => {
        const errors = checkPixelDensity(imageData);
        expect(errors[0]).toContain('< 1');
        done();
      });
    });

    it("doesn't error on images that are just right", done => {
      // TODO(dmnd): Mock window.devicePixelRatio and split this into two tests
      testWithInnerHTML(`
        <img
          src='${IMAGE}'
          style='width: ${WIDTH / window.devicePixelRatio}px;'
        >
      `, imageData => {
        const errors = checkPixelDensity(imageData);
        expect(errors.length).toBe(0);
        done();
      });
    });

    it('ignores svgs', done => {
      testWithInnerHTML(`
        <img
          src='circle.svg'
          style='width: 1000px'
        >
      `, imageData => {
        const errors = checkPixelDensity(imageData);
        expect(errors.length).toBe(0);
        done();
      });
    });
  });

  describe('checkSrcsetWidthAccuracy', () => {
    it('detects inconsistent srcset and image width', done => {
      testWithInnerHTML(`
        <img
          src='${IMAGE}'
          srcset='${IMAGE} ${WIDTH + 1}w'
          style='width: ${WIDTH};'
          sizes='${WIDTH}px'
        >
      `, (imageData: ImageData) => {
        const errors = checkSrcsetWidthAccuracy(imageData);
        expect(errors[0]).toContain('srcset attribute claims width');
        done();
      });
    });

    it('ignores consistent srcset and image width', done => {
      testWithInnerHTML(`
        <img
          src='${IMAGE}'
          srcset='${IMAGE} ${WIDTH}w'
          style='width: ${WIDTH};'
          sizes='${WIDTH}px'
        >
      `, imageData => {
        const errors = checkSrcsetWidthAccuracy(imageData);
        expect(errors.length).toBe(0);
        done();
      });
    });

    it('detects multiple inconsistencies', done => {
      testWithInnerHTML(`
        <img
          src='${IMAGE}'
          srcset='${IMAGE2} ${WIDTH2 - 1}w, ${IMAGE} ${WIDTH + 1}w'
          style='width: ${WIDTH};'
          sizes='${WIDTH}px'
        >
      `, imageData => {
        const errors = checkSrcsetWidthAccuracy(imageData);
        expect(errors.length).toBe(2);
        done();
      });
    });
  });
});
