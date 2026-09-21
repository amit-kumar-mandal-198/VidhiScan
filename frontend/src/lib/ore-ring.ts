// ============================================================================
//  ORE RING  -  procedural 3D "ore -> molten -> refined metal" hero object
//  Three.js r170+ (procedural geometry and materials generated in code)
// ============================================================================
import * as THREE from 'three';
import { edgeTable, triTable } from 'three/addons/objects/MarchingCubes.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

export interface OreRingOptions {
  cycle?: number;          // seconds for one full  metal -> ore -> molten -> cool -> metal loop
  spin?: number;           // radians / second around the ring's own axis
  tilt?: [number, number, number]; // resting rotation (x, y, z) in radians
  wobble?: number;         // slow "breathing" of the tilt so the hole opens & closes
  fill?: number;           // how much of the container the ring fills (0-1)
  pointer?: number;        // mouse / touch parallax amount (0 = off)
  glow?: number;           // strength of the bloom around the lava (0 = off)
  maxPixelRatio?: number;  // cap for retina screens (lower = faster)
  meshDetail?: number;     // marching-cubes cell size. 0.016 = crisp, 0.022 = lighter
  transparent?: boolean;   // false -> you get an opaque canvas (uses `background`)
  background?: number;
  autoplay?: boolean;
  startPhase?: number;     // where in the loop to begin (0.30 = ore just starting to glow)
}

export interface OreRingState {
  heat: number;
  rock: number;
  char: number;
  cold: number;
}

export interface OreRingUniforms {
  uTime: THREE.IUniform<number>;
  uHeat: THREE.IUniform<number>;
  uRock: THREE.IUniform<number>;
  uChar: THREE.IUniform<number>;
  uCold: THREE.IUniform<number>;
  uEmit: THREE.IUniform<number>;
  uBump: THREE.IUniform<number>;
  uEmissiveOnly: THREE.IUniform<number>;
  [key: string]: THREE.IUniform;
}

export interface OreRingInstance {
  setPhase: (p: number | null) => void;
  clearPhase: () => void;
  setTime: (sec: number) => void;
  getPhase: () => number;
  draw: () => void;
  options: Required<OreRingOptions>;
  uniforms: OreRingUniforms;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  dispose: () => void;
}

// ----------------------------------------------------------------------------
//  1. SETTINGS
// ----------------------------------------------------------------------------
export const DEFAULTS: Required<OreRingOptions> = {
  cycle: 6.5,
  spin: 0.32,
  tilt: [1.02, 0, -0.32],
  wobble: 0.20,
  fill: 0.80,
  pointer: 0.35,
  glow: 1.0,
  maxPixelRatio: 2,
  meshDetail: 0.016,
  transparent: true,
  background: 0x000000,
  autoplay: true,
  startPhase: 0.30,
};

// Ring geometry (all in "units", ring is about 2.1 wide)
export const SHAPE = {
  sides: 7,
  outer: 0.95,
  inner: 0.56,
  halfHeight: 0.62,
  fillet: 0.05,
  corner: 0.05,
  windowEdge: 0.04,
  windows: [
    { w: 0.23, h: 0.40, k: 0.34, y: 0.02 },
    { w: 0.20, h: 0.43, k: -0.30, y: -0.04 },
    { w: 0.24, h: 0.37, k: 0.28, y: 0.05 },
    { w: 0.19, h: 0.42, k: -0.36, y: 0.00 },
    { w: 0.23, h: 0.38, k: 0.32, y: -0.05 },
    { w: 0.21, h: 0.44, k: -0.26, y: 0.03 },
    { w: 0.22, h: 0.36, k: 0.36, y: -0.02 },
  ],
};

// Keyframes over one cycle (0 -> 1):
// phase, heat, rock, char, cold
export const KEYFRAMES: [number, number, number, number, number][] = [
  [0.00, 0.00, 0.00, 0.00, 0.0],   // polished silver
  [0.10, 0.00, 0.00, 0.00, 0.0],
  [0.22, 0.28, 0.80, 0.00, 1.0],   // ore forms, first red cracks
  [0.32, 0.80, 1.00, 0.00, 0.35],
  [0.42, 1.00, 1.00, 0.06, 0.0],   // fully molten
  [0.62, 1.00, 1.00, 0.10, 0.0],
  [0.74, 0.55, 1.00, 0.85, 0.0],   // cooling, crust spreads
  [0.84, 0.18, 0.75, 1.00, 0.0],   // dark with embers
  [0.92, 0.00, 0.12, 0.25, 0.0],   // refining
  [1.00, 0.00, 0.00, 0.00, 0.0],
];

