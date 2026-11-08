
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

try {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) throw 0;

  const host = document.getElementById("hero");
  const cv = document.getElementById("cv");

  const R = new THREE.WebGLRenderer({
    canvas: cv,
    antialias: true
  });

  R.toneMapping = THREE.ACESFilmicToneMapping;
  R.setClearColor(0x050507, 1);
  R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const sc = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 1, 1, 6000);

  sc.environment = new THREE.PMREMGenerator(R)
    .fromScene(new RoomEnvironment(), 0.04).texture;
  sc.environmentIntensity = 0.42;

  const key = new THREE.DirectionalLight(0xdfe8ff, 1.3);
  key.position.set(-500, 600, 800);
  sc.add(key);

  const blk = new THREE.Group();
  sc.add(blk);

  const PT = {
    TL: [0, 0, 1, 1],
    TR: [1, 0, 1, 1],
    BL: [0, 1, 1, 1],
    BR: [1, 1, 1, 1],
    tAB: [.22, 0, 0, 1],
    tBC: [.515, 0, 0, 1],
    tCE: [.84, 0, 0, 1],
    bAD: [.34, 1, 0, 1],
    bDE: [.865, 1, 0, 1],
    J0: [.385, .72, 0, 0],
    J1: [.48, .62, 0, 0],
    J2: [.716, .49, 0, 0]
  };

  const POLY = [
    ["TL", "tAB", "J0", "bAD", "BL"],
    ["tAB", "tBC", "J1", "J0"],
    ["tBC", "tCE", "J2", "J1"],
    ["J0", "J1", "J2", "bDE", "bAD"],
    ["tCE", "TR", "BR", "bDE", "J2"]
  ];

  const ROUTE = ["plans", "classes", "coaches", "contact", ""];

  const RD = POLY.map(() => ({
    ax: new THREE.Vector3(
      Math.random() - .5,
      Math.random() - .5,
      Math.random() - .5
    ).normalize(),
    tum: 2 + Math.random() * 1.6,
    zf: 420 + Math.random() * 380
  }));

  const U = {
    uM: { value: new THREE.Vector3(100000, 0, 0) },
    uG: { value: 0 },
    uR: { value: 300 }
  };

  function createMaterial() {
    const m = new THREE.MeshPhysicalMaterial({
      color: 0x17171b,
      roughness: .36,
      clearcoat: .7,
      clearcoatRoughness: .12,
      specularIntensity: .7,
      iridescence: .55,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [250, 650]
    });

    m.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, U);

      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vWP;"
        )
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;"
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vWP;uniform vec3 uM;uniform float uG,uR;"
        )
        .replace(
          "#include <opaque_fragment>",
          "outgoingLight+=vec3(.42,.37,.62)*.16*exp(-1.6*pow(distance(vWP.xy,uM.xy)/uR,2.))*uG;\n#include <opaque_fragment>"
        );
    };

    return m;
  }

  const cvt = document.createElement("canvas");
  const ctx = cvt.getContext("2d");
  const tex = new THREE.CanvasTexture(cvt);

  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  const overlayMaterial = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    toneMapped: false
  });

  const out = [];
  const inn = [];
  const gm = [];
  const ms = [];
  const ov = [];
  const bp = [];

  POLY.forEach((_, i) => {
    const outer = new THREE.Group();
    const inner = new THREE.Group();

    const material = createMaterial();
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
    const overlay = new THREE.Mesh(
      new THREE.BufferGeometry(),
      overlayMaterial
    );

    mesh.userData.i = i;
    inner.add(mesh, overlay);
    outer.add(inner);
    blk.add(outer);

    out.push(outer);
    inn.push(inner);
    gm.push(mesh);
    ms.push(material);
    ov.push(overlay);
    bp.push([0, 0]);
  });

  let pw = 1;
  let ph = 1;
  let S = 1;
  let port = false;
  let hov = -1;

  const sp = [1, 1, 1, 1, 1];
  const lz = [0, 0, 0, 0, 0];
  const vz = [0, 0, 0, 0, 0];
  const tp = Array.from({ length: 5 }, () => [0, 0]);
  const tv = Array.from({ length: 5 }, () => [0, 0]);

  let tgt = 0;
  let rx = 0;
  let ry = 0;
  let pg = [0, 0];
  let mx = 0;
  let my = 0;
  let an = null;
  let raf = 0;
  let last = 0;
  let active = false;

  const PS = {};

  const LA = {
    eb: [.04, .115],
    h: [.04, .2],
    sub: [.04, .535],
    pill: [.04, .63],
    ft: [.04, .94],
    lab: [[.275, .07], [.545, .07], [.46, .87], [.845, .07]]
  };

  const PO = {
    eb: [.06, .03],
    h: [.06, .06],
    sub: [.06, .2],
    pill: [.06, .205],
    ft: [.06, .97],
    lab: [[.06, .33], [.06, .58], [.55, .5], [.06, .9]]
  };

  const LB = [
    ["Classes", "64 sessions a week"],
    ["Coaches", "18 certified"],
    ["Book a tour", "Free first visit"],
    ["2,400", "members training"]
  ];

  function draw() {
    const d = Math.min(window.devicePixelRatio || 1, 1.5);

    cvt.width = Math.round(pw * d);
    cvt.height = Math.round(ph * d);

    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.clearRect(0, 0, pw, ph);
    ctx.textBaseline = "top";

    const L = port ? PO : LA;
    const font = "Inter,system-ui,sans-serif";
    const fh = port ? pw * .115 : Math.min(pw * .078, ph * .2);
    const eb = Math.max(10, port ? pw * .032 : pw * .0075);
    const fl = port ? pw * .06 : Math.max(15, pw * .0155);

    const X = (arr, axis) => arr[axis] * (axis ? ph : pw);

    ctx.font = `500 ${eb}px ${font}`;
    ctx.fillStyle = "rgba(255,255,255,.38)";
    ctx.letterSpacing = ".2em";
    ctx.fillText("STRENGTH CLUB · 5AM–11PM", X(L.eb, 0), X(L.eb, 1));

    const gy = X(L.h, 1);
    const gr = ctx.createLinearGradient(0, gy, 0, gy + fh * 2);

    gr.addColorStop(0, "#dcdce0");
    gr.addColorStop(1, "#bdbdc3");

    ctx.fillStyle = gr;
    ctx.font = `500 ${fh}px ${font}`;
    ctx.letterSpacing = `${-.045 * fh}px`;

    ctx.fillText("Lift heavy.", X(L.h, 0), gy);
    ctx.fillText("Stay sharp.", X(L.h, 0), gy + fh * .97);

    ctx.letterSpacing = "0px";

    const ss = Math.max(12, port ? pw * .034 : pw * .0115);

    if (!port) {
      ctx.font = `400 ${ss}px ${font}`;
      ctx.fillStyle = "rgba(255,255,255,.55)";

      ctx.fillText(
        "Strength floor, coached classes and recovery.",
        X(L.sub, 0),
        X(L.sub, 1)
      );

      ctx.fillText(
        "Open every day. First week free.",
        X(L.sub, 0),
        X(L.sub, 1) + ss * 1.6
      );
    }

    const buttonWidth = Math.max(110, pw * .085);
    const buttonHeight = buttonWidth * .35;
    const buttonX = X(L.pill, 0);
    const buttonY = X(L.pill, 1);

    ctx.fillStyle = hov === 0 ? "#36d67e" : "#ececf0";
    ctx.beginPath();
    ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 7);
    ctx.fill();

    ctx.fillStyle = "#0a0a0c";
    ctx.font = `500 ${buttonHeight * .38}px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
      "Join now",
      buttonX + buttonWidth / 2,
      buttonY + buttonHeight / 2 + 1
    );

    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    ctx.font = `400 ${eb}px ${font}`;
    ctx.fillStyle = "rgba(255,255,255,.34)";
    ctx.fillText("© Tensile Club", X(L.ft, 0), X(L.ft, 1) - eb);

    LB.forEach((item, j) => {
      const x = X(L.lab[j], 0);
      const y = X(L.lab[j], 1);
      const big = j === 3;

      ctx.font = `500 ${big ? fl * 2 : fl}px ${font}`;
      ctx.fillStyle = hov === j + 1 && j < 3
        ? "#fff"
        : "rgba(255,255,255,.82)";
      ctx.letterSpacing = "-.03em";

      ctx.fillText(
        item[0] + (j < 3 ? (hov === j + 1 ? "  →" : "  ↗") : ""),
        x,
        y
      );

      ctx.font = `400 ${ss}px ${font}`;
      ctx.fillStyle = "rgba(255,255,255,.45)";
      ctx.letterSpacing = "0px";

      ctx.fillText(
        item[1],
        x,
        y + (big ? fl * 2.2 : fl * 1.35)
      );
    });

    tex.needsUpdate = true;
  }

  function transformPoint(point) {
    return port
      ? [(point[1] - .5) * pw, (.5 - point[0]) * ph]
      : [(point[0] - .5) * pw, (.5 - point[1]) * ph];
  }

  function makeShape(vertices, radius) {
    const shape = new THREE.Shape();

    for (let i = 0; i < vertices.length; i++) {
      const p = vertices[i];
      const a = vertices[(i + vertices.length - 1) % vertices.length];
      const b = vertices[(i + 1) % vertices.length];

      const la = Math.hypot(a[0] - p[0], a[1] - p[1]) || 1;
      const lb = Math.hypot(b[0] - p[0], b[1] - p[1]) || 1;

      const ra = Math.min(radius, la * .4) / la;
      const rb = Math.min(radius, lb * .4) / lb;

      const p1 = [
        p[0] + (a[0] - p[0]) * ra,
        p[1] + (a[1] - p[1]) * ra
      ];

      const p2 = [
        p[0] + (b[0] - p[0]) * rb,
        p[1] + (b[1] - p[1]) * rb
      ];

      if (i) shape.lineTo(p1[0], p1[1]);
      else shape.moveTo(p1[0], p1[1]);

      shape.quadraticCurveTo(p[0], p[1], p2[0], p2[1]);
    }

    shape.closePath();
    return shape;
  }

  function build() {
    for (const key in PT) {
      PS[key] = [PT[key][0], PT[key][1]];
    }

    POLY.forEach((polygon, i) => {
      const vertices = polygon.map(key => transformPoint(PS[key]));

      const center = [
        vertices.reduce((sum, p) => sum + p[0], 0) / vertices.length,
        vertices.reduce((sum, p) => sum + p[1], 0) / vertices.length
      ];

      bp[i] = center;

      const adjusted = vertices.map(point => {
        const x = point[0] - center[0];
        const y = point[1] - center[1];
        const length = Math.hypot(x, y) || 1;
        const gap = Math.min(7 * S, length * .3);

        return [
          x - (x / length) * gap,
          y - (y / length) * gap
        ];
      });

      const shape = makeShape(adjusted, 20 * S);

      gm[i].geometry.dispose();
      ov[i].geometry.dispose();

      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 13 * S,
        bevelEnabled: true,
        bevelThickness: 2.6 * S,
        bevelSize: 2.6 * S,
        bevelSegments: 3,
        curveSegments: 5
      });

      geometry.translate(0, 0, -6.5 * S);
      gm[i].geometry = geometry;

      const overlayGeometry = new THREE.ShapeGeometry(shape, 5);
      const position = overlayGeometry.attributes.position;
      const uv = overlayGeometry.attributes.uv;

      for (let j = 0; j < position.count; j++) {
        uv.setXY(
          j,
          (position.getX(j) + center[0]) / pw + .5,
          (position.getY(j) + center[1]) / ph + .5
        );
      }

      ov[i].geometry = overlayGeometry;
      ov[i].position.z = 9.1 * S + .4;
    });
  }

  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;

    if (!w || !h) return;

    R.setSize(w, h);

    cam.aspect = w / h;
    cam.position.z = (h / 2) / Math.tan(Math.PI / 12);
    cam.updateProjectionMatrix();

    pw = w * .89;
    ph = w < 640 ? h - 32 : h * .83;
    port = h > w * 1.05;

    S = Math.max(pw / 1730, .42);
    U.uR.value = 300 * S;

    draw();
    build();
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function pick(event) {
    const rect = cv.getBoundingClientRect();

    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -(((event.clientY - rect.top) / rect.height) * 2 - 1)
    );

    raycaster.setFromCamera(pointer, cam);

    const hits = raycaster.intersectObjects(gm);
    return hits.length ? hits[0].object.userData.i : -1;
  }

  function handlePointer(event) {
    const rect = cv.getBoundingClientRect();

    mx = ((event.clientX - rect.left) / rect.width - .5) * 2;
    my = ((event.clientY - rect.top) / rect.height - .5) * 2;

    pg = [
      event.clientX - rect.left - rect.width / 2,
      -(event.clientY - rect.top - rect.height / 2)
    ];

    U.uM.value.set(pg[0], pg[1], 0);
    tgt = 1;

    const selected = pick(event);

    if (selected !== hov) {
      hov = selected;
      draw();
      cv.style.cursor = selected >= 0 && ROUTE[selected]
        ? "pointer"
        : "default";
    }
  }

  cv.addEventListener("pointermove", handlePointer);
  cv.addEventListener("pointerdown", handlePointer);

  cv.addEventListener("pointerleave", () => {
    tgt = 0;
    mx = 0;
    my = 0;

    if (hov !== -1) {
      hov = -1;
      draw();
    }
  });

  cv.addEventListener("click", event => {
    const selected = pick(event);

    if (selected >= 0 && ROUTE[selected]) {
      location.hash = ROUTE[selected];
    }
  });

  const easeBack = q =>
    1 + 2.70158 * Math.pow(q - 1, 3)
      + 1.70158 * Math.pow(q - 1, 2);

  function update(dt) {
    if (an) {
      an.t += dt;
      let finished = true;

      for (let i = 0; i < 5; i++) {
        const q = Math.min(
          1,
          Math.max(0, (an.t - i * .04) / .72)
        );

        if (q < 1) finished = false;
        sp[i] = an.dir ? q * q * q : 1 - easeBack(q);
      }

      if (finished) {
        const callback = an.cb;
        an = null;
        if (callback) callback();
      }
    }

    U.uG.value += (tgt - U.uG.value)
      * (1 - Math.exp(-dt / .18));

    const smoothing = 1 - Math.exp(-dt / .3);

    rx += ((my * 5.5 - .8) * Math.PI / 180 - rx) * smoothing;
    ry += ((mx * 7 - 1.2) * Math.PI / 180 - ry) * smoothing;

    blk.rotation.set(rx, ry, 0);

    for (let i = 0; i < 5; i++) {
      const highlighted = hov === i;
      const center = bp[i];

      const targetRotation = [
        highlighted
          ? -Math.max(-1, Math.min(1, (pg[1] - center[1]) / (ph * .2))) * .24
          : 0,
        highlighted
          ? Math.max(-1, Math.min(1, (pg[0] - center[0]) / (pw * .2))) * .24
          : 0
      ];

      const stiffness = 170;
      const damping = 19;

      vz[i] += (
        stiffness * ((highlighted ? 50 * S : 0) - lz[i])
        - damping * vz[i]
      ) * dt;

      lz[i] += vz[i] * dt;

      for (let axis = 0; axis < 2; axis++) {
        tv[i][axis] += (
          stiffness * (targetRotation[axis] - tp[i][axis])
          - damping * tv[i][axis]
        ) * dt;

        tp[i][axis] += tv[i][axis] * dt;
      }

      const amount = Math.max(0, Math.min(1, lz[i] / (50 * S)));
      ms[i].iridescence = .55 + .45 * amount;
      ms[i].envMapIntensity = 1 + .9 * amount;
    }

    for (let i = 0; i < 5; i++) {
      const scale = sp[i];
      const center = bp[i];
      const length = Math.hypot(center[0], center[1]) || 1;

      const dx = center[0] / length;
      const dy = center[1] / length;

      const group = out[i];

      group.position.set(
        center[0] + dx * pw * .55 * scale,
        center[1] + dy * ph * .3 * scale - ph * .55 * scale * scale,
        Math.min(RD[i].zf * S, cam.position.z * .5) * scale
      );

      group.quaternion.setFromAxisAngle(
        RD[i].ax,
        RD[i].tum * scale
      );

      inn[i].position.z = lz[i];
      inn[i].rotation.set(tp[i][0], tp[i][1], 0);
    }
  }

  const GL = {
    ok: true,
    fly(direction, callback) {
      an = { t: 0, dir: direction, cb: callback };

      if (!active) active = true;
      startLoop();
    }
  };

  function loop(time) {
    raf = 0;

    if (!GL.on) return;

    raf = requestAnimationFrame(loop);

    const dt = Math.min(.05, (time - last) / 1000 || .016);
    last = time;

    update(dt);
    R.render(sc, cam);
  }

  function startLoop() {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  }

  Object.defineProperty(GL, "on", {
    get: () => active,
    set(value) {
      active = value;
      if (value) startLoop();
    }
  });

  window.GL = GL;

  new ResizeObserver(resize).observe(host);

  if (document.fonts) {
    document.fonts.load("500 40px Inter").then(draw);
  }

  host.classList.add("gl");
  resize();

  if (document.getElementById("home").classList.contains("on")) {
    GL.on = true;
    GL.fly(0);
  }
} catch (error) {
  console.warn("TENSILE 3D is unavailable:", error);
}
