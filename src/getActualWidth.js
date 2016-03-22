// @flow
/**
 * Get actual natural width of image before corrections made for pixel density.
 */
const _cache = {};
export default function getActualWidth(
  url: string,
  cb: (width: number) => void
) {
  if (url in _cache) {
    setTimeout(() => cb(_cache[url]), 0);
  }
  const img = new Image();
  img.onload = () => {
    _cache[url] = img.naturalWidth;
    cb(_cache[url]);
  };
  img.src = url;
}