// ----------------------------------------------------------------------------
//  2. GEOMETRY (SDF -> Marching Cubes)
// ----------------------------------------------------------------------------
const TAU = Math.PI * 2;
const sec = TAU / SHAPE.sides;
const aMid = (SHAPE.outer + SHAPE.inner) / 2;

const smax = (a: number, b: number, k: number): number => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + h * h * k * 0.25;
};

const _o: { win: number } = { win: 0 };
function sdf(x: number, y: number, z: number, out: { win: number } | null): number {
  const N = SHAPE.sides;
  const ang = Math.atan2(z, x);
  let i = Math.round(ang / sec);
  const la = ang - i * sec;
  i = ((i % N) + N) % N;
  const r = Math.hypot(x, z);

  // rounded polygon: smooth max of 3 nearest edge planes
  const c0 = r * Math.cos(la), cM = r * Math.cos(la + sec), cP = r * Math.cos(la - sec);
  const dOut = smax(smax(c0 - SHAPE.outer, cM - SHAPE.outer, SHAPE.corner), cP - SHAPE.outer, SHAPE.corner);
  const dIn  = smax(smax(c0 - SHAPE.inner, cM - SHAPE.inner, SHAPE.corner * 1.5), cP - SHAPE.inner, SHAPE.corner * 1.5);
  const ring2 = Math.max(dOut, -dIn);

  // extrude with filleted rims
  const rr = SHAPE.fillet;
  const q0 = ring2 + rr, q1 = Math.abs(y) - SHAPE.halfHeight + rr;
  const band = Math.hypot(Math.max(q0, 0), Math.max(q1, 0)) + Math.min(Math.max(q0, q1), 0) - rr;

  // slanted window, cut straight through the wall and projected along the wedge
  const W = SHAPE.windows[i % SHAPE.windows.length];
  const u = Math.tan(la) * aMid;
  const v = y - W.y;
  const rc = 0.07;
  const qx = Math.abs(u - W.k * v) - W.w + rc;
  const qy = Math.abs(v) - W.h + rc;
  const win = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rc;

  if (out) out.win = win;
  return smax(band, -win, SHAPE.windowEdge);
}

// ---- Static Noise Baking for Vertex Attributes ------------------------------
const PERM = new Uint8Array(512);
(function () {
  let seed = 1337;
  const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) {
    seed = (seed * 16807) % 2147483647;
    const j = seed % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
})();

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const pgrad = (h: number, x: number, y: number, z: number) => {
  h &= 15;
  const u = h < 8 ? x : y, v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
};

function noise3(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
  x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
  const u = fade(x), v = fade(y), w = fade(z);
  const A = PERM[X] + Y, AA = PERM[A] + Z, AB = PERM[A + 1] + Z, B = PERM[X + 1] + Y, BA = PERM[B] + Z, BB = PERM[B + 1] + Z;
  return lerp(
    lerp(lerp(pgrad(PERM[AA], x, y, z), pgrad(PERM[BA], x - 1, y, z), u), lerp(pgrad(PERM[AB], x, y - 1, z), pgrad(PERM[BB], x - 1, y - 1, z), u), v),
    lerp(lerp(pgrad(PERM[AA + 1], x, y, z - 1), pgrad(PERM[BA + 1], x - 1, y, z - 1), u), lerp(pgrad(PERM[AB + 1], x, y - 1, z - 1), pgrad(PERM[BB + 1], x - 1, y - 1, z - 1), u), v),
    w
  );
}

const n01 = (x: number, y: number, z: number) => Math.min(Math.max(0.5 + 0.9 * noise3(x, y, z), 0), 1);
const sm01 = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

function hash3(x: number, y: number, z: number) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return h ^ (h >>> 16);
}

function worley(px: number, py: number, pz: number): [number, number] {
  const ix = Math.floor(px), iy = Math.floor(py), iz = Math.floor(pz);
  const fx = px - ix, fy = py - iy, fz = pz - iz;
  let d1 = 8, d2 = 8;
  for (let k = -1; k <= 1; k++) {
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const h = hash3(ix + i, iy + j, iz + k);
        const dx = i + (h >>> 0) / 4294967296 - fx;
        const dy = j + (Math.imul(h, 1597334677) >>> 0) / 4294967296 - fy;
        const dz = k + (Math.imul(h, 3812015801) >>> 0) / 4294967296 - fz;
        const dd = dx * dx + dy * dy + dz * dz;
        if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) d2 = dd;
      }
    }
  }
  return [Math.sqrt(d1), Math.sqrt(d2)];
}

const rockH = (x: number, y: number, z: number) =>
  noise3(x * 1.6, y * 1.6, z * 1.6) * 0.040 +
  noise3(x * 3.7 + 11.3, y * 3.7, z * 3.7) * 0.030 +
  noise3(x * 8.1 + 5.1, y * 8.1, z * 8.1 + 3.3) * 0.014;

