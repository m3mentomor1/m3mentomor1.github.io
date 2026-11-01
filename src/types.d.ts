// Shapes used by main.ts. Declarations only: nothing in this file reaches the browser.

type BBox = [minX: number, minY: number, maxX: number, maxY: number];
type Noise = (x: number, y: number) => number;

/* ----- map-data.ts (window.GEO_DATA): OpenStreetMap extract, delta-encoded metres ----- */
interface RawGeo {
  /** [lat, lon] of the local origin every coordinate is measured from */
  origin: [number, number];
  names: string[];
  /** [roadClass, nameIndex (-1 = none), dx0, dy0, dx1, dy1, …] */
  roads: number[][];
  /** [areaKind, nameIndex, dx0, dy0, …] */
  areas?: number[][];
  /** [nameIndex, dx0, dy0, …] */
  rivers?: number[][];
  ph?: LocatorOutline;
  route?: { pts: number[]; legs: number[]; names: string[] };
}

/** Philippines outline for the locator inset, already projected to SVG units */
interface LocatorOutline {
  viewBox: string;
  path: string;
  kx: number;
  minx: number;
  miny: number;
  scale: number;
}

interface Road {
  /** 0 trunk, 1 primary, 2 secondary, 3 tertiary, 4 street */
  c: number;
  name: string;
  pts: Float32Array;
  bb: BBox;
}

interface Area {
  /** 0 water, 1 park, 2 campus */
  k: number;
  name: string;
  pts: Float32Array;
  bb: BBox;
}

interface River {
  name: string;
  pts: Float32Array;
  bb: BBox;
}

interface Route {
  pts: Float32Array;
  /** Cumulative distance (m) at each route point */
  cum: Float32Array;
  total: number;
  /** Distance (m) of each waypoint along the route */
  wp: number[];
}

interface Geo {
  lat0: number;
  lon0: number;
  /** Metres per degree of longitude at the origin */
  mLon: number;
  roads: Road[];
  areas: Area[];
  rivers: River[];
  ext: BBox;
  /** Road segments by grid cell, as flat [roadIndex, pointOffset, …] pairs */
  grid: Map<number, number[]>;
  CELL: number;
  ph?: LocatorOutline;
  route: Route | null;
}

interface MapStyle {
  bg: string;
  minor: string;
  major: string;
  street: string;
  casing: string;
  park: string;
  water: string;
  campus: string;
  river: string;
  paper: string;
  paper2: string;
  paper3: string;
  ink: string;
  ink2: string;
  signal: string;
  onSignal: string;
  contour: string;
  contourMinor: string;
}

/* ----- Map view and camera ----- */
interface Viewport {
  w: number;
  h: number;
  /** Zoom: screen pixels per metre */
  k: number;
  /** Map point (metres) at the centre of the viewport */
  vx: number;
  vy: number;
}

interface Projection {
  X: (x: number) => number;
  Y: (y: number) => number;
  vb: number[];
  inView: (bb: BBox) => boolean;
}

interface Camera {
  follow: boolean;
  /** Distance (m) along the route of the cursor */
  d: number;
  /** Where on screen the camera holds the cursor; null until first placed */
  ax: number | null;
  ay: number | null;
  zoomAnim: boolean;
}

interface MapBuffer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
  valid: boolean;
  lowres: boolean;
  k: number;
  vx: number;
  vy: number;
  bw: number;
  bh: number;
}

interface DetectTarget {
  re: RegExp;
  label: string;
  source: "roads" | "areas";
  conf: string;
  /** Combined bounds of the matching features, computed on first draw */
  bb?: BBox;
}

type ProbeHit = { type: "road"; f: Road } | { type: "area"; f: Area };

interface LabelRun {
  len: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  c: number;
}

interface PopupBox {
  x: number;
  y: number;
  w: number;
  h: number;
  /** 1: right of the marker, -1: left of it, 0: bottom sheet (phones) */
  side: number;
}

/* ----- Page UI ----- */
interface Carousel {
  track: HTMLElement;
  bar: HTMLElement;
  win: HTMLElement;
  count: HTMLElement | null;
  prev: HTMLButtonElement | null;
  next: HTMLButtonElement | null;
}

type FocusTarget = HTMLButtonElement | "body";

interface NavOpts {
  focus?: FocusTarget;
  loop?: boolean;
  push?: boolean;
}

interface Window {
  /** Set once main.js runs; the head script reveals everything if it never does */
  __siteReady?: boolean;
  GEO_DATA?: RawGeo;
}

interface CSSStyleDeclaration {
  // Custom properties are set from numbers (e.g. "--i"); the browser stringifies them.
  setProperty(property: string, value: string | number | null, priority?: string): void;
}
