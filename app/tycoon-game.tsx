"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type PlaceableKind =
  | "rifleman"
  | "assault"
  | "eliteAssault"
  | "sniper"
  | "eliteSniper"
  | "rocketeer"
  | "machineGunner"
  | "juggernaut"
  | "defender"
  | "medic"
  | "cannon"
  | "sandbags"
  | "barbedWire"
  | "bunker"
  | "antiAir"
  | "mortar"
  | "artillery";
type EnemyKind = "raider" | "enemyRocketeer" | "doublePistol" | "car" | "tank" | "helicopter";
type TargetType = "ground" | "air";
type TutorialStage = "intro" | "buy" | "deploy" | "wave" | "done";

type PlaceableDef = {
  key: PlaceableKind;
  name: string;
  cost: number;
  damage: number;
  range: number;
  rate: number;
  color: number;
  targets: "ground" | "air" | "all";
  description: string;
};

type Enemy = {
  id: number;
  kind: EnemyKind;
  group: THREE.Group;
  health: number;
  maxHealth: number;
  damage: number;
  range: number;
  speed: number;
  bounty: number;
  attackTimer: number;
  targetType: TargetType;
};

type SlotState = {
  unlocked: boolean;
  troop: PlaceableKind | null;
  buildKind?: PlaceableKind;
  cost?: number;
  health?: number;
  maxHealth?: number;
  parentIndex?: number;
};

type Snapshot = {
  gold: number;
  tutorialOpen: boolean;
  tutorialStage: TutorialStage;
  baseHealth: number;
  wave: number;
  enemies: number;
  checkpoint: number;
  nearTent: boolean;
  shopOpen: boolean;
  slotMenuOpen: boolean;
  menuSlot: number | null;
  nearSlot: number | null;
  inventory: Record<PlaceableKind, number>;
  slots: SlotState[];
  holdProgress: number;
  notice: string;
};

const BASE_MAX_HEALTH = 200;
const STARTING_GOLD = 100;
const SLOT_COST = 120;
const TENT_POSITION = new THREE.Vector3(-9.4, 0, 3.2);
const INTERACT_RADIUS = 2.25;
const GUARD_TOWER_SLOT_INDEX = 6;

const TROOPS: PlaceableDef[] = [
  {
    key: "rifleman",
    name: "Rifleman",
    cost: 45,
    damage: 9,
    range: 6,
    rate: 0.85,
    color: 0x5fa96b,
    targets: "ground",
    description: "Cheap steady defender"
  },
  {
    key: "assault",
    name: "Assault",
    cost: 70,
    damage: 13,
    range: 6.5,
    rate: 0.72,
    color: 0x4f9f78,
    targets: "ground",
    description: "Standard multi-purpose frontline infantryman"
  },
  {
    key: "eliteAssault",
    name: "Elite Assault",
    cost: 165,
    damage: 19,
    range: 7,
    rate: 0.48,
    color: 0x3f78bd,
    targets: "ground",
    description: "Boosted fire rate and durability"
  },
  {
    key: "sniper",
    name: "Sniper",
    cost: 95,
    damage: 26,
    range: 11,
    rate: 1.55,
    color: 0x5d85d7,
    targets: "ground",
    description: "Long range heavy shot"
  },
  {
    key: "eliteSniper",
    name: "Elite Sniper",
    cost: 210,
    damage: 42,
    range: 13,
    rate: 1.35,
    color: 0x314f8f,
    targets: "ground",
    description: "High-tier long-range marksman"
  },
  {
    key: "rocketeer",
    name: "Rocketeer",
    cost: 130,
    damage: 38,
    range: 8.5,
    rate: 2.1,
    color: 0xe59a4f,
    targets: "ground",
    description: "Slow splashy burst"
  },
  {
    key: "machineGunner",
    name: "Machine Gunner",
    cost: 150,
    damage: 8,
    range: 7.5,
    rate: 0.2,
    color: 0x68746f,
    targets: "ground",
    description: "Rapid sustained fire"
  },
  {
    key: "juggernaut",
    name: "Juggernaut",
    cost: 220,
    damage: 34,
    range: 6.8,
    rate: 1.25,
    color: 0x4f5964,
    targets: "ground",
    description: "Heavy armored soldier"
  },
  {
    key: "defender",
    name: "Defender",
    cost: 190,
    damage: 12,
    range: 5.8,
    rate: 0.8,
    color: 0x56645d,
    targets: "ground",
    description: "Durable anchor that draws enemy fire"
  },
  {
    key: "medic",
    name: "Medic",
    cost: 110,
    damage: 4,
    range: 5.5,
    rate: 1.0,
    color: 0xe8e0c0,
    targets: "ground",
    description: "Weak attack, repairs base"
  },
  {
    key: "cannon",
    name: "Cannon",
    cost: 180,
    damage: 58,
    range: 9.5,
    rate: 2.7,
    color: 0x8f9296,
    targets: "ground",
    description: "Huge base weapon"
  },
  {
    key: "sandbags",
    name: "Sandbags",
    cost: 65,
    damage: 7,
    range: 5,
    rate: 1.05,
    color: 0xc0a56a,
    targets: "ground",
    description: "Cheap fortified gunner"
  },
  {
    key: "barbedWire",
    name: "Barbed Wire",
    cost: 80,
    damage: 5,
    range: 2.4,
    rate: 0.36,
    color: 0xa2a8a0,
    targets: "ground",
    description: "Close-range ground trap"
  },
  {
    key: "bunker",
    name: "Bunker",
    cost: 160,
    damage: 18,
    range: 7.5,
    rate: 0.75,
    color: 0x657062,
    targets: "ground",
    description: "Armored ground defense"
  },
  {
    key: "antiAir",
    name: "Anti-Air",
    cost: 190,
    damage: 42,
    range: 12,
    rate: 1.15,
    color: 0x73a9b4,
    targets: "air",
    description: "Only attacks helicopters"
  },
  {
    key: "mortar",
    name: "Mortar",
    cost: 300,
    damage: 62,
    range: 12.5,
    rate: 2.45,
    color: 0x777b72,
    targets: "ground",
    description: "Arcing ground explosive"
  },
  {
    key: "artillery",
    name: "Artillery",
    cost: 380,
    damage: 82,
    range: 14,
    rate: 3.2,
    color: 0x6c6960,
    targets: "ground",
    description: "Very long range ground cannon"
  }
];