export function buildRingGeometry(res: number): THREE.BufferGeometry {
  const bx = 1.08, by = SHAPE.halfHeight + 0.08;
  const nx = Math.ceil((bx * 2) / res) + 1;
  const ny = Math.ceil((by * 2) / res) + 1;
  const nz = nx;
  const f = new Float32Array(nx * ny * nz);
  const idx = (i: number, j: number, k: number) => i + nx * (j + ny * k);

  // Sample the field
  const B = 6;
  for (let k0 = 0; k0 < nz; k0 += B) {
    for (let j0 = 0; j0 < ny; j0 += B) {
      for (let i0 = 0; i0 < nx; i0 += B) {
        const ci = Math.min(i0 + B / 2, nx - 1), cj = Math.min(j0 + B / 2, ny - 1), ck = Math.min(k0 + B / 2, nz - 1);
        const dc = sdf(-bx + ci * res, -by + cj * res, -bx + ck * res, null);
        const skip = Math.abs(dc) > B * res * 1.1;
        for (let k = k0; k < Math.min(k0 + B, nz); k++) {
          for (let j = j0; j < Math.min(j0 + B, ny); j++) {
            for (let i = i0; i < Math.min(i0 + B, nx); i++) {
              f[idx(i, j, k)] = skip ? dc : sdf(-bx + i * res, -by + j * res, -bx + k * res, null);
            }
          }
        }
      }
    }
  }

  // Marching cubes
  const positions: number[] = [], indices: number[] = [];
  const edgeMap = new Map<number, number>();
  const cornerOff = [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
  const edgeCorners = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  const val = new Float32Array(8);
  const edgeVert = new Int32Array(12);

  for (let k = 0; k < nz - 1; k++) {
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        let cube = 0;
        for (let c = 0; c < 8; c++) {
          const o = cornerOff[c];
          const v = f[idx(i + o[0], j + o[1], k + o[2])];
          val[c] = v;
          if (v < 0) cube |= 1 << c;
        }
        if (cube === 0 || cube === 255) continue;
        const em = edgeTable[cube];
        for (let e = 0; e < 12; e++) {
          if (!(em & (1 << e))) continue;
          const a = edgeCorners[e][0], b = edgeCorners[e][1];
          const oa = cornerOff[a], ob = cornerOff[b];
          const ax = oa[0] !== ob[0] ? 0 : oa[1] !== ob[1] ? 1 : 2;
          const key = idx(i + Math.min(oa[0], ob[0]), j + Math.min(oa[1], ob[1]), k + Math.min(oa[2], ob[2])) * 3 + ax;
          let vi = edgeMap.get(key);
          if (vi === undefined) {
            const denom = val[a] - val[b];
            const t = denom === 0 ? 0.5 : val[a] / denom;
            positions.push(
              -bx + (i + oa[0] + (ob[0] - oa[0]) * t) * res,
              -by + (j + oa[1] + (ob[1] - oa[1]) * t) * res,
              -bx + (k + oa[2] + (ob[2] - oa[2]) * t) * res
            );
            vi = positions.length / 3 - 1;
            edgeMap.set(key, vi);
          }
          edgeVert[e] = vi;
        }
        for (let t = 0; t < 16; t += 3) {
          const e0 = triTable[cube * 16 + t];
          if (e0 === -1) break;
          indices.push(edgeVert[e0], edgeVert[triTable[cube * 16 + t + 2]], edgeVert[triTable[cube * 16 + t + 1]]);
        }
      }
    }
  }

  // Per-vertex attributes: normal, glow mask, AO, baked noise
  const pos = new Float32Array(positions);
  const nv = pos.length / 3;
  const nrm = new Float32Array(nv * 3), glow = new Float32Array(nv), ao = new Float32Array(nv);
  const aRock = new Float32Array(nv * 4), aF = new Float32Array(nv * 4), aG = new Float32Array(nv * 4);
  const eps = 0.006;

  for (let v = 0; v < nv; v++) {
    const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
    let gx = sdf(x + eps, y, z, null) - sdf(x - eps, y, z, null);
    let gy = sdf(x, y + eps, z, null) - sdf(x, y - eps, z, null);
    let gz = sdf(x, y, z + eps, null) - sdf(x, y, z - eps, null);
    const l = Math.hypot(gx, gy, gz) || 1;
    gx /= l; gy /= l; gz /= l;
    nrm[v * 3] = gx; nrm[v * 3 + 1] = gy; nrm[v * 3 + 2] = gz;

    sdf(x, y, z, _o);
    const g = 1 - Math.min(Math.max((Math.abs(_o.win) - 0.02) / 0.05, 0), 1);
    glow[v] = g * g * (3 - 2 * g);

    let occ = 0, sca = 1;
    for (let s = 1; s <= 5; s++) {
      const h = 0.015 * s * s + 0.02;
      occ += (h - sdf(x + gx * h, y + gy * h, z + gz * h, null)) * sca;
      sca *= 0.75;
    }
    ao[v] = Math.min(Math.max(1 - 1.6 * occ, 0), 1);

    // Baked static fields
    const e2 = 0.02, h0 = rockH(x, y, z);
    aRock[v * 4] = h0;
    aRock[v * 4 + 1] = (rockH(x + e2, y, z) - h0) / e2;
    aRock[v * 4 + 2] = (rockH(x, y + e2, z) - h0) / e2;
    aRock[v * 4 + 3] = (rockH(x, y, z + e2) - h0) / e2;

    const wx = x * 1.5 + noise3(x * 1.1 + 1.7, y * 1.1, z * 1.1) * 0.42;
    const wy = y * 1.5 + noise3(x * 1.1 + 8.3, y * 1.1, z * 1.1) * 0.42;
    const wz = z * 1.5 + noise3(x * 1.1 + 4.1, y * 1.1, z * 1.1) * 0.42;
    const w1 = worley(wx * 0.85, wy * 0.85, wz * 0.85);
    const w2 = worley(wx * 2.1 + 9, wy * 2.1 + 9, wz * 2.1 + 9);

    aF[v * 4]     = w1[1] - w1[0];                      // crack distance (big cells)
    aF[v * 4 + 1] = w2[1] - w2[0];                      // crack distance (small cells)
    aF[v * 4 + 2] = n01(x * 1.3 + 7, y * 1.3, z * 1.3); // low-freq blotches
    aF[v * 4 + 3] = n01(x * 1.1 + 19, y * 1.1, z * 1.1);

    aG[v * 4]     = n01(x * 4.5 + 2, y * 4.5, z * 4.5); // mid-freq grain
    aG[v * 4 + 1] = sm01(0.55, 0.9, n01(x * 2.1 + 4, y * 2.1, z * 2.1));  // hot patches
    aG[v * 4 + 2] = sm01(0.30, 0.55, n01(x * 0.9 + 31, y * 0.9, z * 0.9)); // big cracks active
    aG[v * 4 + 3] = sm01(0.50, 0.70, n01(x * 1.2 + 47, y * 1.2, z * 1.2)); // hairline cracks
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  geo.setAttribute('aGlow', new THREE.BufferAttribute(glow, 1));
  geo.setAttribute('aAO', new THREE.BufferAttribute(ao, 1));
  geo.setAttribute('aRock', new THREE.BufferAttribute(aRock, 4));
  geo.setAttribute('aF', new THREE.BufferAttribute(aF, 4));
  geo.setAttribute('aG', new THREE.BufferAttribute(aG, 4));
  geo.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
  geo.computeBoundingSphere();
  return geo;
}

