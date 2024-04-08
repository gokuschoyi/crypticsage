/* eslint-disable no-unused-expressions */
import { customSeriesDefaultOptions as x } from "lightweight-charts";
var f = Object.defineProperty;
var _ = (o, t, i) => t in o ? f(o, t, { enumerable: !0, configurable: !0, writable: !0, value: i }) : o[t] = i;
var u = (o, t, i) => (_(o, typeof t != "symbol" ? t + "" : t, i), i);
const b = {
  ...x,
  lineWidth: 2
};
function m(o) {
  return Math.floor(o * 0.5);
}
function P(o, t, i = 1, s) {
  const n = Math.round(t * o), r = s ? i : Math.round(i * t), a = m(r);
  return { position: n - a, length: r };
}
function v(o, t, i) {
  const s = Math.round(i * o), n = Math.round(i * t);
  return {
    position: Math.min(s, n),
    length: Math.abs(n - s) + 1
  };
}
class M {
  constructor() {
    u(this, "_data", null);
    u(this, "_options", null);
  }
  draw(t, i) {
    t.useBitmapCoordinateSpace(
      (s) => this._drawImpl(s, i)
    );
  }
  update(t, i) {
    this._data = t, this._options = i;
  }
  _drawImpl(t, i) {
    if (this._data === null || this._data.bars.length === 0 || this._data.visibleRange === null || this._options === null)
      return;
    const s = this._options, n = this._data.bars.map((e) => ({
      x: e.x,
      y: i(e.originalData.value) ?? 0
    })), r = Math.min(this._options.lineWidth, this._data.barSpacing), a = this._data.barSpacing;
    let l;
    a < 30 && a >= 10 ? l = 4 : a < 10 ? l = 2 : l = Math.floor(a * 0.1);
    const p = i(0);
    for (let e = this._data.visibleRange.from; e < this._data.visibleRange.to; e++) {
      const h = n[e], c = P(
        h.x,
        t.horizontalPixelRatio,
        r
      ), d = v(
        p ?? 0,
        h.y,
        t.verticalPixelRatio
      );
      t.context.beginPath(), t.context.fillStyle = s.color, t.context.fillRect(
        c.position,
        d.position,
        c.length,
        d.length
      ), t.context.arc(
        h.x * t.horizontalPixelRatio,
        h.y * t.verticalPixelRatio,
        l,
        0,
        Math.PI * 2
      ), t.context.fill();
    }
  }
}
class B {
  constructor() {
    u(this, "_renderer");
    this._renderer = new M();
  }
  priceValueBuilder(t) {
    return [0, t.value];
  }
  isWhitespace(t) {
    return t.value === void 0;
  }
  renderer() {
    return this._renderer;
  }
  update(t, i) {
    this._renderer.update(t, i);
  }
  defaultOptions() {
    return b;
  }
}
export {
  B as LollipopSeries
};