const SLOT_POSITIONS = [
  new THREE.Vector3(-5.4, 0, 5.1),
  new THREE.Vector3(5.4, 0, 5.1),
  new THREE.Vector3(0, 0, 4),
  new THREE.Vector3(-1.1, 0, 3.2),
  new THREE.Vector3(1.1, 0, 3.2),
  new THREE.Vector3(7.3, 0, 2.2),
  new THREE.Vector3(6.2, 0, 1.3),
  new THREE.Vector3(7.5, 0, 0.8),
  new THREE.Vector3(8.6, 0, 1.8),
  new THREE.Vector3(-3.3, 0, 1.1),
  new THREE.Vector3(3.3, 0, 1.1),
  new THREE.Vector3(0, 0, 13.2),
  new THREE.Vector3(0, 0, -1.35)
];

const STARTING_SLOTS: SlotState[] = [
  { unlocked: true, troop: "rifleman" },
  { unlocked: true, troop: null },
  { unlocked: true, troop: "sandbags", buildKind: "sandbags", cost: 170 },
  { unlocked: true, troop: null, parentIndex: 2 },
  { unlocked: true, troop: null, parentIndex: 2 },
  { unlocked: false, troop: null, buildKind: "bunker", cost: 260 },
  { unlocked: true, troop: null, parentIndex: 5 },
  { unlocked: true, troop: null, parentIndex: 5 },
  { unlocked: true, troop: null, parentIndex: 5 },
  { unlocked: false, troop: null, buildKind: "antiAir", cost: 320 },
  { unlocked: false, troop: null, buildKind: "barbedWire", cost: 145 },
  { unlocked: true, troop: null },
  { unlocked: false, troop: null, buildKind: "artillery", cost: 430 }
];

const SHOP_ITEMS = TROOPS.filter(
  (troop) =>
    !["sandbags", "bunker", "antiAir", "barbedWire", "mortar", "artillery"].includes(troop.key)
);

function createEmptyInventory(): Record<PlaceableKind, number> {
  return TROOPS.reduce(
    (inventory, troop) => ({ ...inventory, [troop.key]: 0 }),
    {} as Record<PlaceableKind, number>
  );
}

function currency(value: number) {
  return `${Math.floor(value).toLocaleString()}g`;
}

function troopDef(kind: PlaceableKind) {
  return TROOPS.find((troop) => troop.key === kind)!;
}

function maxHealthFor(kind: PlaceableKind) {
  if (kind === "sandbags") return 120;
  if (kind === "bunker") return 260;
  if (kind === "barbedWire") return 90;
  if (kind === "antiAir") return 170;
  if (kind === "mortar") return 190;
  if (kind === "artillery") return 230;
  if (kind === "defender") return 230;
  if (kind === "juggernaut") return 170;
  if (kind === "eliteAssault") return 145;
  if (kind === "eliteSniper") return 115;
  if (kind === "machineGunner") return 120;
  if (kind === "cannon") return 145;
  return kind === "medic" ? 80 : 100;
}

function isSlotActive(slot: SlotState, slots: SlotState[]) {
  return slot.parentIndex === undefined || Boolean(slots[slot.parentIndex]?.troop);
}

function createHumanoid(color: number, trim: number, scale = 1) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.48 });
  const trimMat = new THREE.MeshStandardMaterial({ color: trim, roughness: 0.42 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf1c6a2, roughness: 0.55 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.82, 12), bodyMat);
  body.position.y = 0.72;
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), skinMat);
  head.position.y = 1.28;
  head.castShadow = true;
  group.add(head);

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    trimMat
  );
  helmet.position.y = 1.36;
  helmet.castShadow = true;
  group.add(helmet);

  const weapon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.08), trimMat);
  weapon.position.set(0.36, 0.83, 0.06);
  weapon.rotation.z = -0.5;
  weapon.castShadow = true;
  group.add(weapon);

  group.scale.setScalar(scale);
  return group;
}

function createTroopModel(kind: PlaceableKind) {
  const def = troopDef(kind);
  if (kind === "barbedWire") {
    const group = new THREE.Group();
    const wireMat = new THREE.MeshStandardMaterial({ color: 0xa2a8a0, metalness: 0.45, roughness: 0.36 });
    for (let i = 0; i < 3; i += 1) {
      const strand = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 8, 24), wireMat);
      strand.rotation.x = Math.PI / 2;
      strand.position.set((i - 1) * 0.48, 0.32, 0);
      strand.castShadow = true;
      group.add(strand);
    }
    const postMat = new THREE.MeshStandardMaterial({ color: 0x5c4b37, roughness: 0.7 });
    for (const x of [-0.85, 0.85]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.72, 8), postMat);
      post.position.set(x, 0.35, 0);
      post.castShadow = true;
      group.add(post);
    }
    return group;
  }
  if (kind === "sandbags") {
    const group = new THREE.Group();
    const bagMat = new THREE.MeshStandardMaterial({ color: 0xc0a56a, roughness: 0.82 });
    for (let row = 0; row < 2; row += 1) {
      for (let i = 0; i < 3; i += 1) {
        const bag = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.34), bagMat);
        bag.position.set((i - 1) * 0.5, 0.14 + row * 0.22, -0.18);
        bag.rotation.y = (i - 1) * 0.12;
        bag.castShadow = true;
        group.add(bag);
      }
    }
    const gunner = createHumanoid(0x5fa96b, 0x26343d, 0.72);
    gunner.position.set(0, 0.1, 0.35);
    group.add(gunner);
    return group;
  }
  if (kind === "bunker") {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.72, 1),
      new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.7 })
    );
    body.position.y = 0.44;
    body.castShadow = true;
    group.add(body);
    const slit = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.16, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x151a17 })
    );
    slit.position.set(0, 0.56, -0.53);
    group.add(slit);
    return group;
  }
  if (kind === "cannon" || kind === "antiAir" || kind === "mortar" || kind === "artillery") {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(kind === "artillery" || kind === "mortar" ? 1.2 : 0.88, 0.5, kind === "artillery" || kind === "mortar" ? 0.92 : 0.72),
      new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.44 })
    );
    body.position.y = 0.38;
    body.castShadow = true;
    group.add(body);
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(kind === "artillery" || kind === "mortar" ? 0.15 : 0.12, kind === "artillery" || kind === "mortar" ? 0.15 : 0.12, kind === "artillery" || kind === "mortar" ? 1.35 : 0.95, 16),
      new THREE.MeshStandardMaterial({ color: 0x25282a, roughness: 0.38 })
    );
    barrel.rotation.x = kind === "antiAir" ? Math.PI / 3 : kind === "mortar" ? Math.PI / 2.7 : Math.PI / 2;
    barrel.position.set(0, kind === "antiAir" ? 0.72 : 0.5, kind === "artillery" || kind === "mortar" ? -0.78 : -0.58);
    barrel.castShadow = true;
    group.add(barrel);
    if (kind === "antiAir") {
      const operator = createHumanoid(0x5d85d7, 0x26343d, 0.62);
      operator.position.set(0.58, 0.05, 0.18);
      group.add(operator);
    }
    return group;
  }
  return createHumanoid(
    def.color,
    kind === "medic" ? 0x57d9c0 : 0x26343d,
    kind === "rocketeer" ? 1.08 : kind === "juggernaut" ? 1.25 : 1
  );
}