// ----------------------------------------------------------------------------
//  3. SHADERS
// ----------------------------------------------------------------------------
const GLSL_SNOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const VERT_COMMON = /* glsl */`
#include <common>
attribute float aGlow; attribute float aAO; attribute vec4 aRock; attribute vec4 aF; attribute vec4 aG;
varying vec3 vObj; varying float vGlow; varying float vAO; varying vec4 vF; varying vec4 vG; varying float vFlow;
uniform float uRock; uniform float uTime;
${GLSL_SNOISE}`;

const VERT_NORMAL = /* glsl */`
#include <beginnormal_vertex>
vObj = position; vGlow = aGlow; vAO = aAO; vF = aF; vG = aG;
vFlow = snoise(position*3.2 + vec3(0.0, -uTime*0.18, 0.0))*0.5+0.5;
vec3 nrm0 = normalize(normal);
vec3 gradH = aRock.yzw * uRock;
objectNormal = normalize(nrm0 - (gradH - dot(gradH,nrm0)*nrm0));
`;

const VERT_BEGIN = /* glsl */`
#include <begin_vertex>
transformed += nrm0 * aRock.x * uRock;
`;

const FRAG_COMMON = /* glsl */`
#include <common>
uniform float uTime, uHeat, uRock, uChar, uCold, uEmit, uBump, uEmissiveOnly;
varying vec3 vObj; varying float vGlow; varying float vAO; varying vec4 vF; varying vec4 vG; varying float vFlow;
${GLSL_SNOISE}
float spreadM(float p, float n){ return smoothstep(n-0.25, n+0.25, p*1.5-0.25); }
vec3 lavaRamp(float t){
  vec3 c = vec3(0.0);
  c = mix(c, vec3(0.42,0.02,0.00), smoothstep(0.00,0.25,t));
  c = mix(c, vec3(1.00,0.22,0.02), smoothstep(0.20,0.50,t));
  c = mix(c, vec3(1.00,0.62,0.10), smoothstep(0.45,0.75,t));
  c = mix(c, vec3(1.00,0.93,0.65), smoothstep(0.75,1.00,t));
  return c;
}
vec3 bumpNormal(vec3 pos, vec3 n, vec2 dH, float faceDir){
  vec3 sx = normalize(dFdx(pos)), sy = normalize(dFdy(pos));
  vec3 R1 = cross(sy, n), R2 = cross(n, sx);
  float det = dot(sx, R1) * faceDir;
  vec3 grad = sign(det) * (dH.x * R1 + dH.y * R2);
  return normalize(abs(det) * n - grad);
}`;

