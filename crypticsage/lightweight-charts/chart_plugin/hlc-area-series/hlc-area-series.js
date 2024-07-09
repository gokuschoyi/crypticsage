/* eslint-disable no-unused-expressions */
import { customSeriesDefaultOptions as L } from "lightweight-charts";
var w = Object.defineProperty;
var v = (n, t, i) => t in n ? w(n, t, { enumerable: !0, configurable: !0, writable: !0, value: i }) : n[t] = i;
var g = (n, t, i) => (v(n, typeof t != "symbol" ? t + "" : t, i), i);
const P = {
  ...L,
  highLineColor: "#049981",
  lowLineColor: "#F23645",
  closeLineColor: "#878993",
  areaBottomColor: "rgba(242, 54, 69, 0.2)",
  areaTopColor: "rgba(4, 153, 129, 0.2)",
  highLineWidth: 2,
  lowLineWidth: 2,
  closeLineWidth: 2
};
class m {
  constructor() {
    g(this, "_data", null);
    g(this, "_options", null);
  }
  draw(t, i) {
    t.useBitmapCoordinateSpace(
      (l) => this._drawImpl(l, i)
    );
  }
  update(t, i) {
    this._data = t, this._options = i;
  }
  _drawImpl(t, i) {
    if (this._data === null || this._data.bars.length === 0 || this._data.visibleRange === null || this._options === null)
      return;
    const l = this._options, u = this._data.bars.map((o) => ({
      x: o.x * t.horizontalPixelRatio,
      high: i(o.originalData.high) * t.verticalPixelRatio,
      low: i(o.originalData.low) * t.verticalPixelRatio,
      close: i(o.originalData.close) * t.verticalPixelRatio
    })), e = t.context;
    e.beginPath();
    const x = new Path2D(), _ = new Path2D(), h = new Path2D(), s = u[this._data.visibleRange.from];
    x.moveTo(s.x, s.low), _.moveTo(s.x, s.high);
    for (let o = this._data.visibleRange.from + 1; o < this._data.visibleRange.to; o++) {
      const r = u[o];
      x.lineTo(r.x, r.low), _.lineTo(r.x, r.high);
    }
    const a = u[this._data.visibleRange.to - 1];
    a && h.moveTo(a.x, a.close);
    for (let o = this._data.visibleRange.to - 2; o >= this._data.visibleRange.from; o--) {
      const r = u[o];
      h.lineTo(r.x, r.close);
    }
    const c = new Path2D(_);
    a && c.lineTo(a.x, a.close), c.addPath(h), c.lineTo(s.x, s.high), c.closePath(), e.fillStyle = l.areaTopColor, e.fill(c);
    const d = new Path2D(x);
    a && d.lineTo(a.x, a.close), d.addPath(h), d.lineTo(s.x, s.low), d.closePath(), e.fillStyle = l.areaBottomColor, e.fill(d), e.lineJoin = "round", e.strokeStyle = l.lowLineColor, e.lineWidth = l.lowLineWidth * t.verticalPixelRatio, e.stroke(x), e.strokeStyle = l.highLineColor, e.lineWidth = l.highLineWidth * t.verticalPixelRatio, e.stroke(_), e.strokeStyle = l.closeLineColor, e.lineWidth = l.closeLineWidth * t.verticalPixelRatio, e.stroke(h);
  }
}
class R {
  constructor() {
    g(this, "_renderer");
    this._renderer = new m();
  }
  priceValueBuilder(t) {
    return [t.low, t.high, t.close];
  }
  isWhitespace(t) {
    return t.close === void 0;
  }
  renderer() {
    return this._renderer;
  }
  update(t, i) {
    this._renderer.update(t, i);
  }
  defaultOptions() {
    return P;
  }
}
export {
  R as HLCAreaSeries
};