function createTerrain() {
  const group = new THREE.Group();
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x40543d, roughness: 0.9 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x6d7169, roughness: 0.82 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d422c, roughness: 0.7 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f5c38, roughness: 0.8 });

  for (const [x, z, sx, sz] of [
    [-12, -7, 4.8, 7],
    [12, -9, 5.4, 8],
    [-12.5, 9, 4, 5.4],
    [12.2, 10, 4.6, 5]
  ]) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10), hillMat);
    hill.scale.set(sx, 0.7, sz);
    hill.position.set(x, -0.35, z);
    hill.receiveShadow = true;
    group.add(hill);
  }

  for (let i = 0; i < 18; i += 1) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28 + Math.random() * 0.22), rockMat);
    rock.position.set(THREE.MathUtils.randFloatSpread(27), 0.16, -16 + Math.random() * 27);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    group.add(rock);
  }

  for (const x of [-13.2, -11.4, 10.8, 12.8, -9.5, 9.4]) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.9, 8), trunkMat);
    trunk.position.y = 0.45;
    tree.add(trunk);
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.25, 9), leafMat);
    leaves.position.y = 1.28;
    leaves.castShadow = true;
    tree.add(leaves);
    tree.position.set(x, 0, -12 + Math.random() * 22);
    group.add(tree);
  }

  return group;
}

function createGuardTower() {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x6b5135, roughness: 0.72 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x4b6653, roughness: 0.55 });
  for (const x of [-0.55, 0.55]) {
    for (const z of [-0.55, 0.55]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.5, 8), wood);
      leg.position.set(x, 1.25, z);
      leg.castShadow = true;
      group.add(leg);
    }
  }
  const platform = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.18, 1.65), wood);
  platform.position.y = 2.42;
  platform.castShadow = true;
  group.add(platform);
  const hut = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.8, 1.22), wood);
  hut.position.y = 2.9;
  hut.castShadow = true;
  group.add(hut);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.08, 0.64, 4), roof);
  cap.position.y = 3.62;
  cap.rotation.y = Math.PI / 4;
  cap.castShadow = true;
  group.add(cap);
  group.position.set(SLOT_POSITIONS[GUARD_TOWER_SLOT_INDEX].x, 0, SLOT_POSITIONS[GUARD_TOWER_SLOT_INDEX].z);
  return group;
}

function createBase() {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x737d78, roughness: 0.7 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x4d6656, roughness: 0.52 });
  const keep = new THREE.Mesh(new THREE.BoxGeometry(5.9, 2.3, 3.7), stone);
  keep.position.set(0, 1.15, 10);
  keep.castShadow = true;
  keep.receiveShadow = true;
  group.add(keep);

  for (const x of [-3.6, 3.6]) {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.98, 3.25, 14), stone);
    tower.position.set(x, 1.62, 9.8);
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.72, 14), roof);
    cap.position.set(x, 3.6, 9.8);
    cap.castShadow = true;
    group.add(cap);
  }

  const gate = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 1.35, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x2b201a, roughness: 0.58 })
  );
  gate.position.set(0, 0.68, 7.98);
  group.add(gate);
  return group;
}

function createTent() {
  const group = new THREE.Group();
  const cloth = new THREE.MeshStandardMaterial({ color: 0xb85e4e, roughness: 0.58 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2e3931, roughness: 0.65 });
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(1.55, 1.55, 0.1, 32),
    new THREE.MeshStandardMaterial({
      color: 0xd7b64d,
      emissive: 0x755a10,
      emissiveIntensity: 0.24,
      roughness: 0.5
    })
  );
  pad.position.set(TENT_POSITION.x, 0.05, TENT_POSITION.z);
  pad.receiveShadow = true;
  group.add(pad);

  const base = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.05, 1.8), dark);
  base.position.set(TENT_POSITION.x, 0.62, TENT_POSITION.z - 0.75);
  base.castShadow = true;
  group.add(base);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.65, 1.05, 4), cloth);
  roof.position.set(TENT_POSITION.x, 1.52, TENT_POSITION.z - 0.75);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);
  return group;
}

function createVehicle(kind: EnemyKind) {
  const group = new THREE.Group();
  if (kind === "helicopter") {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 0.45, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x44565d, roughness: 0.42 })
    );
    body.castShadow = true;
    group.add(body);
    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.18, 1.15),
      new THREE.MeshStandardMaterial({ color: 0x39494f, roughness: 0.5 })
    );
    tail.position.z = 0.85;
    group.add(tail);
    const rotor = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.04, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x1c2224, roughness: 0.35 })
    );
    rotor.position.y = 0.36;
    group.add(rotor);
    group.position.y = 3.1;
    return group;
  }

  const tank = kind === "tank";
  const rocket = kind === "enemyRocketeer";
  const pistol = kind === "doublePistol";
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(tank ? 1.45 : 1.15, tank ? 0.62 : 0.5, tank ? 1.35 : 1.05),
    new THREE.MeshStandardMaterial({ color: tank ? 0x5d6658 : rocket ? 0x805646 : pistol ? 0x694f76 : 0x8b4f42, roughness: 0.55 })
  );
  body.position.y = tank ? 0.42 : 0.34;
  body.castShadow = true;
  group.add(body);
  if (tank || rocket) {
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(rocket ? 0.11 : 0.08, rocket ? 0.11 : 0.08, rocket ? 0.72 : 1.1, 12),
      new THREE.MeshStandardMaterial({ color: 0x222820, roughness: 0.45 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.68, -0.86);
    group.add(barrel);
  }
  return group;
}