const FRAG_COLOR = /* glsl */`
#include <color_fragment>
vec3 P = vObj;
float nLow = vF.z, nLow2 = vF.w, nMid = vG.x;
float nHi  = snoise(P*17.0)*0.5+0.5;
float grit = nMid*0.55 + nHi*0.45;

float rockM  = spreadM(uRock, nLow2);
float crustM = spreadM(uChar, nLow);

// ---- albedo ------------------------------------------------------------
vec3 rockCol  = mix(vec3(0.09,0.09,0.10), vec3(0.62,0.62,0.65), smoothstep(0.25,0.85,grit));
vec3 metalCol = vec3(0.82,0.83,0.86) * (0.82 + 0.18*nMid);
vec3 base = mix(metalCol, rockCol, rockM);
base = mix(base, base*vec3(0.62,0.78,1.10), uCold*rockM*0.85);
base *= mix(0.42, 1.0, vAO);
vec3 charCol = vec3(0.022,0.020,0.024) * (0.5 + grit);
diffuseColor.rgb = mix(base, charCol, crustM);

// ---- lava cracks -------------------------------------------------------
float jig  = (nHi - 0.5) * 0.04;
float cd   = max(vF.x + jig, 0.0);
float cd2  = max(vF.y + jig, 0.0);
float wid  = mix(0.020, 0.060, uHeat);
float core = (1.0 - smoothstep(0.0, wid, cd)) * vG.z;
float halo = (1.0 - smoothstep(0.0, wid*2.6, cd)) * vG.z;
float fine = (1.0 - smoothstep(0.0, wid*0.75, cd2)) * vG.w;
float flow = vFlow;
float lines = clamp(core + fine*0.8, 0.0, 1.0);
float t0 = lines*(0.78+0.35*flow) + halo*0.16*(0.4+flow) + vG.y*0.12*halo;
t0 *= rockM;
float wall = vGlow * (0.21 + 0.25*flow) * mix(0.6, 1.0, vAO);
t0 = max(t0, wall);
float T = clamp(t0 - (1.0-uHeat)*0.9, 0.0, 1.0);
diffuseColor.rgb *= 1.0 - 0.65*halo*uHeat*rockM;
`;

const FRAG_ROUGH = /* glsl */`
#include <roughnessmap_fragment>
roughnessFactor = mix(mix(0.30, 0.42, nMid), mix(0.62, 0.90, grit), rockM);
roughnessFactor = mix(roughnessFactor, 0.93, crustM);
`;

const FRAG_METAL = /* glsl */`
#include <metalnessmap_fragment>
metalnessFactor = mix(1.0, 0.65, rockM);
metalnessFactor = mix(metalnessFactor, 0.0, crustM);
`;

const FRAG_NORMAL = /* glsl */`
#include <normal_fragment_maps>
float hgt = snoise(P*30.0)*0.6 + nHi*0.5;
hgt *= mix(0.25, 1.0, rockM);
normal = bumpNormal(-vViewPosition, normal, vec2(dFdx(hgt), dFdy(hgt)) * uBump, faceDirection);
`;

const FRAG_EMISSIVE = /* glsl */`
#include <emissivemap_fragment>
vec3 lava = lavaRamp(T) * uEmit;
totalEmissiveRadiance += lava;
`;

const FRAG_END = /* glsl */`
#include <opaque_fragment>
if (uEmissiveOnly > 0.5) gl_FragColor = vec4(lava, 1.0);
`;

function makeMaterial(uniforms: OreRingUniforms): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.4 });
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, uniforms);
    s.vertexShader = s.vertexShader
      .replace('#include <common>', VERT_COMMON)
      .replace('#include <beginnormal_vertex>', VERT_NORMAL)
      .replace('#include <begin_vertex>', VERT_BEGIN);
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', FRAG_COMMON)
      .replace('#include <color_fragment>', FRAG_COLOR)
      .replace('#include <roughnessmap_fragment>', FRAG_ROUGH)
      .replace('#include <metalnessmap_fragment>', FRAG_METAL)
      .replace('#include <normal_fragment_maps>', FRAG_NORMAL)
      .replace('#include <emissivemap_fragment>', FRAG_EMISSIVE)
      .replace('#include <opaque_fragment>', FRAG_END);
  };
  return m;
}

