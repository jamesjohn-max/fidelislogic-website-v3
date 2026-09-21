import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { HEIGHTS } from "../../../lib/roomSightlines";

// Seated people for the 3D room, as smooth white mannequins — the classic "3D people"
// figure — in adult proportions, sitting back in the chair with knees bent and feet on the
// floor, forearms on the table (or hands on their thighs where there's no table), and
// each one's head turned toward the screen they'd be watching.
//
// Built facing -z around the chair's centre, like the chairs. The head's centre stays
// exactly where the sightline maths puts it (HEIGHTS.head above the seat's centre), so
// a head drawn in the way is a head counted in the way. Each figure is merged into two
// meshes (body and head), so a full town hall still renders smoothly.

export const MANNEQUIN_COLOR = 0xf3f3f1;
const FACETS = 24; // sides on each limb: enough to read as smooth

const UP = new THREE.Vector3(0, 1, 0);
const v = (x, y, z) => new THREE.Vector3(x, y, z);

// A small, repeatable random sequence per seat, for slight differences in posture.
function random(seed) {
  let t = (seed * 2654435761) >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Collects placed pieces of geometry, then merges them into one.
class Parts {
  constructor() {
    this.items = [];
  }

  add(geometry, position, { quaternion, scale, rotation } = {}) {
    const q = quaternion || (rotation ? new THREE.Quaternion().setFromEuler(rotation) : new THREE.Quaternion());
    this.items.push(geometry.applyMatrix4(new THREE.Matrix4().compose(position, q, scale || v(1, 1, 1))));
  }

  // A limb tapering from radius r1 at a to r2 at b, with a rounded joint at a.
  limb(a, b, r1, r2, joint = true) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const length = dir.length();
    const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
    this.add(new THREE.CylinderGeometry(r2, r1, length, FACETS, 1), a.clone().lerp(b, 0.5), { quaternion: q });
    if (joint) this.add(new THREE.SphereGeometry(r1 * 1.02, FACETS, 16), a);
  }

  merge(material) {
    const merged = mergeGeometries(this.items);
    this.items.forEach((g) => g.dispose());
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
}

// The torso, hips to shoulders, as a turned profile squashed front to back.
const TORSO_PROFILE = [
  [0.0, 0.0], [0.15, 0.0], [0.168, 0.07], [0.138, 0.2], [0.145, 0.29], [0.168, 0.39], [0.172, 0.45], [0.12, 0.5], [0.045, 0.52], [0.0, 0.52],
].map(([x, y]) => new THREE.Vector2(x, y));

// A mannequin's head: an ellipsoid with a tapered jaw, a chin and the suggestion of a
// nose and brow, smooth like the rest.
function headGeometry() {
  const g = new THREE.SphereGeometry(1, 48, 36);
  const pos = g.attributes.position;
  const p = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    const front = Math.max(0, -p.z);
    let x = p.x * 0.076, y = p.y * 0.112, z = p.z * 0.096;
    // Fuller at the back of the skull, narrower toward the chin.
    if (p.z > 0) z *= 1 + 0.12 * p.z * Math.max(0, p.y + 0.3);
    const below = Math.max(0, -p.y - 0.15);
    x *= 1 - 0.38 * below * front;
    y -= 0.01 * below * front;
    // Nose and brow.
    const nose = Math.exp(-((p.x / 0.18) ** 2 + ((p.y + 0.18) / 0.22) ** 2)) * front;
    const brow = Math.exp(-((p.x / 0.6) ** 2 + ((p.y - 0.28) / 0.12) ** 2)) * front;
    z -= 0.016 * nose + 0.005 * brow;
    pos.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

export function createPeopleKit() {
  // Soft, bright white, like the classic 3D-people figures.
  const material = new THREE.MeshStandardMaterial({ color: MANNEQUIN_COLOR, roughness: 0.42, metalness: 0, emissive: MANNEQUIN_COLOR, emissiveIntensity: 0.14 });
  const head = headGeometry();

  // `pose` is "table" (forearms on the table) or "lap". `look` turns the head (and a
  // little of the shoulders) by {yaw, pitch} in degrees from the way the chair faces.
  function makePerson(index, { pose = "table", look = { yaw: 0, pitch: 0 } } = {}) {
    const rand = random(index + 1);
    const jitter = (amount) => (rand() - 0.5) * amount;
    const build = 0.95 + rand() * 0.1; // shoulder width
    const person = new THREE.Group();
    const body = new Parts();

    // Hips, sitting back in the seat.
    const hipY = HEIGHTS.chairSeat + 0.1;
    const hipZ = 0.04;

    // Legs: thighs along the seat, knees bent, shins down to the floor, feet forward.
    const spread = 0.02 + rand() * 0.04;
    const footForward = rand() * 0.06;
    [-1, 1].forEach((side) => {
      const hip = v(side * 0.09 * build, hipY, hipZ);
      const knee = v(side * (0.1 + spread), hipY - 0.005, -0.37);
      const ankle = v(side * (0.11 + spread), 0.085, -0.4 - footForward);
      body.limb(hip, knee, 0.078, 0.056);
      body.limb(knee, ankle, 0.053, 0.034);
      body.add(new THREE.SphereGeometry(0.036, FACETS, 16), ankle);
      // Foot: a rounded wedge from heel to toe.
      const foot = new THREE.CapsuleGeometry(0.035, 0.16, 8, FACETS);
      body.add(foot, v(ankle.x, 0.04, ankle.z - 0.085), { rotation: new THREE.Euler(-Math.PI / 2 + 0.06, 0, 0), scale: v(1.15, 1, 0.8) });
    });

    // Torso: leaning back a touch, shoulders turned a little toward where they look.
    const torsoRot = new THREE.Euler(0.07, (-look.yaw * 0.15 * Math.PI) / 180, 0, "YXZ");
    const torsoBase = v(0, hipY - 0.06, hipZ + 0.02);
    body.add(new THREE.LatheGeometry(new THREE.SplineCurve(TORSO_PROFILE).getPoints(40), FACETS + 8), torsoBase, { rotation: torsoRot, scale: v(1.08 * build, 1, 0.62) });
    const torsoQ = new THREE.Quaternion().setFromEuler(torsoRot);
    const onTorso = (x, y, z) => v(x, y, z).applyQuaternion(torsoQ).add(torsoBase);
    // Neck, up to the head.
    body.limb(onTorso(0, 0.48, -0.01), v(0, HEIGHTS.head - 0.07, 0.015), 0.05, 0.042, false);

    // Arms: shoulders down to elbows by the sides, then forearms onto the table or
    // hands resting on the thighs.
    [-1, 1].forEach((side) => {
      const shoulder = onTorso(side * 0.185 * build, 0.445, 0.0);
      const onTable = pose === "table";
      const elbow = onTable
        ? v(side * 0.22 * build, HEIGHTS.table + 0.02, -0.1 + jitter(0.06))
        : v(side * 0.21 * build, hipY + 0.2, -0.02 + jitter(0.04));
      const wrist = onTable
        ? v(side * (0.15 + jitter(0.04)), HEIGHTS.table + 0.03, -0.38 + jitter(0.06))
        : v(side * (0.13 + jitter(0.03)), hipY + 0.09, -0.25 + jitter(0.05));
      body.limb(shoulder, elbow, 0.048, 0.037);
      body.limb(elbow, wrist, 0.036, 0.027);
      // Hand: a soft, flattened mitten carrying on from the forearm.
      const reach = new THREE.Vector3().subVectors(wrist, elbow).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(v(0, 0, -1), reach);
      body.add(new THREE.SphereGeometry(1, FACETS, 16), wrist.clone().addScaledVector(reach, 0.05), { quaternion: q, scale: v(0.042, 0.018, 0.06) });
    });

    person.add(body.merge(material));

    // Head: turned toward what they're watching.
    const headMesh = new THREE.Mesh(head, material);
    headMesh.castShadow = true;
    headMesh.userData.isHead = true;
    const headGroup = new THREE.Group();
    headGroup.add(headMesh);
    headGroup.position.set(0, HEIGHTS.head, 0);
    headGroup.rotation.set((look.pitch * Math.PI) / 180, (-look.yaw * Math.PI) / 180, 0, "YXZ");
    person.add(headGroup);

    return { person, headMeshes: [{ mesh: headMesh, material }] };
  }

  return {
    makePerson,
    dispose() {
      head.dispose();
      material.dispose();
    },
  };
}