function makeEnemy(kind: EnemyKind, id: number): Enemy {
  const group = kind === "raider" ? createHumanoid(0xb94f45, 0x211816, 1) : createVehicle(kind);
  group.position.set(THREE.MathUtils.randFloatSpread(9), group.position.y, -18 - Math.random() * 4);
  const stats = {
    raider: { health: 58, damage: 9, range: 1.85, speed: 2.15, bounty: 30, targetType: "ground" as const },
    enemyRocketeer: { health: 76, damage: 16, range: 6.5, speed: 1.75, bounty: 46, targetType: "ground" as const },
    doublePistol: { health: 70, damage: 12, range: 4.8, speed: 2.25, bounty: 42, targetType: "ground" as const },
    car: { health: 90, damage: 13, range: 2.2, speed: 2.7, bounty: 48, targetType: "ground" as const },
    tank: { health: 190, damage: 24, range: 6.8, speed: 1.25, bounty: 95, targetType: "ground" as const },
    helicopter: { health: 115, damage: 17, range: 7.5, speed: 2.05, bounty: 85, targetType: "air" as const }
  }[kind];
  return {
    id,
    kind,
    group,
    health: stats.health,
    maxHealth: stats.health,
    damage: stats.damage,
    range: stats.range,
    speed: stats.speed,
    bounty: stats.bounty,
    attackTimer: 0,
    targetType: stats.targetType
  };
}

function nearestEnemy(from: THREE.Vector3, enemies: Enemy[], def: PlaceableDef) {
  let target: Enemy | null = null;
  let distance = Number.POSITIVE_INFINITY;
  for (const enemy of enemies) {
    if (def.targets !== "all" && def.targets !== enemy.targetType) {
      continue;
    }
    const nextDistance = from.distanceTo(enemy.group.position);
    if (nextDistance < distance) {
      target = enemy;
      distance = nextDistance;
    }
  }
  return { target, distance };
}

function chooseEnemyKind(wave: number): EnemyKind {
  const roll = Math.random();
  if (wave >= 7 && roll > 0.72) {
    return "helicopter";
  }
  if (wave >= 5 && roll > 0.58) {
    return "tank";
  }
  if (wave >= 4 && roll > 0.36) {
    return "enemyRocketeer";
  }
  if (wave >= 3 && roll > 0.42) {
    return "car";
  }
  if (wave >= 2 && roll > 0.58) {
    return "doublePistol";
  }
  return "raider";
}