// ----------------------------------------------------------------------------
//  4. STUDIO ENVIRONMENT (PMREM)
// ----------------------------------------------------------------------------
function makeEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const s = new THREE.Scene();
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(20, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `varying vec3 vP; void main(){
        vec3 d=normalize(vP);
        vec3 grey=vec3(0.55,0.57,0.61), orange=vec3(1.0,0.34,0.09);
        float k=smoothstep(0.15,0.95,d.x);
        vec3 c=mix(grey,orange,k)*mix(0.10,0.70,smoothstep(-0.6,0.9,d.y));
        gl_FragColor=vec4(c,1.0); }`,
    })
  );
  s.add(dome);

  const box = (w: number, h: number, p: [number, number, number], intensity: number, color: number) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide })
    );
    m.position.set(...p);
    m.lookAt(0, 0, 0);
    s.add(m);
  };

  box(9, 5, [-9, 8, 7], 9, 0xffffff);       // key softbox: top-left-front
  box(2.5, 10, [11, 1, 4], 7, 0xffb27d);    // warm strip: right
  box(12, 2, [0, -8, 6], 2.5, 0xffe4d6);    // low fill
  box(7, 7, [0, 6, -10], 4, 0xffffff);      // top back

  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.03).texture;
  pm.dispose();
  return tex;
}

// ----------------------------------------------------------------------------
//  5. GLOW POST-PROCESSING PASS
// ----------------------------------------------------------------------------
class Glow {
  r: THREE.WebGLRenderer;
  emit: THREE.WebGLRenderTarget;
  a1: THREE.WebGLRenderTarget;
  b1: THREE.WebGLRenderTarget;
  a2: THREE.WebGLRenderTarget;
  b2: THREE.WebGLRenderTarget;
  blur: THREE.ShaderMaterial;
  comp: THREE.ShaderMaterial;
  quad: FullScreenQuad;

  constructor(renderer: THREE.WebGLRenderer) {
    this.r = renderer;
    const o = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
    };
    this.emit = new THREE.WebGLRenderTarget(2, 2, { ...o, depthBuffer: true });
    this.a1 = new THREE.WebGLRenderTarget(2, 2, o);
    this.b1 = new THREE.WebGLRenderTarget(2, 2, o);
    this.a2 = new THREE.WebGLRenderTarget(2, 2, o);
    this.b2 = new THREE.WebGLRenderTarget(2, 2, o);

