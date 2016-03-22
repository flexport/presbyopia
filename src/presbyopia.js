// @flow

type widthMap = {[key: string]: number};
export type ImageData = {
  srcset: widthMap,
  actualWidths: widthMap,
  element: any,
}

import dd from 'dedent';
import getActualWidth from './getActualWidth';

export function getPhysicalPxs(dips: number): number {
  const dpr = window.devicePixelRatio || 1;
  return dips * dpr;
}

/**
 * Convert a relative URL to an absolute URL based upon browser context.
 */
const getAbsoluteUrl = (function getAbsoluteUrlOuter() {
  let a;
  return function getAbsoluteUrlInner(url: string): string {
    if (!a) {
      a = document.createElement('a');
    }
    a.href = url;
    return a.href;
  };
}());

function parseSrcset(srcset: string): widthMap {
  return srcset.trim().split(',').reduce((set, src) => {
    const [url, width] = src.trim().split(' ');
    if (width.slice(-1) !== 'w') {
      return set;
    }
    const w = parseInt(width.slice(0, -1), 10);
    set[getAbsoluteUrl(url)] = w; // eslint-disable-line no-param-reassign
    return set;
  }, {});
}

export function checkSrcsetWidthAccuracy(imageData: ImageData): Array<string> {
  const {srcset} = imageData;
  const errors = [];
  for (const src of Object.keys(srcset)) {
    const claimedWidth = srcset[src];
    const actualWidth = imageData.actualWidths[src];
    if (actualWidth !== claimedWidth) {
      errors.push(dd`
        srcset attribute claims width of ${claimedWidth} but image natural \
        width is ${actualWidth}.
      `);
    }
  }
  return errors;
}

export function checkPixelDensity(imageData: ImageData): Array<string> {
  const {currentSrc} = imageData.element;
  if (currentSrc.endsWith('.svg')) {
    return [];
  }
  const physicalWidth = getPhysicalPxs(imageData.element.width);
  const actualWidth = imageData.actualWidths[currentSrc];
  const density = actualWidth / physicalWidth;
  const errors = [];
  if (density < 1) {
    errors.push(dd`
      ${actualWidth}px image is stretched to ${physicalWidth}px and likely \
      looks blurry (pixel density ${density.toFixed(2)} < 1). Use a bigger \
      image instead.
    `);
  }
  if (density > 2) {
    errors.push(dd`
      ${actualWidth}px image is wastefully downsized to ${physicalWidth}px \
      (pixel density ${density.toFixed(2)} > 2). Use a smaller image for a \
      faster download.
    `);
  }
  return errors;
}

function checkImageData(imageData: ImageData): void {
  const errors = [];

  errors.push(...checkPixelDensity(imageData));
  errors.push(...checkSrcsetWidthAccuracy(imageData));

  for (const e of errors) {
    console.error(e, imageData.element); // eslint-disable-line no-console
  }
}

export function loadImageData(element: any): Promise<ImageData> {
  const srcs = new Set();
  srcs.add(element.src);

  let srcset = {};
  if (element.hasAttribute('srcset')) {
    srcset = parseSrcset(element.srcset);
    Object.keys(srcset).forEach(src => srcs.add(src));
  }

  return Promise.all(Array.from(srcs, src =>
    new Promise(resolve => getActualWidth(src, width => resolve([src, width])))
  )).then(actualWidths => ({
    element,
    srcset,
    actualWidths: actualWidths.reduce((obj, [src, width]) => {
      obj[src] = width; // eslint-disable-line no-param-reassign
      return obj;
    }, {}),
  }));
}

export function checkImage(img: any): void {
  loadImageData(img).then(checkImageData);
}