export function TycoonGame() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const buyTroopRef = useRef<(kind: PlaceableKind) => void>(() => {});
  const closeShopRef = useRef<() => void>(() => {});
  const closeSlotRef = useRef<() => void>(() => {});
  const slotActionRef = useRef<(index: number, kind?: PlaceableKind) => void>(() => {});
  const sellSlotRef = useRef<(index: number) => void>(() => {});
  const startWaveRef = useRef<() => void>(() => {});
  const resetRef = useRef<() => void>(() => {});
  const closeTutorialRef = useRef<() => void>(() => {});
  const [snapshot, setSnapshot] = useState<Snapshot>({
    gold: STARTING_GOLD,
    tutorialOpen: true,
    tutorialStage: "intro",
    baseHealth: BASE_MAX_HEALTH,
    wave: 1,
    enemies: 0,
    checkpoint: 5,
    nearTent: false,
    shopOpen: false,
    slotMenuOpen: false,
    menuSlot: null,
    nearSlot: null,
    inventory: createEmptyInventory(),
    slots: STARTING_SLOTS,
    holdProgress: 0,
    notice: "Use arrow keys. Buy soldiers at the tent. Build stronger defense slots with gold."
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    let gold = STARTING_GOLD;
    let tutorialOpen = true;
    let tutorialStage: TutorialStage = "intro";
    let baseHealth = BASE_MAX_HEALTH;
    let wave = 1;
    let holdProgress = 0;
    let holdTarget: "shop" | number | null = null;
    let inventory = createEmptyInventory();
    let slots: SlotState[] = STARTING_SLOTS.map((slot) => ({ ...slot }));
    slots.forEach((slot) => {
      if (slot.troop) {
        slot.maxHealth = maxHealthFor(slot.troop);
        slot.health = slot.maxHealth;
      }
    });
    let notice = "Run to the tent to buy soldiers. Special slots can be built with gold.";
    let nearTent = false;
    let shopOpen = false;
    let slotMenuOpen = false;
    let menuSlot: number | null = null;
    let tentDismissed = false;
    let dismissedSlot: number | null = null;
    let nearSlot: number | null = null;
    let nextEnemyId = 1;
    let spawnTimer = 0;
    let waveTimer = 0;
    let incomeTimer = 0;
    let uiTimer = 0;
    const keys = new Set<string>();
    const enemies: Enemy[] = [];
    const slotModels: Array<THREE.Group | null> = Array(SLOT_POSITIONS.length).fill(null);
    const slotCooldowns = Array(SLOT_POSITIONS.length).fill(0) as number[];

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x17211d);
    scene.fog = new THREE.Fog(0x17211d, 22, 58);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120);
    scene.add(new THREE.HemisphereLight(0xdfead5, 0x263323, 2.25));
    const sun = new THREE.DirectionalLight(0xfff0ca, 2.5);
    sun.position.set(8, 14, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -24;
    sun.shadow.camera.right = 24;
    sun.shadow.camera.top = 24;
    sun.shadow.camera.bottom = -24;
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(32, 0.32, 42),
      new THREE.MeshStandardMaterial({ color: 0x314336, roughness: 0.84 })
    );
    ground.position.y = -0.16;
    ground.receiveShadow = true;
    scene.add(ground);

    const path = new THREE.Mesh(
      new THREE.BoxGeometry(8.8, 0.04, 31),
      new THREE.MeshStandardMaterial({ color: 0x5d5444, roughness: 0.9 })
    );
    path.position.set(0, 0.04, -4.6);
    path.receiveShadow = true;
    scene.add(path);

    const grid = new THREE.GridHelper(32, 32, 0x51614f, 0x3a4a3b);
    grid.position.y = 0.02;
    scene.add(grid);
    scene.add(createTerrain());
    scene.add(createBase());
    scene.add(createTent());
    scene.add(createGuardTower());

    const player = createHumanoid(0xe5c65b, 0x3f6e92, 1.08);
    player.position.set(0, 0, 3.9);
    scene.add(player);

    const shopRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.7, 0.035, 8, 56),
      new THREE.MeshStandardMaterial({ color: 0xf1d36b, emissive: 0xb99119, emissiveIntensity: 0.65 })
    );
    shopRing.position.set(TENT_POSITION.x, 0.14, TENT_POSITION.z);
    shopRing.rotation.x = Math.PI / 2;
    scene.add(shopRing);

    const slotRings = SLOT_POSITIONS.map((position, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.78, 0.035, 8, 48),
        new THREE.MeshStandardMaterial({
          color: slots[index].unlocked ? 0x6bd487 : 0x6c6f67,
          emissive: slots[index].unlocked ? 0x255f32 : 0x222222,
          emissiveIntensity: 0.45
        })
      );
      ring.position.set(position.x, index === GUARD_TOWER_SLOT_INDEX ? 2.62 : 0.17, position.z);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
      return ring;
    });

    function disposeGroup(group: THREE.Group) {
      scene.remove(group);
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
    }

    function rebuildSlotModel(index: number) {
      if (slotModels[index]) {
        disposeGroup(slotModels[index]!);
        slotModels[index] = null;
      }
      const troop = slots[index].troop;
      if (!isSlotActive(slots[index], slots)) {
        return;
      }
      if (!troop) {
        return;
      }
      const model = createTroopModel(troop);
      const position = SLOT_POSITIONS[index];
      model.position.set(position.x, index === GUARD_TOWER_SLOT_INDEX ? 2.72 : 0.22, position.z);
      scene.add(model);
      slotModels[index] = model;
    }

    slots.forEach((_, index) => rebuildSlotModel(index));

    function pushSnapshot(force = false) {
      uiTimer = force ? 1 : uiTimer;
      if (uiTimer < 0.12) {
        return;
      }
      uiTimer = 0;
      setSnapshot({
        gold,
        tutorialOpen,
        tutorialStage,
        baseHealth,
        wave,
        enemies: enemies.length,
        checkpoint: Math.ceil(wave / 5) * 5,
        nearTent,
        shopOpen,
        slotMenuOpen,
        menuSlot,
        nearSlot,
        inventory: { ...inventory },
        slots: slots.map((slot) => ({ ...slot })),
        holdProgress,
        notice
      });
    }

    function buyTroop(kind: PlaceableKind) {
      const def = troopDef(kind);
      if (!shopOpen) {
        notice = "Open the tent shop first.";
        pushSnapshot(true);
        return;
      }
      if (gold < def.cost) {
        notice = `Need ${currency(def.cost - gold)} more for ${def.name}.`;
        pushSnapshot(true);
        return;
      }
      gold -= def.cost;
      inventory[kind] += 1;
      if (tutorialStage === "buy") {
        tutorialStage = "deploy";
        notice = `${def.name} added to inventory. Run to the empty slot and hold on the circle.`;
      } else {
        notice = `${def.name} added to inventory. Place it on an unlocked slot.`;
      }
      pushSnapshot(true);
    }
    buyTroopRef.current = buyTroop;

    closeShopRef.current = () => {
      shopOpen = false;
      tentDismissed = true;
      notice = "Shop closed.";
      pushSnapshot(true);
    };

    closeTutorialRef.current = () => {
      tutorialOpen = false;
      tutorialStage = "buy";
      notice = "Go to the tent circle and hold there to open the shop.";
      pushSnapshot(true);
    };

    closeSlotRef.current = () => {
      dismissedSlot = menuSlot;
      slotMenuOpen = false;
      menuSlot = null;
      notice = "Slot menu closed.";
      pushSnapshot(true);
    };

    function slotAction(index: number, kind?: PlaceableKind) {
      if (index < 0 || index >= slots.length) {
        return;
      }
      if (nearSlot !== index) {
        notice = "Run onto that base slot first.";
        pushSnapshot(true);
        return;
      }
      const slot = slots[index];
      if (!slot.unlocked) {
        const slotCost = slot.cost ?? SLOT_COST;
        if (gold < slotCost) {
          notice = `Need ${currency(slotCost - gold)} more to unlock this slot.`;
          pushSnapshot(true);
          return;
        }
        gold -= slotCost;
        slot.unlocked = true;
        if (slot.buildKind) {
          slot.troop = slot.buildKind;
          slot.maxHealth = maxHealthFor(slot.buildKind);
          slot.health = slot.maxHealth;
          rebuildSlotModel(index);
          notice = `${troopDef(slot.buildKind).name} built on this slot.`;
        } else {
          notice = "New base slot unlocked.";
        }
        pushSnapshot(true);
        return;
      }
      if (slot.troop) {
        notice = "That slot already has a troop.";
        pushSnapshot(true);
        return;
      }
      if (!kind) {
        notice = "Choose something from your inventory for this slot.";
        pushSnapshot(true);
        return;
      }
      if (inventory[kind] <= 0) {
        notice = `No ${troopDef(kind).name} in inventory. Buy one at the tent.`;
        pushSnapshot(true);
        return;
      }
      inventory[kind] -= 1;
      slot.troop = kind;
      slot.maxHealth = maxHealthFor(kind);
      slot.health = slot.maxHealth;
      rebuildSlotModel(index);
      if (tutorialStage === "deploy") {
        tutorialStage = "wave";
        notice = `${troopDef(kind).name} placed. Use the training button to start Wave 1.`;
      } else {
        notice = `${troopDef(kind).name} placed on the base.`;
      }
      pushSnapshot(true);
    }
    slotActionRef.current = slotAction;

    function sellSlot(index: number) {
      if (index < 0 || index >= slots.length) {
        return;
      }
      const slot = slots[index];
      if (!slot.unlocked || !slot.troop) {
        notice = "Nothing to sell on this slot.";
        pushSnapshot(true);
        return;
      }
      const soldKind = slot.troop;
      const refund = Math.floor((slot.cost ?? troopDef(soldKind).cost) * 0.5);
      gold += refund;
      slot.troop = null;
      slot.health = undefined;
      slot.maxHealth = undefined;
      if (slot.buildKind) {
        slot.unlocked = false;
      }
      rebuildSlotModel(index);
      notice = `${troopDef(soldKind).name} sold for ${currency(refund)}.`;
      pushSnapshot(true);
    }
    sellSlotRef.current = sellSlot;

    function addEnemy(kind: EnemyKind) {
      const enemy = makeEnemy(kind, nextEnemyId++);
      enemies.push(enemy);
      scene.add(enemy.group);
    }

    function removeEnemy(enemy: Enemy) {
      const index = enemies.indexOf(enemy);
      if (index >= 0) {
        enemies.splice(index, 1);
      }
      disposeGroup(enemy.group);
    }

    startWaveRef.current = () => {
      if (tutorialStage !== "wave") {
        return;
      }
      tutorialStage = "done";
      spawnTimer = 0;
      waveTimer = 0;
      addEnemy("raider");
      addEnemy("raider");
      notice = "Wave 1 started. Defend the base.";
      pushSnapshot(true);
    };

    function resetBattle() {
      enemies.slice().forEach(removeEnemy);
      slotModels.forEach((model, index) => {
        if (model) {
          disposeGroup(model);
          slotModels[index] = null;
        }
      });
      gold = STARTING_GOLD;
      baseHealth = BASE_MAX_HEALTH;
      wave = 1;
      inventory = createEmptyInventory();
      slots = STARTING_SLOTS.map((slot) => ({ ...slot }));
      slots.forEach((slot) => {
        if (slot.troop) {
          slot.maxHealth = maxHealthFor(slot.troop);
          slot.health = slot.maxHealth;
        }
      });
      slots.forEach((_, index) => rebuildSlotModel(index));
      player.position.set(0, 0, 3.9);
      shopOpen = false;
      slotMenuOpen = false;
      tutorialOpen = true;
      tutorialStage = "intro";
      menuSlot = null;
      tentDismissed = false;
      dismissedSlot = null;
      notice = "Battle reset. Training is ready.";
      pushSnapshot(true);
    }
    resetRef.current = resetBattle;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key.startsWith("arrow")) {
        event.preventDefault();
      }
      keys.add(key);
      if (key === "escape" && tutorialOpen) {
        closeTutorialRef.current();
        return;
      }
      if (key === "escape" && (shopOpen || slotMenuOpen)) {
        if (shopOpen) {
          shopOpen = false;
          tentDismissed = true;
        }
        if (slotMenuOpen) {
          dismissedSlot = menuSlot;
          slotMenuOpen = false;
          menuSlot = null;
        }
        notice = "Menu closed.";
        pushSnapshot(true);
        return;
      }
      if (key === "e" && !tutorialOpen) {
        if (nearTent && !shopOpen && !slotMenuOpen) {
          shopOpen = true;
          notice = "Shop open.";
          pushSnapshot(true);
        } else if (!shopOpen && !slotMenuOpen && nearSlot !== null) {
          slotAction(nearSlot);
        }
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key.startsWith("arrow")) {
        event.preventDefault();
      }
      keys.delete(key);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(1, rect.height);
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    let frameId = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const dt = Math.min(0.04, clock.getDelta());
      const elapsed = clock.elapsedTime;
      const menuOpen = tutorialOpen || shopOpen || slotMenuOpen;
      const waveLockedForTraining = tutorialStage !== "done";
      uiTimer += dt;
      if (!menuOpen) {
        incomeTimer += dt;
        if (!waveLockedForTraining) {
          spawnTimer += dt;
          waveTimer += dt;
        }
      }

      if (!menuOpen && incomeTimer > 1) {
        incomeTimer = 0;
        gold += 8 + slots.filter((slot) => slot.troop).length * 2;
        if (slots.some((slot) => slot.troop === "medic")) {
          baseHealth = Math.min(BASE_MAX_HEALTH, baseHealth + slots.filter((slot) => slot.troop === "medic").length * 2);
        }
      }

      if (!menuOpen && baseHealth > 0 && spawnTimer > Math.max(1.65, 5.2 - wave * 0.18)) {
        spawnTimer = 0;
        addEnemy(chooseEnemyKind(wave));
      }

      if (!menuOpen && waveTimer > 45) {
        waveTimer = 0;
        wave += 1;
        gold += 70 + wave * 14;
        notice = `Wave ${wave} started. Bonus gold delivered.`;
      }

      const move = new THREE.Vector3(
        (keys.has("arrowleft") ? 1 : 0) - (keys.has("arrowright") ? 1 : 0),
        0,
        (keys.has("arrowup") ? 1 : 0) - (keys.has("arrowdown") ? 1 : 0)
      );
      if (!menuOpen && move.lengthSq() > 0) {
        move.normalize();
        player.position.addScaledVector(move, 7.4 * dt);
        player.position.x = THREE.MathUtils.clamp(player.position.x, -14, 14);
        player.position.z = THREE.MathUtils.clamp(player.position.z, -18, 12);
        player.rotation.y = Math.atan2(move.x, move.z);
      }

      nearTent = player.position.distanceTo(TENT_POSITION) <= INTERACT_RADIUS;
      if (!nearTent) {
        tentDismissed = false;
      }
      if (shopOpen && !nearTent) {
        shopOpen = false;
        notice = "Shop closed.";
      }
      let nextNearSlot: number | null = null;
      let bestSlotDistance = Number.POSITIVE_INFINITY;
      SLOT_POSITIONS.forEach((position, index) => {
        if (!isSlotActive(slots[index], slots)) {
          return;
        }
        const distance = player.position.distanceTo(position);
        if (distance < bestSlotDistance && distance <= INTERACT_RADIUS) {
          bestSlotDistance = distance;
          nextNearSlot = index;
        }
      });
      nearSlot = nextNearSlot;
      if (nearSlot !== dismissedSlot) {
        dismissedSlot = null;
      }
      const nextHoldTarget = nearTent && !tentDismissed ? "shop" : nearSlot;
      if (!menuOpen && nextHoldTarget !== null && nextHoldTarget !== dismissedSlot) {
        if (holdTarget !== nextHoldTarget) {
          holdTarget = nextHoldTarget;
          holdProgress = 0;
        }
        holdProgress = Math.min(1, holdProgress + dt / 1.1);
      } else {
        holdTarget = null;
        holdProgress = 0;
      }

      if (holdProgress >= 1 && holdTarget === "shop" && !tutorialOpen && !shopOpen && !slotMenuOpen) {
        shopOpen = true;
        holdProgress = 0;
        notice = "Shop open.";
      } else if (holdProgress >= 1 && typeof holdTarget === "number" && !tutorialOpen && !shopOpen && !slotMenuOpen) {
        slotMenuOpen = true;
        menuSlot = holdTarget;
        holdProgress = 0;
        notice = "Slot menu open.";
      }

      if (shopOpen) {
        notice = "Shop open.";
      } else if (slotMenuOpen) {
        notice = "Slot menu open.";
      } else if (nearTent) {
        notice = "Hold on the tent circle to open the shop.";
      } else if (nearSlot !== null) {
        const slot = slots[nearSlot];
        notice = slot.unlocked
          ? slot.troop
            ? "This base slot is occupied."
            : "Choose inventory for this slot."
          : slot.buildKind
            ? `Press E to build ${troopDef(slot.buildKind).name} for ${currency(slot.cost ?? SLOT_COST)}.`
            : `Press E to unlock this base slot for ${currency(slot.cost ?? SLOT_COST)}.`;
      }

      if (!menuOpen) {
        slots.forEach((slot, index) => {
          slotCooldowns[index] -= dt;
          const model = slotModels[index];
          if (!slot.troop || !model) {
            return;
          }
          const def = troopDef(slot.troop);
          const { target, distance } = nearestEnemy(model.position, enemies, def);
          if (slot.troop === "medic") {
            baseHealth = Math.min(BASE_MAX_HEALTH, baseHealth + dt * 1.4);
          }
          if (!target || distance > def.range) {
            return;
          }
          model.lookAt(target.group.position);
          if (slotCooldowns[index] <= 0) {
            slotCooldowns[index] = def.rate;
            target.health -= def.damage;
            model.scale.y = 1.16;
          }
        });

        enemies.forEach((enemy) => {
          enemy.attackTimer -= dt;
          let targetSlotIndex = -1;
          let targetDistance = Number.POSITIVE_INFINITY;
          slots.forEach((slot, index) => {
            const model = slotModels[index];
            if (!slot.troop || !model || !isSlotActive(slot, slots)) {
              return;
            }
            const distanceToSlot = enemy.group.position.distanceTo(model.position);
            if (distanceToSlot < targetDistance) {
              targetDistance = distanceToSlot;
              targetSlotIndex = index;
            }
          });
          const targetPosition =
            targetSlotIndex >= 0 && slotModels[targetSlotIndex]
              ? slotModels[targetSlotIndex]!.position.clone()
              : new THREE.Vector3(0, enemy.group.position.y, 8.1);
          const direction = targetPosition.clone().sub(enemy.group.position);
          direction.y = 0;
          const distance = direction.length();
          if (distance <= enemy.range) {
            if (enemy.attackTimer <= 0) {
              enemy.attackTimer = enemy.kind === "tank" ? 1.25 : 0.95;
              if (targetSlotIndex >= 0) {
                const slot = slots[targetSlotIndex];
                slot.health = Math.max(0, (slot.health ?? maxHealthFor(slot.troop!)) - enemy.damage);
                notice = `${troopDef(slot.troop!).name} is under attack.`;
                if (slot.health <= 0) {
                  slot.troop = null;
                  slot.health = undefined;
                  slot.maxHealth = undefined;
                  if (slot.buildKind) {
                    slot.unlocked = false;
                  }
                  rebuildSlotModel(targetSlotIndex);
                  notice = "A defense slot was destroyed.";
                }
              } else {
                baseHealth = Math.max(0, baseHealth - enemy.damage);
                notice = baseHealth <= 0 ? "Base destroyed. Reset to rebuild." : "Enemies are hitting your base.";
              }
              enemy.group.scale.y = 1.14;
            }
            return;
          }
          direction.normalize();
          enemy.group.position.addScaledVector(direction, enemy.speed * dt);
          enemy.group.rotation.y = Math.atan2(direction.x, direction.z);
          if (enemy.kind === "helicopter") {
            enemy.group.children.forEach((child, index) => {
              if (index === 2) {
                child.rotation.y += dt * 18;
              }
            });
          }
        });

        slotModels.forEach((model) => {
          if (model) {
            model.scale.y += (1 - model.scale.y) * 0.18;
          }
        });

        enemies.slice().forEach((enemy) => {
          enemy.group.scale.y += (1 - enemy.group.scale.y) * 0.18;
          if (enemy.health <= 0) {
            gold += enemy.bounty;
            notice = `Enemy defeated. +${currency(enemy.bounty)}.`;
            removeEnemy(enemy);
          }
        });
      }

      slotRings.forEach((ring, index) => {
        const slot = slots[index];
        const active = nearSlot === index;
        const material = ring.material as THREE.MeshStandardMaterial;
        ring.visible = isSlotActive(slot, slots);
        material.color.setHex(slot.unlocked ? 0x6bd487 : 0x6c6f67);
        const progressBoost = active && holdTarget === index ? holdProgress * 0.45 : 0;
        ring.scale.setScalar(active ? 1.12 + progressBoost + Math.sin(elapsed * 5) * 0.04 : 1);
      });
      shopRing.scale.setScalar(nearTent ? 1.12 + (holdTarget === "shop" ? holdProgress * 0.45 : 0) + Math.sin(elapsed * 5) * 0.04 : 1 + Math.sin(elapsed * 2) * 0.04);

      const cameraTarget = new THREE.Vector3(player.position.x, 0.7, player.position.z);
      const desiredCamera = new THREE.Vector3(player.position.x, 8.8, player.position.z - 12.5);
      camera.position.lerp(desiredCamera, 0.09);
      camera.lookAt(cameraTarget);

      pushSnapshot();
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
    };
  }, []);

  const activeSlot =
    snapshot.menuSlot !== null ? snapshot.slots[snapshot.menuSlot] : null;
  const tutorialGuide =
    snapshot.tutorialStage === "buy"
      ? {
          title: "Training 1 / 2",
          text: snapshot.shopOpen
            ? "Buy a Rifleman or Assault. Your gold goes down, and the troop goes into your inventory."
            : "Walk to the tent circle and hold still until the Soldier Shop opens."
        }
      : snapshot.tutorialStage === "deploy"
        ? {
            title: "Training 2 / 2",
            text: snapshot.slotMenuOpen
              ? "Pick the troop you bought, then press Deploy to place it in this slot."
              : "Walk to the empty slot circle and hold still until its menu opens."
          }
        : snapshot.tutorialStage === "wave"
          ? {
              title: "Training 3 / 3",
              text: "Your troop is placed. Start Wave 1 when you are ready, then defend the base."
            }
          : null;

  return (
    <main className="tycoonPage">
      <section className="tycoonStage" aria-label="Military tycoon game">
        <div className="tycoonScene" ref={mountRef} />
        <div className="topHud">
          <div>
            <p className="eyebrow">Royal Front</p>
            <h1>Military Tycoon</h1>
            <p className="controlHint">Move with arrow keys. Buy soldiers. Build defense slots with gold.</p>
          </div>
          <div className="waveHud" aria-label="Wave status">
            <strong>Wave {snapshot.wave}</strong>
            <span>Checkpoint after wave {snapshot.checkpoint}</span>
          </div>
        </div>

        {snapshot.tutorialOpen ? (
          <div className="gameOverlay" role="dialog" aria-label="Training">
            <div className="overlayPanel tutorialPanel">
              <div className="overlayHeader">
                <div>
                  <p className="eyebrow">Training</p>
                  <h2>Place Your First Troop</h2>
                </div>
                <strong>{currency(snapshot.gold)}</strong>
              </div>
              <div className="tutorialSteps">
                <div>
                  <strong>1</strong>
                  <span>You start with one Rifleman already defending the base.</span>
                </div>
                <div>
                  <strong>2</strong>
                  <span>After this screen, follow the training box to the tent and buy a second troop.</span>
                </div>
                <div>
                  <strong>3</strong>
                  <span>The training box will then show you how to open the empty slot and deploy it.</span>
                </div>
              </div>
              <button className="resetButton" type="button" onClick={() => closeTutorialRef.current()}>
                Start Training
              </button>
            </div>
          </div>
        ) : null}

        {!snapshot.tutorialOpen && tutorialGuide ? (
          <aside className="tutorialCoach" aria-label="Training guide">
            <p className="eyebrow">{tutorialGuide.title}</p>
            <strong>{snapshot.tutorialStage === "wave" ? "Start a Wave" : "Place Your Troop"}</strong>
            <span>{tutorialGuide.text}</span>
            {snapshot.tutorialStage === "wave" ? (
              <button className="resetButton" type="button" onClick={() => startWaveRef.current()}>
                Start Wave 1
              </button>
            ) : null}
          </aside>
        ) : null}

        {snapshot.shopOpen ? (
          <div className="gameOverlay" role="dialog" aria-label="Soldier shop">
            <div className="overlayPanel">
              <div className="overlayHeader">
                <div>
                  <p className="eyebrow">Menu</p>
                  <h2>Soldier Shop</h2>
                </div>
                <strong>{currency(snapshot.gold)}</strong>
              </div>
              <div className="overlayGrid">
                {SHOP_ITEMS.map((troop) => (
                  <button
                    className="upgradeButton"
                    type="button"
                    key={troop.key}
                    onClick={() => buyTroopRef.current(troop.key)}
                  >
                    <span className="shopBadge">{troop.name.slice(0, 1)}</span>
                    <span>
                      <strong>{troop.name}</strong>
                      <small>
                        Bag {snapshot.inventory[troop.key]} · {troop.description}
                      </small>
                    </span>
                    <em className={snapshot.gold >= troop.cost ? "" : "locked"}>
                      {currency(troop.cost)}
                    </em>
                  </button>
                ))}
              </div>
              <button className="resetButton" type="button" onClick={() => closeShopRef.current()}>
                Close Shop
              </button>
            </div>
          </div>
        ) : null}

        {snapshot.slotMenuOpen && snapshot.menuSlot !== null && activeSlot ? (
          <div className="gameOverlay" role="dialog" aria-label="Slot menu">
            <div className="overlayPanel">
              <div className="overlayHeader">
                <div>
                  <p className="eyebrow">Menu</p>
                  <h2>
                    {snapshot.menuSlot === GUARD_TOWER_SLOT_INDEX
                      ? "Guard Tower Slot"
                      : `Slot ${snapshot.menuSlot + 1}`}
                  </h2>
                </div>
                <strong>{currency(snapshot.gold)}</strong>
              </div>

              {!activeSlot.unlocked ? (
                <button
                  className="unlockSlotButton"
                  type="button"
                  onClick={() => slotActionRef.current(snapshot.menuSlot!)}
                >
                  {activeSlot.buildKind
                    ? `Build ${troopDef(activeSlot.buildKind).name} for ${currency(activeSlot.cost ?? SLOT_COST)}`
                    : `Unlock Slot for ${currency(activeSlot.cost ?? SLOT_COST)}`}
                </button>
              ) : activeSlot.troop ? (
                <div className="slotManageRow">
                  <div>
                    <strong>{troopDef(activeSlot.troop).name}</strong>
                    <span>
                      Health {Math.ceil(activeSlot.health ?? activeSlot.maxHealth ?? maxHealthFor(activeSlot.troop))} / {activeSlot.maxHealth ?? maxHealthFor(activeSlot.troop)}
                    </span>
                  </div>
                  <button type="button" disabled>
                    Deploy
                  </button>
                  <button type="button" onClick={() => sellSlotRef.current(snapshot.menuSlot!)}>
                    Sell
                  </button>
                </div>
              ) : (
                <div className="overlayGrid">
                  {SHOP_ITEMS.filter((troop) => snapshot.inventory[troop.key] > 0).length > 0 ? (
                    SHOP_ITEMS.filter((troop) => snapshot.inventory[troop.key] > 0).map((troop) => (
                      <div className="slotManageRow" key={troop.key}>
                        <div>
                          <strong>{troop.name}</strong>
                          <span>Inventory {snapshot.inventory[troop.key]}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => slotActionRef.current(snapshot.menuSlot!, troop.key)}
                        >
                          Deploy
                        </button>
                        <button type="button" disabled>
                          Sell
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="shopClosedPanel">
                      <strong>No Troops</strong>
                      <span>Buy soldiers from the shop before deploying to this slot.</span>
                    </div>
                  )}
                </div>
              )}
              <button className="resetButton" type="button" onClick={() => closeSlotRef.current()}>
                Close Slot
              </button>
            </div>
          </div>
        ) : null}

        {!snapshot.tutorialOpen && !snapshot.shopOpen && !snapshot.slotMenuOpen ? (
          <aside className="controlDeck" aria-label="Military status">
            <div className="noticeBar">{snapshot.notice}</div>
            <div className="castleMeter">
              <span>Base</span>
              <strong>{Math.ceil(snapshot.baseHealth)} / {BASE_MAX_HEALTH}</strong>
              <div>
                <i style={{ width: `${(snapshot.baseHealth / BASE_MAX_HEALTH) * 100}%` }} />
              </div>
            </div>
            <div className="shopClosedPanel">
              <strong>Circles</strong>
              <span>Hold on shop or slot circles to open a menu.</span>
            </div>
            <button className="resetButton" type="button" onClick={() => resetRef.current()}>
              Reset Battle
            </button>
          </aside>
        ) : null}
      </section>
    </main>
  );
}