    const vs = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }';
    this.blur = new THREE.ShaderMaterial({
      uniforms: { tex: { value: null }, dir: { value: new THREE.Vector2() } },
      vertexShader: vs,
      depthTest: false,
      depthWrite: false,
      fragmentShader: `uniform sampler2D tex; uniform vec2 dir; varying vec2 vUv; void main(){
        vec3 c=texture2D(tex,vUv).rgb*0.227027;
        c+=(texture2D(tex,vUv+dir).rgb+texture2D(tex,vUv-dir).rgb)*0.1945946;
        c+=(texture2D(tex,vUv+dir*2.0).rgb+texture2D(tex,vUv-dir*2.0).rgb)*0.1216216;
        c+=(texture2D(tex,vUv+dir*3.0).rgb+texture2D(tex,vUv-dir*3.0).rgb)*0.054054;
        c+=(texture2D(tex,vUv+dir*4.0).rgb+texture2D(tex,vUv-dir*4.0).rgb)*0.016216;
        gl_FragColor=vec4(c,1.0); }`,
    });

    this.comp = new THREE.ShaderMaterial({
      uniforms: { s1: { value: null }, s2: { value: null }, strength: { value: 1 } },
      vertexShader: vs,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneFactor,
      fragmentShader: `uniform sampler2D s1,s2; uniform float strength; varying vec2 vUv; void main(){
        vec3 g=(texture2D(s1,vUv).rgb*0.06+texture2D(s2,vUv).rgb*0.12)*strength*vec3(1.0,0.78,0.55);
        vec2 e=abs(vUv-0.5)*2.0;
        g*=1.0-smoothstep(0.62,0.98,max(e.x,e.y));
        vec3 t=pow(1.0-exp(-g*1.4), vec3(1.0/2.2));
        gl_FragColor=vec4(t, max(max(t.r,t.g),t.b)); }`,
    });
    this.quad = new FullScreenQuad(this.blur);
  }

  setSize(w: number, h: number) {
    this.emit.setSize(w >> 1, h >> 1);
    this.a1.setSize(w >> 1, h >> 1);
    this.b1.setSize(w >> 1, h >> 1);
    this.a2.setSize(Math.max(w >> 3, 2), Math.max(h >> 3, 2));
    this.b2.setSize(Math.max(w >> 3, 2), Math.max(h >> 3, 2));
  }

  _pass(src: THREE.WebGLRenderTarget, dst: THREE.WebGLRenderTarget, dx: number, dy: number) {
    this.blur.uniforms.tex.value = src.texture;
    this.blur.uniforms.dir.value.set(dx / src.width, dy / src.height);
    this.quad.material = this.blur;
    this.r.setRenderTarget(dst);
    this.quad.render(this.r);
  }

  render(scene: THREE.Scene, camera: THREE.Camera, uniforms: OreRingUniforms, strength: number) {
    const r = this.r;
    const prevColor = r.getClearColor(new THREE.Color());
    const prevAlpha = r.getClearAlpha();
    uniforms.uEmissiveOnly.value = 1;
    r.setRenderTarget(this.emit);
    r.setClearColor(0x000000, 0);
    r.clear();
    r.render(scene, camera);
    uniforms.uEmissiveOnly.value = 0;
    r.setClearColor(prevColor, prevAlpha);

    this._pass(this.emit, this.a1, 1.6, 0);
    this._pass(this.a1, this.b1, 0, 1.6);
    this._pass(this.b1, this.a2, 3.0, 0);
    this._pass(this.a2, this.b2, 0, 3.0);
    this._pass(this.b2, this.a2, 3.0, 0);
    this._pass(this.a2, this.b2, 0, 3.0);

    this.comp.uniforms.s1.value = this.b1.texture;
    this.comp.uniforms.s2.value = this.b2.texture;
    this.comp.uniforms.strength.value = strength;
    this.quad.material = this.comp;
    r.setRenderTarget(null);
    this.quad.render(r);
  }

  dispose() {
    [this.emit, this.a1, this.b1, this.a2, this.b2].forEach(t => t.dispose());
    this.blur.dispose();
    this.comp.dispose();
    this.quad.dispose();
  }
}

// ----------------------------------------------------------------------------
//  6. TIMELINE INTERPOLATION
// ----------------------------------------------------------------------------
const sstep = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);

export function stateAt(phase: number): OreRingState {
  const K = KEYFRAMES;
  phase = ((phase % 1) + 1) % 1;
  let i = 0;
  while (i < K.length - 2 && phase > K[i + 1][0]) i++;
  const a = K[i], b = K[i + 1];
  const t = sstep(Math.min(Math.max((phase - a[0]) / (b[0] - a[0]), 0), 1));
  const L = (j: number) => a[j] + (b[j] - a[j]) * t;
  return { heat: L(1), rock: L(2), char: L(3), cold: L(4) };
}

export function getPhaseDescription(phase: number): { label: string; badge: string; color: string } {
  const p = ((phase % 1) + 1) % 1;
  if (p < 0.15) {
    return { label: "Polished Refined Metal", badge: "Refined", color: "text-slate-300" };
  } else if (p < 0.28) {
    return { label: "Raw Mineral Ore Forms", badge: "Ore Formation", color: "text-amber-400" };
  } else if (p < 0.40) {
    return { label: "Thermal Ignition & Cracks", badge: "Heating", color: "text-orange-400" };
  } else if (p < 0.65) {
    return { label: "Superheated Molten Core", badge: "Molten Core", color: "text-rose-400" };
  } else if (p < 0.85) {
    return { label: "Crust Solidification & Embers", badge: "Cooling", color: "text-amber-500" };
  } else {
    return { label: "Chemical Refining & Polishing", badge: "Refining", color: "text-indigo-400" };
  }
}

// ----------------------------------------------------------------------------
//  7. MOUNT FUNCTION
// ----------------------------------------------------------------------------
export function mountOreRing(container: HTMLElement, options: OreRingOptions = {}): OreRingInstance | null {
  const opt: Required<OreRingOptions> = { ...DEFAULTS, ...options };
  const reduced = Boolean(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const lowPower = Boolean(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  if (lowPower) {
    if (options.meshDetail === undefined) opt.meshDetail = 0.022;
    if (options.maxPixelRatio === undefined) opt.maxPixelRatio = 1.5;
  }

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: opt.transparent,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    console.warn('[ore-ring] WebGL unavailable, showing fallback.', err);
    container.classList.add('ore-ring--no-webgl');
    return null;
  }

  renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, opt.maxPixelRatio));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.autoClear = false;
  renderer.setClearColor(opt.background, opt.transparent ? 0 : 1);

  const canvas = renderer.domElement;
  canvas.style.cssText = 'display:block;width:100%;height:100%;';
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  scene.environment = makeEnvironment(renderer);
  scene.environmentIntensity = 1.0;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);

  const uniforms: OreRingUniforms = {
    uTime: { value: 0 },
    uHeat: { value: 0 },
    uRock: { value: 0 },
    uChar: { value: 0 },
    uCold: { value: 0 },
    uEmit: { value: 2.1 },
    uBump: { value: 0.8 },
    uEmissiveOnly: { value: 0 },
  };

  const geometry = buildRingGeometry(opt.meshDetail);
  const mesh = new THREE.Mesh(geometry, makeMaterial(uniforms));
  const spinGroup = new THREE.Group();
  spinGroup.add(mesh);
  const pivot = new THREE.Group();
  pivot.add(spinGroup);
  scene.add(pivot);

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-3, 4, 5);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xff8a4a, 1.2);
  rim.position.set(5, 1, -2);
  scene.add(rim);

  const core = new THREE.PointLight(0xff5a12, 0, 0, 2);
  pivot.add(core);

  const glow = new Glow(renderer);

  function resize() {
    const w = Math.max(container.clientWidth, 2);
    const h = Math.max(container.clientHeight, 2);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const half = THREE.MathUtils.degToRad(camera.fov / 2);
    const halfMin = Math.min(half, Math.atan(Math.tan(half) * camera.aspect));
    const R = geometry.boundingSphere ? geometry.boundingSphere.radius : 1.2;
    camera.position.set(0, 0, R / Math.sin(halfMin) / opt.fill);
    camera.updateProjectionMatrix();
    const v = renderer.getDrawingBufferSize(new THREE.Vector2());
    glow.setSize(v.x, v.y);
  }

  const ro = new ResizeObserver(() => {
    resize();
    dirty = true;
  });
  ro.observe(container);
  resize();

  // Pointer parallax
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  const onMove = (e: PointerEvent) => {
    const r = container.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      ptr.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ptr.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }
  };
  if (opt.pointer > 0 && typeof window !== 'undefined') {
    window.addEventListener('pointermove', onMove, { passive: true });
  }

  // Animation loop state
  let phaseOverride: number | null = null;
  let t = 0;
  let cycleT = opt.startPhase * opt.cycle;
  let last = performance.now();
  let visible = true;
  let raf = 0;
  let dirty = true;

  const animated = () => opt.autoplay && !reduced;

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (!visible) return;
    if (animated()) {
      t += dt;
      if (phaseOverride === null) cycleT += dt;
      draw();
    } else if (dirty) {
      draw();
    }
  }

  function draw() {
    const phase = phaseOverride ?? (reduced ? 0.5 : (cycleT / opt.cycle) % 1);
    const s = stateAt(phase);
    uniforms.uTime.value = t;
    uniforms.uHeat.value = s.heat;
    uniforms.uRock.value = s.rock;
    uniforms.uChar.value = s.char;
    uniforms.uCold.value = s.cold;
    core.intensity = s.heat * s.rock * 1.6;

    ptr.sx += (ptr.x - ptr.sx) * 0.05;
    ptr.sy += (ptr.y - ptr.sy) * 0.05;
    const w = opt.wobble;
    pivot.rotation.set(
      opt.tilt[0] + Math.sin(t * 0.45) * w + ptr.sy * opt.pointer * 0.5,
      opt.tilt[1] + ptr.sx * opt.pointer * 0.6,
      opt.tilt[2] + Math.cos(t * 0.31) * w * 0.7
    );
    spinGroup.rotation.y = t * opt.spin;

    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(scene, camera);
    if (opt.glow > 0) {
      glow.render(scene, camera, uniforms, opt.glow * (0.25 + 0.75 * s.heat));
    }
    dirty = false;
  }

  // Intersection observer to pause when off-screen
  const io = new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
    },
    { threshold: 0.01 }
  );
  io.observe(container);

  const onVis = () => {
    last = performance.now();
  };
  document.addEventListener('visibilitychange', onVis);

  raf = requestAnimationFrame(frame);

  return {
    setPhase(p: number | null) {
      phaseOverride = p;
      dirty = true;
      draw();
    },
    clearPhase() {
      if (phaseOverride !== null) {
        cycleT = phaseOverride * opt.cycle;
        phaseOverride = null;
      }
    },
    setTime(sec: number) {
      t = sec;
    },
    getPhase() {
      return phaseOverride ?? ((cycleT / opt.cycle) % 1);
    },
    draw,
    options: opt,
    uniforms,
    renderer,
    scene,
    camera,
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      if (typeof window !== 'undefined') {
        window.removeEventListener('pointermove', onMove);
      }
      document.removeEventListener('visibilitychange', onVis);
      glow.dispose();
      geometry.dispose();
      mesh.material.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
