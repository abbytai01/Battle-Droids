"use client";

import { useEffect, useRef, useState } from "react";

const WIDTH = 960;
const HEIGHT = 540;
const FLOOR_Y = 432;
const PLAYER_SPEED = 220;
const ATTACK_DURATION = 0.18;
const ATTACK_COOLDOWN = 0.28;
const LEVEL_DURATION = 18;
const WAVES_PER_LEVEL = 5;
const STORAGE_KEY = "battle-droids-high-score";
const USERS_STORAGE_KEY = "battle-droids-users";
const PERMANENT_SHOP_KEY = "battle-droids-permanent-shop";
const PERMANENT_CORES_KEY = "battle-droids-permanent-cores";
const ACCOUNT_COINS_KEY = "battle-droids-account-coins";
const GEMS_KEY = "battle-droids-gems";
const CHARACTER_KEY = "battle-droids-character";
const DEX_TROOPS_KEY = "battle-droids-dex-troops";
const DEX_WEAPONS_KEY = "battle-droids-dex-weapons";
const DEX_ABILITIES_KEY = "battle-droids-dex-abilities";
const CLAIMED_QUESTS_KEY = "battle-droids-claimed-quests";
const PERMANENT_TROOP_UPGRADES_KEY = "battle-droids-permanent-troop-upgrades";
const RUN_SAVES_KEY = "battle-droids-run-saves";
const RUN_SAVES_ENABLED_KEY = "battle-droids-run-saves-enabled";
const DAILY_REWARDS_KEY = "battle-droids-daily-rewards";
const MAX_SHIELD_LEVEL = 2;
const MAX_HEARTS = 20;
const MAX_BONUS_HEARTS = 8;
const HEARTS_PER_ROW = 10;
const RUN_SAVE_SLOTS = 8;
const CHEST_MIN_DELAY = 28;
const CHEST_RANDOM_DELAY = 18;
const SHOP_COSTS = {
  squire: 14,
  archer: 22,
  shieldsman: 18,
  sniper: 32,
  cloneCommander: 500,
  medicClone: 500,
  playerShield: 20,
  troopShield: 20,
  food: 6
};
const TROOP_UPGRADE_COST = 8;
const TROOP_MAX_HP = 15;
const TROOP_RANGE_MAX_LEVEL = 100;
const MASTER_TRAINER_RANGE_TARGET = 20;
const TROOP_SPEED_MAX_LEVEL = 10;
const TROOP_NAMES = [
  "Dylan",
  "Natan",
  "Avery",
  "Maya",
  "Leo",
  "Sofia",
  "Kai",
  "Zara",
  "Eli",
  "Nova"
];
const BASE_WEAPONS: WeaponType[] = ["lightsaber", "blaster"];
const RARE_WEAPONS: WeaponType[] = ["heavy_blaster", "double_lightsaber", "ion_blaster", "lightsaber_gun"];
const ALL_TROOPS = ["squire", "archer", "shieldsman", "sniper"] as const;
type UnlockableTroopKind = (typeof ALL_TROOPS)[number];
const TROOP_UNLOCK_COSTS: Record<(typeof ALL_TROOPS)[number], number> = {
  squire: 0,
  archer: 35,
  shieldsman: 40,
  sniper: 55
};
const ALL_ABILITIES: AbilityKind[] = [
  "fireball",
  "spike_trap",
  "dash_strike",
  "heal_pulse",
  "freeze_blast",
  "turret_droid",
  "shield_bubble",
  "coin_magnet"
];
const RARE_WEAPON_RUN_COST = 1000;
const RARE_WEAPON_PERMANENT_COST = 10000;
const GEM_CHEST_COST = 12;
const GRAND_GEM_CHEST_COST = 28;
const SILVER_CHEST_GEM_COST = 4;
const GOLD_CHEST_GEM_COST = 10;
const DAILY_CHEST_BUY_LIMIT = 5;

type QuestId =
  | "get_everything"
  | "droid_crusher"
  | "boss_breaker"
  | "treasure_hunter"
  | "clone_commander"
  | "master_trainer";

type EnemyKind = "scout" | "brute" | "commando" | "droideka" | "sith";
type AllyKind =
  | "squire"
  | "archer"
  | "shieldsman"
  | "sniper"
  | "clone_commander"
  | "medic_clone";
type ScreenState = "menu" | "playing" | "gameover";
type AuthView = "welcome" | "signin" | "signup" | "character";
type MenuView = "main" | "howToPlay" | "permanentShop" | "highScore" | "settings";
type WeaponType =
  | "lightsaber"
  | "blaster"
  | "heavy_blaster"
  | "double_lightsaber"
  | "ion_blaster"
  | "lightsaber_gun";
type JediCharacter = "Obi-Wan" | "Anakin" | "Mace Windu";
type CoinKind = "silver" | "gold";
type SpawnSide = "left" | "right";
type AbilityKind =
  | "fireball"
  | "spike_trap"
  | "dash_strike"
  | "heal_pulse"
  | "freeze_blast"
  | "turret_droid"
  | "shield_bubble"
  | "coin_magnet";

type Enemy = {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  health: number;
  maxHealth: number;
  attackRange: number;
  damage: number;
  attackCooldown: number;
  attackTimer: number;
  attackWindup: number;
  hitByAttack: number;
  facing: 1 | -1;
  tint: string;
  scoreValue: number;
  knockback: number;
  shieldPattern?: boolean;
  hitsTaken?: number;
  slowTimer?: number;
  rolling?: boolean;
  summonTimer?: number;
};

type Ally = {
  id: number;
  name: string;
  kind: AllyKind;
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  health: number;
  maxHealth: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
  attackTimer: number;
  attackWindup: number;
  color: string;
  cost: number;
  targetId: number | null;
  facing: 1 | -1;
  shieldPattern?: boolean;
  guarding?: boolean;
  guardTargetId?: number | null;
  hitsTaken?: number;
  healthLevel: number;
  rangeLevel: number;
  speedLevel: number;
  permanentId?: string;
  specialCooldown?: number;
  weaponMode?: "dual" | "blaster";
};

type Coin = {
  id: number;
  x: number;
  y: number;
  value: number;
  bob: number;
  kind: CoinKind;
};

type Chest = {
  id: number;
  x: number;
  y: number;
  hitsLeft: number;
  progress: number;
  hitByAttack: number;
};

type Projectile = {
  id: number;
  kind: "fireball";
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  startX: number;
  maxDistance: number;
  damage: number;
  life: number;
  hitIds: number[];
  chestHitIds: number[];
};

type SpikeTrap = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  damage: number;
  armTimer: number;
  hitIds: number[];
};

type Turret = {
  id: number;
  x: number;
  y: number;
  life: number;
  damage: number;
  range: number;
  cooldown: number;
};

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

type Player = {
  x: number;
  y: number;
  w: number;
  h: number;
  health: number;
  maxHealth: number;
  attackTimer: number;
  cooldownTimer: number;
  attackId: number;
  attackHits: number;
  attackStyle: "normal" | "hybrid_melee";
  facing: 1 | -1;
  invuln: number;
  comboStep: number;
  comboTimer: number;
  silverCoins: number;
  score: number;
  kills: number;
  weapon: WeaponType;
  heavyBlasterUnlocked: boolean;
  unlockedWeapons: WeaponType[];
  bonusDamage: number;
  speedBonus: number;
  maxHealthBonus: number;
  multiStrike: number;
  cooldownBonus: number;
  coinBonus: number;
  shieldBlocks: number;
  troopShieldBlocks: number;
  hitsTaken: number;
  fireballLevel: number;
  spikeTrapLevel: number;
  dashStrikeLevel: number;
  healPulseLevel: number;
  freezeBlastLevel: number;
  turretDroidLevel: number;
  shieldBubbleLevel: number;
  coinMagnetLevel: number;
  fireballCooldown: number;
  spikeTrapCooldown: number;
  dashStrikeCooldown: number;
  healPulseCooldown: number;
  freezeBlastCooldown: number;
  turretDroidCooldown: number;
  shieldBubbleCooldown: number;
  shieldBubbleTimer: number;
  coinMagnetCooldown: number;
  coinMagnetTimer: number;
};

type GameState = {
  player: Player;
  enemies: Enemy[];
  allies: Ally[];
  coins: Coin[];
  chests: Chest[];
  projectiles: Projectile[];
  spikeTraps: SpikeTrap[];
  turrets: Turret[];
  particles: Particle[];
  level: number;
  wave: number;
  levelSpawnSide: SpawnSide;
  elapsed: number;
  spawnTimer: number;
  coinTimer: number;
  chestTimer: number;
  bossActive: boolean;
  bossWave: number;
  chestsOpened: number;
  bossesDefeated: number;
  nextEnemyId: number;
  nextAllyId: number;
  nextCoinId: number;
  nextChestId: number;
  nextProjectileId: number;
  nextTrapId: number;
  nextTurretId: number;
  nextParticleId: number;
};

type HudState = {
  level: number;
  wave: number;
  score: number;
  health: number;
  silverCoins: number;
  goldCoins: number;
  kills: number;
  enemyCount: number;
  waveLabel: string;
  squireCount: number;
  archerCount: number;
  shieldsmanCount: number;
  sniperCount: number;
  weapon: WeaponType;
  shieldBlocks: number;
  troopShieldBlocks: number;
  cores: number;
};

type HighScore = {
  name: string;
  score: number;
  level: number;
  wave: number;
};

type MathChallenge = {
  question: string;
  answer: number;
};

type StoredUser = {
  username: string;
  password: string;
};

type RunSaveSlot = {
  slot: number;
  label: string;
  savedAt: string;
  preview: string;
  state: GameState;
};

type PermanentTroopUpgradeMap = Record<
  string,
  {
    healthLevel: number;
    rangeLevel: number;
    speedLevel: number;
  }
>;

type QuestDefinition = {
  id: QuestId;
  name: string;
  description: string;
  rewardLabel: string;
};

type GemChestTier = "basic" | "grand" | "silver" | "gold";

type GemChestReward =
  | { kind: "weapon"; weapon: WeaponType }
  | { kind: "abilities"; abilities: AbilityKind[] }
  | { kind: "silver"; silver: number }
  | { kind: "gold"; gold: number };

type GemChestOpening = {
  tier: GemChestTier;
  tapsLeft: number;
  reward: GemChestReward;
};

type DailyRewardKind = "silver" | "gold" | "gems" | "cores";
type ShopChestKind = "silver" | "gold";

type DailyRewardDefinition = {
  kind: DailyRewardKind;
  amount: number;
  label: string;
  chestKind?: ShopChestKind;
};

type DailyRewardsState = {
  lastRefreshDay: string;
  pendingCount: number;
  totalClaims: number;
  chestResetDay: string;
  silverChestBuys: number;
  goldChestBuys: number;
};

const JEDI_CHARACTERS: JediCharacter[] = ["Obi-Wan", "Anakin", "Mace Windu"];
const DAILY_REWARD_TRACK: DailyRewardDefinition[] = [
  { kind: "silver", amount: 120, label: "120 Silver" },
  { kind: "gems", amount: 5, label: "5 Gems" },
  { kind: "gold", amount: 18, label: "18 Gold" },
  { kind: "gems", amount: 0, label: "Free Silver Chest", chestKind: "silver" },
  { kind: "cores", amount: 2, label: "2 Cores" },
  { kind: "silver", amount: 260, label: "260 Silver" },
  { kind: "gems", amount: 8, label: "8 Gems" },
  { kind: "gems", amount: 0, label: "Free Gold Chest", chestKind: "gold" },
  { kind: "gold", amount: 30, label: "30 Gold" }
];
const QUESTS: QuestDefinition[] = [
  {
    id: "get_everything",
    name: "Get Everything",
    description: "In one run, collect all troop types, all weapons, and all abilities shown in the Battle Dex.",
    rewardLabel: "50 Gold"
  },
  {
    id: "droid_crusher",
    name: "Droid Crusher",
    description: "Defeat 100 droids in one run.",
    rewardLabel: "8 Gems"
  },
  {
    id: "boss_breaker",
    name: "Boss Breaker",
    description: "Defeat a Sith boss.",
    rewardLabel: "12 Gems"
  },
  {
    id: "treasure_hunter",
    name: "Treasure Hunter",
    description: "Open 5 chests in one run.",
    rewardLabel: "6 Gems"
  },
  {
    id: "clone_commander",
    name: "Clone Commander",
    description: "Have 6 troops fighting for you at the same time.",
    rewardLabel: "5 Gems"
  },
  {
    id: "master_trainer",
    name: "Master Trainer",
    description: "In one run, upgrade one of every troop type to max health, range level 20, and max speed.",
    rewardLabel: "75 Gold"
  }
];

type PermanentShop = {
  squire: number;
  archer: number;
  shieldsman: number;
  sniper: number;
  food: number;
  shield: number;
  troopShield: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function weaponLabel(weapon: WeaponType) {
  if (weapon === "lightsaber_gun") return "Lightsaber Gun";
  if (weapon === "heavy_blaster") return "Heavy Blaster";
  if (weapon === "double_lightsaber") return "Double Lightsaber";
  if (weapon === "ion_blaster") return "Ion Blaster";
  if (weapon === "blaster") return "Blaster";
  return "Lightsaber";
}

function weaponDescription(weapon: WeaponType) {
  if (weapon === "lightsaber_gun") return "A hybrid weapon that shoots blasts and can slash up close with Q. Opens chests in 5 hits.";
  if (weapon === "heavy_blaster") return "Long range, heavy damage, and opens chests in 5 shots.";
  if (weapon === "double_lightsaber") return "Wide melee swings that can hit more enemies up close. Opens chests in 1 hit.";
  if (weapon === "ion_blaster") return "Shorter range, very strong shots with extra impact. Opens chests in 5 shots.";
  if (weapon === "blaster") return "Basic ranged weapon. Opens chests in 10 shots.";
  return "Fast melee weapon. Opens chests in 2 hits.";
}

function chestDamageForWeapon(weapon: WeaponType) {
  if (weapon === "lightsaber_gun") return 2;
  if (weapon === "double_lightsaber") return 10;
  if (weapon === "lightsaber") return 5;
  if (weapon === "heavy_blaster" || weapon === "ion_blaster") return 2;
  return 1;
}

function chestHitsLeftForWeapon(chest: Chest, weapon: WeaponType) {
  return Math.ceil(Math.max(0, 10 - chest.progress) / chestDamageForWeapon(weapon));
}

function isMeleeWeapon(weapon: WeaponType) {
  return weapon === "lightsaber" || weapon === "double_lightsaber";
}

function isRangedWeapon(weapon: WeaponType) {
  return weapon === "blaster" || weapon === "heavy_blaster" || weapon === "ion_blaster" || weapon === "lightsaber_gun";
}

function weaponRange(weapon: WeaponType) {
  if (weapon === "lightsaber_gun") return 165;
  if (weapon === "heavy_blaster") return 220;
  if (weapon === "ion_blaster") return 150;
  if (weapon === "blaster") return 170;
  if (weapon === "double_lightsaber") return 68;
  return 48;
}

function isWeaponUnlocked(player: Player, weapon: WeaponType) {
  return (
    BASE_WEAPONS.includes(weapon) ||
    player.unlockedWeapons.includes(weapon) ||
    (weapon === "heavy_blaster" && player.heavyBlasterUnlocked)
  );
}

function unlockWeapon(player: Player, weapon: WeaponType) {
  if (!player.unlockedWeapons.includes(weapon)) {
    player.unlockedWeapons.push(weapon);
  }
  if (weapon === "heavy_blaster") {
    player.heavyBlasterUnlocked = true;
  }
  player.weapon = weapon;
}

function cycleWeapon(player: Player) {
  const weapons = [...BASE_WEAPONS, ...RARE_WEAPONS.filter((weapon) => isWeaponUnlocked(player, weapon))];
  const currentIndex = Math.max(0, weapons.indexOf(player.weapon));
  player.weapon = weapons[(currentIndex + 1) % weapons.length];
}

function troopName(id: number) {
  return TROOP_NAMES[(id - 1) % TROOP_NAMES.length];
}

function troopLabel(kind: AllyKind) {
  if (kind === "clone_commander") return "Clone Commander";
  if (kind === "medic_clone") return "Medic Clone";
  if (kind === "archer") return "501st Clone Trooper";
  if (kind === "shieldsman") return "Shield Trooper";
  if (kind === "sniper") return "Sniper Clone";
  return "Regular Trooper";
}

function isSpecialHeroTroop(kind: AllyKind) {
  return kind === "clone_commander" || kind === "medic_clone";
}

function upgradeCost(ally: Ally, upgrade: "health" | "range" | "speed") {
  const level =
    upgrade === "health"
      ? ally.healthLevel
      : upgrade === "range"
        ? ally.rangeLevel
        : ally.speedLevel;
  return TROOP_UPGRADE_COST + level * 4;
}

function troopUpgradeLevel(ally: Ally, upgrade: "health" | "range" | "speed") {
  if (upgrade === "health") return ally.healthLevel;
  if (upgrade === "range") return ally.rangeLevel;
  return ally.speedLevel;
}

function nextRangeUpgradeLevel(currentLevel: number) {
  if (currentLevel < 1) return 1;
  if (currentLevel < 2) return 2;
  if (currentLevel < 4) return 4;
  if (currentLevel < 7) return 7;
  if (currentLevel < 10) return 10;
  return Math.min(TROOP_RANGE_MAX_LEVEL, currentLevel + 3);
}

function isTroopUpgradeMaxed(ally: Ally | null, upgrade: "health" | "range" | "speed") {
  if (!ally) return false;
  if (isSpecialHeroTroop(ally.kind)) return true;
  if (upgrade === "health") return ally.maxHealth >= TROOP_MAX_HP;
  if (upgrade === "range") return ally.rangeLevel >= TROOP_RANGE_MAX_LEVEL;
  return ally.speedLevel >= TROOP_SPEED_MAX_LEVEL;
}

function troopUpgradeLabel(ally: Ally | null, upgrade: "health" | "range" | "speed") {
  if (!ally) return `${TROOP_UPGRADE_COST} Silver`;
  if (isSpecialHeroTroop(ally.kind)) return "No Upgrades";
  if (isTroopUpgradeMaxed(ally, upgrade)) return "MAX";
  return `${upgradeCost(ally, upgrade)} Silver`;
}

function createMathChallenge(): MathChallenge {
  const left = 2 + Math.floor(Math.random() * 10);
  const right = 2 + Math.floor(Math.random() * 10);
  const useAddition = Math.random() < 0.55;
  return useAddition
    ? { question: `${left} + ${right}`, answer: left + right }
    : { question: `${left} x ${right}`, answer: left * right };
}

function intersects(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function rankLabel(score: number) {
  if (score >= 500) return "Legend";
  if (score >= 320) return "Champion";
  if (score >= 180) return "Knight";
  if (score >= 80) return "Squire";
  return "Rookie";
}

function currentLocalDayId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayIdToUtc(dayId: string) {
  const [year, month, day] = dayId.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function daysBetweenDayIds(previousDay: string, nextDay: string) {
  return Math.max(0, Math.floor((dayIdToUtc(nextDay) - dayIdToUtc(previousDay)) / 86400000));
}

function makeDailyRewardsState(): DailyRewardsState {
  const today = currentLocalDayId();
  return {
    lastRefreshDay: today,
    pendingCount: 1,
    totalClaims: 0,
    chestResetDay: today,
    silverChestBuys: DAILY_CHEST_BUY_LIMIT,
    goldChestBuys: DAILY_CHEST_BUY_LIMIT
  };
}

function toGoldSilver(silverCoins: number) {
  return {
    gold: Math.floor(silverCoins / 10),
    silver: silverCoins % 10
  };
}

function waveWithinLevel(globalWave: number) {
  return ((globalWave - 1) % WAVES_PER_LEVEL) + 1;
}

function reduceDamageByShield(damage: number, shieldLevel: number) {
  if (shieldLevel >= 2) return Math.max(0.5, damage * 0.25);
  if (shieldLevel === 1) return Math.max(0.5, damage * 0.5);
  return damage;
}

function maxFoodHealth(player: Player) {
  return Math.min(MAX_HEARTS, player.maxHealth + MAX_BONUS_HEARTS);
}

function troopBubbleShieldActive(state: GameState, ally: Ally) {
  if (state.player.shieldBubbleLevel < 2) return false;
  if (ally.attackWindup > 0 || ally.attackTimer > 0) return false;
  const enemyAttackingThisTroop = state.enemies.some((enemy) => {
    if (enemy.attackWindup <= 0) return false;
    const attackDistance = Math.hypot(
      enemy.x + enemy.w / 2 - (ally.x + ally.w / 2),
      enemy.y + enemy.h / 2 - (ally.y + ally.h / 2)
    );
    return attackDistance <= enemy.attackRange + 36;
  });
  if (enemyAttackingThisTroop) return true;
  if (ally.guarding) return false;
  const nearestEnemyDistance = state.enemies.reduce((closest, enemy) => {
    const distance = Math.hypot(
      enemy.x + enemy.w / 2 - (ally.x + ally.w / 2),
      enemy.y + enemy.h / 2 - (ally.y + ally.h / 2)
    );
    return Math.min(closest, distance);
  }, Number.POSITIVE_INFINITY);
  return !Number.isFinite(nearestEnemyDistance) || nearestEnemyDistance > 170;
}

function renderTroopDexPreview(kind: AllyKind) {
  return (
    <div className={`dexPreview dexPreviewTroop dexPreviewTroop-${kind}`} aria-hidden="true">
      <span className="dexPreviewHead" />
      <span className="dexPreviewBody" />
      <span className="dexPreviewWeapon" />
      {kind === "shieldsman" ? <span className="dexPreviewShield" /> : null}
      {kind === "medic_clone" ? <span className="dexPreviewAura" /> : null}
    </div>
  );
}

function renderWeaponDexPreview(weapon: WeaponType) {
  return (
    <div className={`dexPreview dexPreviewWeaponCard dexPreviewWeapon-${weapon}`} aria-hidden="true">
      <span className="dexPreviewHandle" />
      <span className="dexPreviewBlade" />
      {weapon === "double_lightsaber" ? <span className="dexPreviewBlade dexPreviewBladeBack" /> : null}
      {weapon === "lightsaber_gun" ? <span className="dexPreviewMuzzle" /> : null}
    </div>
  );
}

function renderAbilityDexPreview(ability: AbilityKind) {
  return (
    <div className={`dexPreview dexPreviewAbility dexPreviewAbility-${ability}`} aria-hidden="true">
      <span className="dexPreviewAura" />
      <span className="dexPreviewCore" />
    </div>
  );
}

function rareWeaponPriority(weapon: WeaponType) {
  if (weapon === "ion_blaster") return 0;
  if (weapon === "heavy_blaster") return 1;
  if (weapon === "lightsaber_gun") return 2;
  return 3;
}

function chooseRareWeaponChestOptions(lockedWeapons: WeaponType[]) {
  const sortedLockedWeapons = [...lockedWeapons].sort(
    (left, right) => rareWeaponPriority(left) - rareWeaponPriority(right)
  );

  if (sortedLockedWeapons.length <= 1) {
    return sortedLockedWeapons;
  }

  if (sortedLockedWeapons.length === 2) {
    const roll = Math.random();
    if (roll < 0.62) return [sortedLockedWeapons[0]];
    if (roll < 0.9) return [sortedLockedWeapons[1]];
    return sortedLockedWeapons;
  }

  const [firstWeapon, secondWeapon, thirdWeapon, fourthWeapon] = sortedLockedWeapons;
  const roll = Math.random();
  if (sortedLockedWeapons.length >= 4) {
    if (roll < 0.3) return [firstWeapon];
    if (roll < 0.56) return [secondWeapon];
    if (roll < 0.75) return [thirdWeapon];
    if (roll < 0.87) return [fourthWeapon];
    if (roll < 0.95) return [firstWeapon, secondWeapon];
    return [firstWeapon, secondWeapon, thirdWeapon];
  }
  if (roll < 0.42) return [firstWeapon];
  if (roll < 0.7) return [secondWeapon];
  if (roll < 0.85) return [thirdWeapon];
  if (roll < 0.95) return [firstWeapon, secondWeapon];
  return [firstWeapon, secondWeapon, thirdWeapon];
}

function rollGemChestReward(player: Player, tier: GemChestTier): GemChestReward {
  if (tier === "silver") {
    return {
      kind: "silver",
      silver: 90 + Math.floor(Math.random() * 121)
    };
  }

  if (tier === "gold") {
    return {
      kind: "gold",
      gold: 8 + Math.floor(Math.random() * 9)
    };
  }

  const lockedRare = RARE_WEAPONS.filter((weapon) => !isWeaponUnlocked(player, weapon));
  const roll = Math.random();

  if (roll < (tier === "grand" ? 0.24 : 0.18) && lockedRare.length > 0) {
    const weapon = lockedRare[Math.floor(Math.random() * lockedRare.length)];
    return { kind: "weapon", weapon };
  }

  if (roll < (tier === "grand" ? 0.56 : 0.45)) {
    const abilityCount =
      tier === "grand"
        ? 3 + Math.floor(Math.random() * 2)
        : 2 + Math.floor(Math.random() * 2);
    return {
      kind: "abilities",
      abilities: [...ALL_ABILITIES].sort(() => Math.random() - 0.5).slice(0, abilityCount)
    };
  }

  if (roll < (tier === "grand" ? 0.82 : 0.75)) {
    return {
      kind: "silver",
      silver:
        tier === "grand"
          ? 420 + Math.floor(Math.random() * 381)
          : 180 + Math.floor(Math.random() * 221)
    };
  }

  return {
    kind: "gold",
    gold:
      tier === "grand"
        ? 28 + Math.floor(Math.random() * 21)
        : 12 + Math.floor(Math.random() * 14)
  };
}

function applyCharacterPerks(player: Player, character: JediCharacter | "") {
  player.bonusDamage = 0;
  player.cooldownBonus = 0;
  if (character === "Anakin") {
    player.cooldownBonus = 2;
  } else if (character === "Mace Windu") {
    player.bonusDamage = 1;
  }
}

function characterDamageTaken(damage: number, character: JediCharacter | "") {
  return character === "Obi-Wan" ? Math.max(0.5, damage * 0.8) : damage;
}

function randomSpawnSide(): SpawnSide {
  return Math.random() < 0.5 ? "left" : "right";
}

function makePermanentShop(): PermanentShop {
  return {
    squire: 0,
    archer: 0,
    shieldsman: 0,
    sniper: 0,
    food: 0,
    shield: 0,
    troopShield: 0
  };
}

function userStorageKey(baseKey: string, username: string) {
  return `${baseKey}:${username.trim().toLowerCase()}`;
}

function makeInitialState(): GameState {
  return {
    player: {
      x: 140,
      y: FLOOR_Y - 72,
      w: 38,
      h: 72,
      health: 12,
      maxHealth: 12,
      attackTimer: 0,
      cooldownTimer: 0,
      attackId: 0,
      attackHits: 0,
      attackStyle: "normal",
      facing: 1,
      invuln: 0,
      comboStep: 0,
      comboTimer: 0,
      silverCoins: 0,
      score: 0,
      kills: 0,
      weapon: "lightsaber",
      heavyBlasterUnlocked: false,
      unlockedWeapons: [...BASE_WEAPONS],
      bonusDamage: 0,
      speedBonus: 0,
      maxHealthBonus: 0,
      multiStrike: 0,
      cooldownBonus: 0,
      coinBonus: 0,
      shieldBlocks: 0,
      troopShieldBlocks: 0,
      hitsTaken: 0,
      fireballLevel: 0,
      spikeTrapLevel: 0,
      dashStrikeLevel: 0,
      healPulseLevel: 0,
      freezeBlastLevel: 0,
      turretDroidLevel: 0,
      shieldBubbleLevel: 0,
      coinMagnetLevel: 0,
      fireballCooldown: 0,
      spikeTrapCooldown: 0,
      dashStrikeCooldown: 0,
      healPulseCooldown: 0,
      freezeBlastCooldown: 0,
      turretDroidCooldown: 0,
      shieldBubbleCooldown: 0,
      shieldBubbleTimer: 0,
      coinMagnetCooldown: 0,
      coinMagnetTimer: 0
    },
    enemies: [],
    allies: [],
    coins: [],
    chests: [],
    projectiles: [],
    spikeTraps: [],
    turrets: [],
    particles: [],
    level: 1,
    wave: 1,
    levelSpawnSide: randomSpawnSide(),
    elapsed: 0,
    spawnTimer: 1.5,
    coinTimer: 2.25,
    chestTimer: CHEST_MIN_DELAY + Math.random() * CHEST_RANDOM_DELAY,
    bossActive: false,
    bossWave: 0,
    chestsOpened: 0,
    bossesDefeated: 0,
    nextEnemyId: 1,
    nextAllyId: 1,
    nextCoinId: 1,
    nextChestId: 1,
    nextProjectileId: 1,
    nextTrapId: 1,
    nextTurretId: 1,
    nextParticleId: 1
  };
}

function makeHudState(state: GameState): HudState {
  const wallet = toGoldSilver(state.player.silverCoins);
  return {
    level: state.level,
    wave: state.wave,
    score: state.player.score,
    health: Math.max(0, state.player.health),
    silverCoins: wallet.silver,
    goldCoins: wallet.gold,
    kills: state.player.kills,
    enemyCount: state.enemies.length,
    waveLabel: rankLabel(state.player.score),
    squireCount: state.allies.filter((ally) => ally.kind === "squire").length,
    archerCount: state.allies.filter((ally) => ally.kind === "archer").length,
    shieldsmanCount: state.allies.filter((ally) => ally.kind === "shieldsman").length,
    sniperCount: state.allies.filter((ally) => ally.kind === "sniper").length,
    weapon: state.player.weapon,
    shieldBlocks: state.player.shieldBlocks,
    troopShieldBlocks: state.player.troopShieldBlocks,
    cores: 0
  };
}

function abilityLevel(player: Player, ability: AbilityKind) {
  if (ability === "fireball") return player.fireballLevel;
  if (ability === "spike_trap") return player.spikeTrapLevel;
  if (ability === "dash_strike") return player.dashStrikeLevel;
  if (ability === "heal_pulse") return player.healPulseLevel;
  if (ability === "freeze_blast") return player.freezeBlastLevel;
  if (ability === "turret_droid") return player.turretDroidLevel;
  if (ability === "shield_bubble") return player.shieldBubbleLevel;
  return player.coinMagnetLevel;
}

function rewardCoresForScore(score: number) {
  return Math.max(0, Math.floor(score / 50));
}

function resetTransientInput(keys: Record<string, boolean>) {
  for (const key of Object.keys(keys)) {
    keys[key] = false;
  }
}

function spawnEnemy(state: GameState, forcedKind?: EnemyKind) {
  const waveBoost = Math.max(0, state.wave - 1);
  const healthBoost = Math.floor(waveBoost / 4);
  const damageBoost = Math.floor(waveBoost / 15) * 0.25;
  const speedBoost = Math.min(34, waveBoost * 1.4);
  const bruteChance = clamp(0.18 + state.level * 0.07, 0.18, 0.55);
  const roll = Math.random();
  const rolledKind: EnemyKind =
    state.wave >= 40 && roll < 0.3
      ? "droideka"
      : state.wave >= 20 && roll < 0.42
        ? "commando"
      : roll < bruteChance
        ? "brute"
        : "scout";
  const kind: EnemyKind = forcedKind ?? rolledKind;
  const y = FLOOR_Y - (kind === "sith" ? 96 : kind === "brute" ? 84 : kind === "droideka" ? 72 : kind === "commando" ? 70 : 64);
  const fromLeft =
    state.wave >= 20 && state.wave <= 39
      ? Math.random() < 0.5
      : state.levelSpawnSide === "left";
  const enemy: Enemy =
    kind === "sith"
      ? {
          id: state.nextEnemyId++,
          kind,
          x: fromLeft ? -92 : WIDTH + 42,
          y,
          w: 54,
          h: 96,
          speed: 78 + state.level * 4,
          health: 80 + state.level * 12,
          maxHealth: 80 + state.level * 12,
          attackRange: 86,
          damage: 2,
          attackCooldown: 1.2,
          attackTimer: 0,
          attackWindup: 0,
          hitByAttack: -1,
          facing: fromLeft ? 1 : -1,
          tint: "#3a1f35",
          scoreValue: 300,
          knockback: 8,
          summonTimer: 6 + Math.random() * 4
        }
      : kind === "brute"
      ? {
          id: state.nextEnemyId++,
          kind,
          x: fromLeft ? -78 : WIDTH + 30,
          y,
          w: 48,
          h: 84,
          speed: 64 + state.level * 5 + speedBoost * 0.45,
          health: 5 + Math.floor(state.level / 2) + healthBoost,
          maxHealth: 5 + Math.floor(state.level / 2) + healthBoost,
          attackRange: 72,
          damage: 1 + damageBoost,
          attackCooldown: 1.4,
          attackTimer: 0,
          attackWindup: 0,
          hitByAttack: -1,
          facing: fromLeft ? 1 : -1,
          tint: "#575d72",
          scoreValue: 24,
          knockback: 18
        }
      : kind === "commando"
        ? {
            id: state.nextEnemyId++,
            kind,
            x: fromLeft ? -68 : WIDTH + 26,
            y,
            w: 38,
            h: 70,
            speed: 118 + state.level * 7 + speedBoost * 0.55,
            health: 4 + Math.floor(state.level / 2) + healthBoost,
            maxHealth: 4 + Math.floor(state.level / 2) + healthBoost,
            attackRange: 66,
            damage: 1 + damageBoost,
            attackCooldown: 0.86,
            attackTimer: 0,
            attackWindup: 0,
            hitByAttack: -1,
            facing: fromLeft ? 1 : -1,
            tint: "#4e617e",
            scoreValue: 30 + state.wave,
            knockback: 18
          }
      : kind === "droideka"
        ? {
          id: state.nextEnemyId++,
          kind,
          x: fromLeft ? -70 : WIDTH + 28,
          y,
          w: 42,
          h: 72,
          speed: 102 + state.level * 8 + speedBoost * 0.4,
          health: 7 + Math.floor(state.level / 3) + healthBoost,
          maxHealth: 7 + Math.floor(state.level / 3) + healthBoost,
          attackRange: 94,
          damage: 1.5 + damageBoost,
          attackCooldown: 1.15,
          attackTimer: 0,
          attackWindup: 0,
          hitByAttack: -1,
          facing: fromLeft ? 1 : -1,
          tint: "#7c8da8",
          scoreValue: 36,
          knockback: 12,
          shieldPattern: true,
          hitsTaken: 0,
          rolling: true
        }
      : {
          id: state.nextEnemyId++,
          kind,
          x: fromLeft ? -58 : WIDTH + 24,
          y,
          w: 34,
          h: 64,
          speed: 102 + state.level * 8 + speedBoost * 0.5,
          health: 2 + Math.floor(state.level / 3) + Math.floor(healthBoost / 2),
          maxHealth: 2 + Math.floor(state.level / 3) + Math.floor(healthBoost / 2),
          attackRange: 54,
          damage: 0.5 + damageBoost,
          attackCooldown: 1.05,
          attackTimer: 0,
          attackWindup: 0,
          hitByAttack: -1,
          facing: fromLeft ? 1 : -1,
          tint: "#b57f46",
          scoreValue: 12,
          knockback: 28
        };

  state.enemies.push(enemy);
}

function damageEnemy(
  state: GameState,
  enemy: Enemy,
  damage: number,
  x: number,
  y: number,
  source: "melee" | "ranged" | "dash" = "melee"
) {
  const droidekaShieldActive =
    enemy.kind === "droideka" && enemy.shieldPattern && !enemy.rolling;

  if (droidekaShieldActive && source === "ranged") {
    spawnParticleBurst(state, x, y, 7, "#a7d8ff");
    return false;
  }

  const blocked =
    droidekaShieldActive &&
    source === "ranged" &&
    ((enemy.hitsTaken ?? 0) + 1) % 2 === 0;
  enemy.hitsTaken = (enemy.hitsTaken ?? 0) + 1;

  if (blocked) {
    spawnParticleBurst(state, x, y, 7, "#a7d8ff");
    return false;
  }

  const finalDamage =
    enemy.kind === "droideka" && source === "ranged" ? Math.min(1, damage) : damage;
  enemy.health -= finalDamage;
  return true;
}

function canRangedTarget(enemy: Enemy) {
  return enemy.kind !== "droideka" || Boolean(enemy.rolling);
}

function strongestEnemySort(a: Enemy, b: Enemy) {
  return b.maxHealth + b.damage * 2 + b.scoreValue / 12 - (a.maxHealth + a.damage * 2 + a.scoreValue / 12);
}

function isBossWave(wave: number) {
  return wave > 0 && wave % 60 === 0;
}

function bossWaveForLevel(level: number) {
  const firstWave = (level - 1) * WAVES_PER_LEVEL + 1;
  const lastWave = level * WAVES_PER_LEVEL;
  const bossWave = Math.floor(lastWave / 60) * 60;
  return bossWave >= firstWave ? bossWave : null;
}

function summonBossDroids(state: GameState) {
  const options: EnemyKind[] =
    state.wave >= 40
      ? ["scout", "brute", "commando", "droideka"]
      : state.wave >= 20
        ? ["scout", "brute", "commando"]
        : ["scout", "brute"];
  const kind = options[Math.floor(Math.random() * options.length)];
  spawnEnemy(state, kind);
  spawnEnemy(state, kind);
}

function spawnCoinDrop(state: GameState, x: number, y: number, amount: number) {
  for (let index = 0; index < amount; index += 1) {
    const kind: CoinKind = Math.random() < 0.18 ? "gold" : "silver";
    state.coins.push({
      id: state.nextCoinId++,
      x: x + (Math.random() * 22 - 11),
      y: y + (Math.random() * 14 - 7),
      value: kind === "gold" ? 10 : 1,
      bob: Math.random() * Math.PI * 2,
      kind
    });
  }
}

function spawnParticleBurst(
  state: GameState,
  x: number,
  y: number,
  count: number,
  color: string
) {
  for (let index = 0; index < count; index += 1) {
    const life = 0.28 + Math.random() * 0.2;
    state.particles.push({
      id: state.nextParticleId++,
      x,
      y,
      vx: Math.random() * 150 - 75,
      vy: -(Math.random() * 90 + 30),
      life,
      maxLife: life,
      color,
      size: 4 + Math.random() * 6
    });
  }
}

function abilityLabel(ability: AbilityKind) {
  if (ability === "fireball") return "Fireball";
  if (ability === "spike_trap") return "Spike Trap";
  if (ability === "dash_strike") return "Dash Strike";
  if (ability === "heal_pulse") return "Heal Pulse";
  if (ability === "freeze_blast") return "Freeze Blast";
  if (ability === "turret_droid") return "Turret Droid";
  if (ability === "shield_bubble") return "Shield Bubble";
  return "Coin Magnet";
}

function abilityDescription(ability: AbilityKind) {
  if (ability === "fireball") return "Arrow Up shoots a fireball forward.";
  if (ability === "spike_trap") return "Arrow Down drops spikes near you.";
  if (ability === "dash_strike") return "Shift plus an arrow dashes and hits enemies.";
  if (ability === "heal_pulse") return "H heals you and nearby troops.";
  if (ability === "freeze_blast") return "F slows enemies in your chosen direction.";
  if (ability === "turret_droid") return "T places a short-lived shooting turret.";
  if (ability === "shield_bubble") return "Hold E to bubble-shield you and your troops.";
  return "M pulls coins to you faster for a few seconds.";
}

function directionFromKeys(keys: Record<string, boolean>, fallback: 1 | -1) {
  if (keys.ArrowRight && !keys.ArrowLeft) return 1;
  if (keys.ArrowLeft && !keys.ArrowRight) return -1;
  return fallback;
}

function applyAbility(state: GameState, ability: AbilityKind) {
  const player = state.player;
  if (ability === "fireball") {
    player.fireballLevel += 1;
  } else if (ability === "spike_trap") {
    player.spikeTrapLevel += 1;
  } else if (ability === "dash_strike") {
    player.dashStrikeLevel += 1;
  } else if (ability === "heal_pulse") {
    player.healPulseLevel += 1;
  } else if (ability === "freeze_blast") {
    player.freezeBlastLevel += 1;
  } else if (ability === "turret_droid") {
    player.turretDroidLevel += 1;
  } else if (ability === "shield_bubble") {
    player.shieldBubbleLevel += 1;
  } else {
    player.coinMagnetLevel += 1;
  }
}

function triggerAbility(
  state: GameState,
  ability: AbilityKind,
  keys: Record<string, boolean>
) {
  const player = state.player;
  const direction = directionFromKeys(keys, player.facing);
  const centerX = player.x + player.w / 2;

  if (ability === "fireball" && player.fireballLevel > 0 && player.fireballCooldown === 0) {
    player.fireballCooldown = 1.2;
    state.projectiles.push({
      id: state.nextProjectileId++,
      kind: "fireball",
      x: centerX + direction * 18,
      y: player.y + 26,
      w: 22,
      h: 16,
      vx: direction * (360 + player.fireballLevel * 20),
      startX: centerX,
      maxDistance: WIDTH / 2,
      damage: 2 + player.fireballLevel,
      life: 1.6,
      hitIds: [],
      chestHitIds: []
    });
    spawnParticleBurst(state, centerX + direction * 20, player.y + 30, 8, "#ff9b3d");
  } else if (
    ability === "spike_trap" &&
    player.spikeTrapLevel > 0 &&
    player.spikeTrapCooldown === 0
  ) {
    player.spikeTrapCooldown = 1.8;
    const trapWidth = 54 + player.spikeTrapLevel * 8;
    const trapX = clamp(centerX + direction * (player.w + trapWidth / 2 + 18), trapWidth / 2 + 20, WIDTH - trapWidth / 2 - 20);
    state.spikeTraps.push({
      id: state.nextTrapId++,
      x: trapX,
      y: FLOOR_Y - 16,
      w: trapWidth,
      h: 18,
      damage: 1 + player.spikeTrapLevel,
      armTimer: 0.45,
      hitIds: []
    });
    spawnParticleBurst(state, trapX, FLOOR_Y - 14, 7, "#d7e0ef");
  } else if (
    ability === "dash_strike" &&
    player.dashStrikeLevel > 0 &&
    player.dashStrikeCooldown === 0
  ) {
    player.dashStrikeCooldown = 1.4;
    const startX = player.x;
    const dashDistance = 135 + player.dashStrikeLevel * 18;
    player.x = clamp(player.x + direction * dashDistance, 40, WIDTH - player.w - 40);
    player.facing = direction;
    player.invuln = Math.max(player.invuln, 0.28);
    const dashDamage = 2 + player.dashStrikeLevel;
    const dashBox = {
      x: Math.min(startX, player.x) - 8,
      y: player.y - 2,
      w: Math.abs(player.x - startX) + player.w + 16,
      h: player.h + 4
    };
    for (const enemy of state.enemies) {
      const crossedEnemy =
        enemy.x + enemy.w >= dashBox.x &&
        enemy.x <= dashBox.x + dashBox.w &&
        Math.abs(enemy.y + enemy.h / 2 - (player.y + player.h / 2)) < 70;
      if (intersects(dashBox, enemy) || crossedEnemy) {
        damageEnemy(state, enemy, dashDamage, enemy.x + enemy.w / 2, enemy.y + 24, "dash");
        enemy.x += direction * 24;
        spawnParticleBurst(state, enemy.x + enemy.w / 2, enemy.y + 24, 6, "#f5f7ff");
      }
    }
    spawnParticleBurst(state, player.x + player.w / 2, player.y + 34, 12, "#f5f7ff");
  } else if (
    ability === "heal_pulse" &&
    player.healPulseLevel > 0 &&
    player.healPulseCooldown === 0
  ) {
    player.healPulseCooldown = 6;
    const heal = 1 + Math.floor(player.healPulseLevel / 2);
    player.health = Math.min(player.maxHealth, player.health + heal);
    for (const ally of state.allies) {
      ally.health = Math.min(ally.maxHealth, ally.health + heal);
    }
    spawnParticleBurst(state, centerX, player.y + 26, 18, "#79f2a6");
  } else if (
    ability === "freeze_blast" &&
    player.freezeBlastLevel > 0 &&
    player.freezeBlastCooldown === 0
  ) {
    player.freezeBlastCooldown = 4.5;
    const freezeBox = {
      x: direction === 1 ? player.x + player.w : player.x - 250 - player.freezeBlastLevel * 20,
      y: player.y - 8,
      w: 250 + player.freezeBlastLevel * 20,
      h: player.h + 20
    };
    for (const enemy of state.enemies) {
      if (intersects(freezeBox, enemy)) {
        enemy.slowTimer = Math.max(enemy.slowTimer ?? 0, 2 + player.freezeBlastLevel * 0.35);
      }
    }
    spawnParticleBurst(state, centerX + direction * 72, player.y + 28, 16, "#9fe7ff");
  } else if (
    ability === "turret_droid" &&
    player.turretDroidLevel > 0 &&
    player.turretDroidCooldown === 0
  ) {
    player.turretDroidCooldown = 6;
    state.turrets.push({
      id: state.nextTurretId++,
      x: centerX,
      y: FLOOR_Y - 42,
      life: 5 + player.turretDroidLevel,
      damage: 1 + Math.floor(player.turretDroidLevel / 2),
      range: 250 + player.turretDroidLevel * 18,
      cooldown: 0.2
    });
    spawnParticleBurst(state, centerX, FLOOR_Y - 42, 10, "#b5e2ff");
  } else if (
    ability === "shield_bubble" &&
    player.shieldBubbleLevel > 0 &&
    player.shieldBubbleCooldown === 0
  ) {
    player.shieldBubbleCooldown = 7;
    player.shieldBubbleTimer = 1.6;
    player.shieldBlocks = Math.min(MAX_SHIELD_LEVEL, player.shieldBlocks + 1);
    player.troopShieldBlocks = Math.min(MAX_SHIELD_LEVEL, player.troopShieldBlocks + 1);
    for (const ally of state.allies) {
      ally.shieldPattern = true;
      ally.hitsTaken = ally.hitsTaken ?? 0;
    }
    spawnParticleBurst(state, centerX, player.y + 22, 18, "#a7d8ff");
  } else if (
    ability === "coin_magnet" &&
    player.coinMagnetLevel > 0 &&
    player.coinMagnetCooldown === 0
  ) {
    player.coinMagnetCooldown = 8;
    player.coinMagnetTimer = 4 + player.coinMagnetLevel;
    spawnParticleBurst(state, centerX, player.y + 20, 14, "#ffe282");
  }
}

function holdShieldBubble(state: GameState) {
  const player = state.player;
  if (
    player.shieldBubbleLevel === 0 ||
    player.shieldBubbleCooldown > 0 ||
    player.shieldBubbleTimer > 0 ||
    player.attackTimer > 0
  ) {
    return;
  }

  player.shieldBubbleTimer = 0.18;
}

function useSpecialTroopAbility(state: GameState, ally: Ally, target: Enemy | null) {
  const player = state.player;
  if (ally.specialCooldown && ally.specialCooldown > 0) return false;

  const centerX = ally.x + ally.w / 2;
  const targetY = ally.y + 22;

  if (ally.kind === "medic_clone") {
    const woundedTroops = state.allies.filter(
      (candidate) => candidate.id !== ally.id && candidate.health < candidate.maxHealth
    );
    if (woundedTroops.length > 0) {
      for (const candidate of woundedTroops) {
        if (Math.abs(candidate.x - ally.x) <= 220) {
          const heal = Math.max(1, Math.ceil(candidate.maxHealth * 0.25));
          candidate.health = Math.min(candidate.maxHealth, candidate.health + heal);
          spawnParticleBurst(state, candidate.x + candidate.w / 2, candidate.y + 18, 8, "#79f2a6");
        }
      }
      ally.specialCooldown = 5;
      spawnParticleBurst(state, centerX, targetY, 10, "#79f2a6");
      return true;
    }
  }

  if (
    player.fireballLevel > 0 &&
    target &&
    Math.abs(target.x - ally.x) <= WIDTH / 2
  ) {
    const direction = target.x >= ally.x ? 1 : -1;
    state.projectiles.push({
      id: state.nextProjectileId++,
      kind: "fireball",
      x: centerX + direction * 18,
      y: ally.y + 28,
      w: 22,
      h: 16,
      vx: direction * (340 + player.fireballLevel * 18),
      startX: centerX,
      maxDistance: WIDTH / 2,
      damage: ally.kind === "clone_commander" ? 2 + player.fireballLevel : 1 + player.fireballLevel,
      life: 1.5,
      hitIds: [],
      chestHitIds: []
    });
    ally.specialCooldown = ally.kind === "clone_commander" ? 4.2 : 5.2;
    spawnParticleBurst(state, centerX + direction * 16, ally.y + 24, 8, "#ff9b3d");
    return true;
  }

  return false;
}

function addAlly(state: GameState, kind: AllyKind) {
  const id = state.nextAllyId++;
  const base = {
    id,
    name: troopName(id),
    kind,
    x: WIDTH / 2 - 60 + state.allies.length * 16,
    y: FLOOR_Y - 60,
    attackTimer: 0,
    attackWindup: 0,
    targetId: null,
    facing: 1 as 1 | -1,
    shieldPattern: state.player.troopShieldBlocks > 0,
    guarding: false,
    guardTargetId: null,
    hitsTaken: 0,
    healthLevel: 0,
    rangeLevel: 0,
    speedLevel: 0,
    specialCooldown: 0,
    weaponMode: "dual" as "dual" | "blaster"
  };
  const ally: Ally =
    kind === "clone_commander"
      ? {
          ...base,
          y: FLOOR_Y - 62,
          w: 28,
          h: 62,
          speed: 108,
          health: 8,
          maxHealth: 8,
          damage: 3,
          attackRange: 180,
          attackCooldown: 0.75,
          color: "#6db4ff",
          cost: SHOP_COSTS.cloneCommander
        }
      : kind === "medic_clone"
        ? {
            ...base,
            y: FLOOR_Y - 62,
            w: 28,
            h: 62,
            speed: 104,
            health: 8,
            maxHealth: 8,
            damage: 2,
            attackRange: 175,
            attackCooldown: 0.82,
            color: "#86d3c9",
            cost: SHOP_COSTS.medicClone
          }
      : kind === "archer"
      ? {
          ...base,
          y: FLOOR_Y - 58,
          w: 24,
          h: 58,
          speed: 102,
          health: 4,
          maxHealth: 4,
          damage: 2,
          attackRange: 170,
          attackCooldown: 1.1,
          color: "#87d1a5",
          cost: SHOP_COSTS.archer
        }
      : kind === "shieldsman"
        ? {
            ...base,
            y: FLOOR_Y - 62,
            w: 28,
            h: 62,
            speed: 92,
            health: 8,
            maxHealth: 8,
            damage: 1,
            attackRange: 24,
            attackCooldown: 0.9,
            color: "#aab7d1",
            cost: SHOP_COSTS.shieldsman,
            shieldPattern: true
          }
        : kind === "sniper"
          ? {
              ...base,
              y: FLOOR_Y - 60,
              w: 24,
              h: 60,
              speed: 86,
              health: 3,
              maxHealth: 3,
              damage: 4,
              attackRange: WIDTH / 2,
              attackCooldown: 1.8,
              color: "#9fc5ff",
              cost: SHOP_COSTS.sniper
            }
          : {
              ...base,
              w: 26,
              h: 60,
              speed: 128,
              health: 6,
              maxHealth: 6,
              damage: 1,
              attackRange: 28,
              attackCooldown: 0.8,
              color: "#80b7ff",
              cost: SHOP_COSTS.squire
            };

  state.allies.push(ally);
  spawnParticleBurst(state, ally.x + ally.w / 2, ally.y + 12, 8, "#b5e2ff");
}

function applyPermanentShop(state: GameState, shop: PermanentShop) {
  state.player.troopShieldBlocks = Math.min(MAX_SHIELD_LEVEL, shop.troopShield);
  for (let index = 0; index < shop.squire; index += 1) {
    addAlly(state, "squire");
  }
  for (let index = 0; index < shop.archer; index += 1) {
    addAlly(state, "archer");
  }
  for (let index = 0; index < shop.shieldsman; index += 1) {
    addAlly(state, "shieldsman");
  }
  for (let index = 0; index < shop.sniper; index += 1) {
    addAlly(state, "sniper");
  }
  state.player.health = Math.min(maxFoodHealth(state.player), state.player.health + shop.food);
  state.player.shieldBlocks = Math.min(MAX_SHIELD_LEVEL, shop.shield);
}

function drawHeldShield(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  level: number,
  facing: 1 | -1
) {
  const shieldX = Math.round(x + (facing === 1 ? 30 : -8));
  const shieldY = Math.round(y + 22);
  ctx.fillStyle = level >= 2 ? "#eef4ff" : "#c8d1e2";
  ctx.fillRect(shieldX, shieldY, 12, 18);
  ctx.fillStyle = level >= 2 ? "#7aa9e8" : "#8390aa";
  ctx.fillRect(shieldX + 2, shieldY + 2, 8, 14);
  ctx.fillStyle = "#f4f7fb";
  ctx.fillRect(shieldX + 4, shieldY + 4, 4, 10);
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  amount: "full" | "half" | "empty",
  bonus = false
) {
  ctx.fillStyle = bonus ? "#3a3217" : "#33222a";
  ctx.fillRect(x + 2, y, 4, 4);
  ctx.fillRect(x + 10, y, 4, 4);
  ctx.fillRect(x, y + 4, 16, 8);
  ctx.fillRect(x + 2, y + 12, 12, 4);
  ctx.fillRect(x + 6, y + 16, 4, 4);

  if (amount === "empty") return;

  ctx.fillStyle = bonus
    ? amount === "half" ? "#ffe182" : "#f2b84b"
    : amount === "half" ? "#ff6f7d" : "#e83d55";
  const width = amount === "half" ? 8 : 16;
  ctx.fillRect(x + 2, y, Math.min(4, width - 2), 4);
  if (amount === "full") ctx.fillRect(x + 10, y, 4, 4);
  ctx.fillRect(x, y + 4, width, 8);
  ctx.fillRect(x + 2, y + 12, Math.max(0, width - 4), 4);
  ctx.fillRect(x + 6, y + 16, Math.max(0, Math.min(4, width - 8)), 4);
  if (bonus) {
    ctx.fillStyle = "#fff1c1";
    ctx.fillRect(x + 4, y + 5, Math.max(0, Math.min(7, width - 4)), 2);
  }
}

function drawHealthHearts(ctx: CanvasRenderingContext2D, health: number, maxHealth: number) {
  const heartsToShow = Math.min(MAX_HEARTS, Math.ceil(Math.max(maxHealth, health)));
  for (let index = 0; index < heartsToShow; index += 1) {
    const row = Math.floor(index / HEARTS_PER_ROW);
    const column = index % HEARTS_PER_ROW;
    const remaining = health - index;
    const amount = remaining >= 1 ? "full" : remaining >= 0.5 ? "half" : "empty";
    drawHeart(ctx, 34 + column * 18, 40 + row * 22, amount, index >= maxHealth);
  }
}

function drawHealthHeartsWithPulse(
  ctx: CanvasRenderingContext2D,
  health: number,
  maxHealth: number,
  tick: number,
  heartbeatOn: boolean
) {
  const pulse = heartbeatOn ? Math.sin(tick * 6) * (health <= maxHealth * 0.35 ? 3 : 1.5) : 0;
  const heartsToShow = Math.min(MAX_HEARTS, Math.ceil(Math.max(maxHealth, health)));
  for (let index = 0; index < heartsToShow; index += 1) {
    const row = Math.floor(index / HEARTS_PER_ROW);
    const column = index % HEARTS_PER_ROW;
    const remaining = health - index;
    const amount = remaining >= 1 ? "full" : remaining >= 0.5 ? "half" : "empty";
    drawHeart(ctx, 34 + column * 18, 40 + row * 22 + pulse, amount, index >= maxHealth);
  }
}

function drawPlayerAttackRange(ctx: CanvasRenderingContext2D, player: Player) {
  const range = weaponRange(player.weapon);
  const startX = player.facing === 1 ? player.x + player.w : player.x;
  const endX = startX + player.facing * range;
  const y = player.y + 32;

  ctx.save();
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle =
    player.weapon === "heavy_blaster"
      ? "rgba(255, 176, 86, 0.82)"
      : player.weapon === "ion_blaster"
        ? "rgba(110, 255, 236, 0.78)"
        : player.weapon === "double_lightsaber"
          ? "rgba(180, 124, 255, 0.82)"
      : player.weapon === "blaster"
        ? "rgba(139, 211, 255, 0.78)"
        : "rgba(255, 226, 130, 0.82)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(Math.round(startX), Math.round(y));
  ctx.lineTo(Math.round(endX), Math.round(y));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle =
    player.weapon === "heavy_blaster"
      ? "#ffb056"
      : player.weapon === "ion_blaster"
        ? "#6effec"
        : player.weapon === "double_lightsaber"
          ? "#b47cff"
          : player.weapon === "blaster" ? "#8bd3ff" : "#ffe282";
  ctx.fillRect(Math.round(endX) - 3, Math.round(y) - 3, 6, 6);
  ctx.restore();
}

function drawEnergyBubble(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  strength = 1
) {
  ctx.save();
  ctx.strokeStyle = `rgba(145, 215, 255, ${0.42 + strength * 0.28})`;
  ctx.fillStyle = `rgba(145, 215, 255, ${0.1 + strength * 0.1})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 + strength * 0.25})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX - 8, centerY - 8, radius - 10, Math.PI * 1.08, Math.PI * 1.62);
  ctx.stroke();

  ctx.fillStyle = `rgba(255, 255, 255, ${0.35 + strength * 0.3})`;
  ctx.fillRect(centerX - 18, centerY - radius + 13, 10, 4);
  ctx.fillRect(centerX + 15, centerY - radius + 22, 6, 3);
  ctx.restore();
}

function drawShieldBubble(ctx: CanvasRenderingContext2D, player: Player) {
  if (player.shieldBubbleTimer <= 0) return;

  const progress = player.shieldBubbleTimer / 0.18;
  const centerX = Math.round(player.x + player.w / 2);
  const centerY = Math.round(player.y + player.h / 2);
  const radius = 42 + Math.round((1 - Math.min(1, progress)) * 4);
  drawEnergyBubble(ctx, centerX, centerY, radius, Math.min(1, progress));
}

function drawPixelKnight(
  ctx: CanvasRenderingContext2D,
  player: Player,
  flash: boolean,
  character: JediCharacter | ""
) {
  const x = Math.round(player.x);
  const y = Math.round(player.y);
  const facing = player.facing;
  const robe =
    character === "Anakin" ? "#2b211d" : character === "Mace Windu" ? "#3a2d4f" : "#7b5b37";
  const tunic =
    character === "Anakin" ? "#51443a" : character === "Mace Windu" ? "#d7d1c2" : "#e6d7b8";
  const saber =
    character === "Mace Windu" ? "#b47cff" : character === "Anakin" ? "#7ec8ff" : "#8fe6ff";
  const armor = flash ? "#fff5e1" : tunic;

  drawShieldBubble(ctx, player);

  ctx.fillStyle = character === "Anakin" ? "#3b2418" : character === "Mace Windu" ? "#2c1f18" : "#b88754";
  ctx.fillRect(x + 10, y + 4, 18, 12);

  ctx.fillStyle = armor;
  ctx.fillRect(x + 8, y + 16, 22, 26);
  ctx.fillRect(x + 12, y + 44, 6, 20);
  ctx.fillRect(x + 20, y + 44, 6, 20);
  ctx.fillStyle = robe;
  ctx.fillRect(x + 4, y + 18, 7, 28);
  ctx.fillRect(x + 27, y + 18, 7, 28);
  ctx.fillRect(x + 10, y + 34, 18, 14);

  ctx.fillStyle = character === "Mace Windu" ? "#6d5a89" : "#8a6a45";
  ctx.fillRect(x + 8, y + 16, 22, 6);
  ctx.fillRect(x + 13, y + 22, 12, 8);

  ctx.fillStyle = "#f1c48f";
  ctx.fillRect(x + 13, y + 7, 10, 8);

  ctx.fillStyle = "#161d2b";
  ctx.fillRect(x + 18 + facing * 2, y + 10, 2, 2);

  ctx.fillStyle = "#a53e35";
  ctx.fillRect(x + 16, y + 28, 6, 12);

  const handX = facing === 1 ? x + 30 : x + 2;
  const handY = y + 28;
  ctx.fillStyle = armor;
  ctx.fillRect(facing === 1 ? x + 28 : x + 4, y + 24, 8, 8);

  if (isMeleeWeapon(player.weapon)) {
    const handleX = facing === 1 ? handX + 1 : handX - 9;
    const bladeX = facing === 1 ? handleX + 8 : handleX - 34;
    const isDoubleSaber = player.weapon === "double_lightsaber";
    const bladeColor = isDoubleSaber ? "#b47cff" : saber;
    ctx.fillStyle = "#05070b";
    ctx.fillRect(handleX, handY + 1, isDoubleSaber ? 13 : 9, 6);
    ctx.fillStyle = bladeColor;
    ctx.fillRect(bladeX, handY, isDoubleSaber ? 42 : 34, 4);
    if (isDoubleSaber) {
      ctx.fillRect(facing === 1 ? handleX - 32 : handleX + 13, handY + 3, 32, 4);
    }
    ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
    ctx.fillRect(facing === 1 ? bladeX + 4 : bladeX + 8, handY + 1, isDoubleSaber ? 30 : 22, 2);

    if (player.attackTimer > 0) {
      ctx.fillStyle = isDoubleSaber || character === "Mace Windu" ? "rgba(180, 124, 255, 0.32)" : "rgba(126, 200, 255, 0.32)";
      ctx.fillRect(facing === 1 ? bladeX + 4 : bladeX - 8, handY - 6, isDoubleSaber ? 58 : 40, 16);
      ctx.fillStyle = bladeColor;
      ctx.fillRect(facing === 1 ? bladeX + 6 : bladeX - 10, handY - 1, isDoubleSaber ? 60 : 42, 6);
    }
  } else {
    const gunX = facing === 1 ? handX + 1 : handX - 20;
    const isHeavyBlaster = player.weapon === "heavy_blaster";
    const isIonBlaster = player.weapon === "ion_blaster";
    const isLightsaberGun = player.weapon === "lightsaber_gun";
    ctx.fillStyle = "#222b3d";
    ctx.fillRect(gunX, handY - (isHeavyBlaster ? 3 : 1), isHeavyBlaster ? 28 : isIonBlaster ? 24 : isLightsaberGun ? 24 : 20, isHeavyBlaster ? 12 : isIonBlaster ? 11 : isLightsaberGun ? 10 : 9);
    ctx.fillStyle = isHeavyBlaster ? "#8a5b32" : isIonBlaster ? "#2d8a86" : isLightsaberGun ? "#58657e" : "#62718d";
    ctx.fillRect(facing === 1 ? gunX + (isHeavyBlaster ? 24 : isIonBlaster ? 20 : isLightsaberGun ? 20 : 16) : gunX - 8, handY + 1, 10, 4);
    ctx.fillStyle = isHeavyBlaster ? "#ffb056" : isIonBlaster ? "#6effec" : isLightsaberGun ? saber : "#8bd3ff";
    ctx.fillRect(gunX + 5, handY + 1, isHeavyBlaster ? 8 : isIonBlaster ? 7 : isLightsaberGun ? 8 : 5, 3);
    ctx.fillStyle = "#111827";
    ctx.fillRect(facing === 1 ? gunX + 7 : gunX + 8, handY + 8, 5, 7);
    if (isLightsaberGun) {
      ctx.fillStyle = saber;
      ctx.fillRect(facing === 1 ? gunX - 18 : gunX + 24, handY + 2, 18, 3);
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fillRect(facing === 1 ? gunX - 12 : gunX + 28, handY + 3, 10, 1);
    }

    if (player.attackTimer > 0) {
      if (isLightsaberGun && player.attackStyle === "hybrid_melee") {
        ctx.fillStyle = "rgba(143, 230, 255, 0.35)";
        ctx.fillRect(facing === 1 ? gunX + 10 : gunX - 18, handY - 6, 28, 16);
      } else {
        const muzzleX = facing === 1 ? gunX + (isHeavyBlaster ? 35 : isIonBlaster ? 31 : isLightsaberGun ? 31 : 27) : gunX - 11;
        ctx.fillStyle = isHeavyBlaster ? "#ffb056" : isIonBlaster ? "#6effec" : isLightsaberGun ? "#8fe6ff" : "#8bd3ff";
        ctx.fillRect(muzzleX, handY - 1, isHeavyBlaster ? 16 : isIonBlaster ? 14 : isLightsaberGun ? 14 : 12, 8);
        ctx.fillStyle = isHeavyBlaster ? "rgba(255, 176, 86, 0.42)" : isIonBlaster ? "rgba(110, 255, 236, 0.42)" : isLightsaberGun ? "rgba(143, 230, 255, 0.42)" : "rgba(139, 211, 255, 0.42)";
        ctx.fillRect(facing === 1 ? muzzleX + 10 : muzzleX - 18, handY, isHeavyBlaster ? 28 : isIonBlaster ? 24 : isLightsaberGun ? 24 : 20, 5);
      }
    }
  }

  if (player.shieldBlocks > 0 && player.shieldBubbleTimer <= 0) {
    drawHeldShield(ctx, x, y, player.shieldBlocks, facing);
  }
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const x = Math.round(enemy.x);
  const y = Math.round(enemy.y);

  if (enemy.kind === "sith") {
    ctx.fillStyle = "#1b1020";
    ctx.fillRect(x + 8, y + 14, enemy.w - 16, enemy.h - 18);
    ctx.fillStyle = "#4c1f3f";
    ctx.fillRect(x + 5, y + 24, 12, 44);
    ctx.fillRect(x + enemy.w - 17, y + 24, 12, 44);
    ctx.fillStyle = "#d6b28a";
    ctx.fillRect(x + 18, y + 6, 18, 14);
    ctx.fillStyle = "#ff476f";
    ctx.fillRect(x + 12, y + 38, enemy.w - 24, 5);
    ctx.fillRect(enemy.facing === 1 ? x + enemy.w - 2 : x - 34, y + 34, 36, 5);
    if (enemy.attackWindup > 0.12) {
      ctx.fillStyle = "rgba(255, 71, 111, 0.45)";
      ctx.fillRect(x - 10, y + 20, enemy.w + 20, 18);
    }
    const healthRatio = enemy.health / enemy.maxHealth;
    ctx.fillStyle = "#241f24";
    ctx.fillRect(x - 4, y - 12, enemy.w + 8, 6);
    ctx.fillStyle = "#ff476f";
    ctx.fillRect(x - 4, y - 12, (enemy.w + 8) * healthRatio, 6);
    return;
  }

  if (enemy.kind === "droideka" && enemy.rolling) {
    const centerX = x + enemy.w / 2;
    const centerY = y + enemy.w / 2 + 10;
    const radius = enemy.w / 2;
    ctx.fillStyle = "#1b2638";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4d5f7d";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7c8da8";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#26344d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX - radius + 6, centerY);
    ctx.lineTo(centerX + radius - 6, centerY);
    ctx.moveTo(centerX, centerY - radius + 6);
    ctx.lineTo(centerX, centerY + radius - 6);
    ctx.stroke();
    ctx.fillStyle = "#d7e8ff";
    ctx.beginPath();
    ctx.arc(centerX - 6, centerY - 7, 4, 0, Math.PI * 2);
    ctx.arc(centerX + 6, centerY - 7, 4, 0, Math.PI * 2);
    ctx.fill();
    const healthRatio = enemy.health / enemy.maxHealth;
    ctx.fillStyle = "#241f24";
    ctx.fillRect(x, y - 10, enemy.w, 4);
    ctx.fillStyle = "#91d7ff";
    ctx.fillRect(x, y - 10, enemy.w * healthRatio, 4);
    return;
  }

  ctx.fillStyle = enemy.tint;
  ctx.fillRect(x + 8, y + 12, enemy.w - 16, enemy.h - 18);

  ctx.fillStyle =
    enemy.kind === "brute"
      ? "#2d313e"
      : enemy.kind === "droideka"
        ? "#394964"
        : enemy.kind === "commando"
          ? "#25314a"
          : "#6f4121";
  ctx.fillRect(x + 10, y + 2, enemy.w - 20, 16);

  ctx.fillStyle = "#efe2c5";
  ctx.fillRect(x + 15, y + 8, enemy.w - 30, 8);

  ctx.fillStyle = "#221913";
  ctx.fillRect(x + 18, y + 10, 3, 3);
  ctx.fillRect(x + enemy.w - 21, y + 10, 3, 3);

  ctx.fillStyle =
    enemy.kind === "brute"
      ? "#933f34"
      : enemy.kind === "droideka"
        ? "#5e7398"
        : enemy.kind === "commando"
          ? "#89a5dc"
          : "#35465b";
  ctx.fillRect(x + 6, y + enemy.h - 28, enemy.w - 12, 10);

  if (enemy.kind === "commando") {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(enemy.facing === 1 ? x + enemy.w - 2 : x - 16, y + 28, 18, 6);
    ctx.fillStyle = "#9eb7f0";
    ctx.fillRect(enemy.facing === 1 ? x + enemy.w + 12 : x - 18, y + 29, 5, 4);
  }

  ctx.fillStyle = "#1b1f29";
  ctx.fillRect(x + 10, y + enemy.h - 18, 8, 12);
  ctx.fillRect(x + enemy.w - 18, y + enemy.h - 18, 8, 12);

  if (enemy.attackWindup > 0.12) {
    ctx.fillStyle = "rgba(255, 100, 72, 0.55)";
    ctx.fillRect(x - 6, y + 18, enemy.w + 12, 10);
  }

  if (enemy.kind === "droideka" && enemy.shieldPattern && !enemy.rolling) {
    ctx.fillStyle = "rgba(120, 205, 255, 0.12)";
    ctx.beginPath();
    ctx.arc(x + enemy.w / 2, y + enemy.h / 2, enemy.h / 2 + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(140, 210, 255, 0.85)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x + enemy.w / 2, y + enemy.h / 2, enemy.h / 2 + 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(230, 247, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + enemy.w / 2 - 6, y + enemy.h / 2 - 8, enemy.h / 2 - 8, Math.PI * 1.05, Math.PI * 1.6);
    ctx.stroke();
  }

  const healthRatio = enemy.health / enemy.maxHealth;
  ctx.fillStyle = "#241f24";
  ctx.fillRect(x, y - 10, enemy.w, 4);
  ctx.fillStyle =
    enemy.kind === "brute"
      ? "#ff8366"
      : enemy.kind === "droideka"
        ? "#91d7ff"
        : enemy.kind === "commando"
          ? "#9eb7f0"
          : "#ffca63";
  ctx.fillRect(x, y - 10, enemy.w * healthRatio, 4);
}

function drawAlly(
  ctx: CanvasRenderingContext2D,
  ally: Ally,
  shieldBubbleActive: boolean,
  showName: boolean
) {
  const x = Math.round(ally.x);
  const y = Math.round(ally.y);
  const marking =
    ally.kind === "clone_commander"
      ? "#3d7de0"
      : ally.kind === "medic_clone"
        ? "#4fb89d"
        : ally.kind === "sniper"
          ? "#101827"
          : ally.kind === "archer"
            ? "#2f6fd6"
            : ally.kind === "shieldsman"
              ? "#6f7d99"
              : "#e9edf5";

  if (shieldBubbleActive) {
    drawEnergyBubble(ctx, x + ally.w / 2, y + ally.h / 2, Math.max(32, ally.h / 2 + 4), 0.85);
  }

  ctx.fillStyle = "#f2f4f8";
  ctx.fillRect(x + 7, y + 16, ally.w - 14, ally.h - 20);
  ctx.fillStyle = "#d9e0ec";
  ctx.fillRect(x + 10, y + 36, ally.w - 20, 8);
  ctx.fillStyle = marking;
  ctx.fillRect(x + 9, y + 19, ally.w - 18, 5);
  if (ally.kind === "archer") {
    ctx.fillRect(x + 12, y + 28, ally.w - 24, 5);
  }

  ctx.fillStyle = "#f2f4f8";
  ctx.fillRect(x + 7, y + 2, ally.w - 14, 16);
  ctx.fillStyle = "#111827";
  ctx.fillRect(x + 10, y + 8, ally.w - 20, 4);
  ctx.fillStyle = marking;
  ctx.fillRect(x + 9, y + 4, ally.w - 18, 3);

  ctx.fillStyle = "#eef2f8";
  ctx.fillRect(x + 4, y + 20, 6, 18);
  ctx.fillRect(x + ally.w - 10, y + 20, 6, 18);
  ctx.fillRect(x + 11, y + ally.h - 16, 6, 12);
  ctx.fillRect(x + ally.w - 17, y + ally.h - 16, 6, 12);
  ctx.fillStyle = "#202838";
  ctx.fillRect(x + 11, y + ally.h - 5, 6, 4);
  ctx.fillRect(x + ally.w - 17, y + ally.h - 5, 6, 4);

  const blasterX = ally.facing === 1 ? x + ally.w - 2 : x - 18;
  ctx.fillStyle = "#1d2636";
  if (ally.kind === "clone_commander" || ally.kind === "medic_clone") {
    if (ally.weaponMode === "blaster") {
      ctx.fillRect(blasterX - 2, y + 25, 24, 7);
      ctx.fillStyle = ally.kind === "medic_clone" ? "#8de7d0" : "#8fc8ff";
      ctx.fillRect(ally.facing === 1 ? blasterX + 18 : blasterX - 6, y + 27, 8, 3);
    } else {
      ctx.fillRect(blasterX - 1, y + 22, 10, 5);
      ctx.fillRect(blasterX + 8, y + 30, 10, 5);
      ctx.fillStyle = ally.kind === "medic_clone" ? "#8de7d0" : "#8fc8ff";
      ctx.fillRect(ally.facing === 1 ? blasterX + 7 : blasterX - 5, y + 23, 4, 2);
      ctx.fillRect(ally.facing === 1 ? blasterX + 16 : blasterX + 4, y + 31, 4, 2);
    }
  } else {
    ctx.fillRect(blasterX, y + 26, 20, 6);
    ctx.fillStyle = "#7f8da6";
    ctx.fillRect(ally.facing === 1 ? blasterX + 16 : blasterX - 6, y + 27, 8, 3);
  }

  if (ally.kind === "medic_clone") {
    ctx.fillStyle = "#dffff4";
    ctx.fillRect(x + ally.w / 2 - 2, y + 24, 4, 12);
    ctx.fillRect(x + ally.w / 2 - 6, y + 28, 12, 4);
  }

  if (!shieldBubbleActive && ally.guarding) {
    drawHeldShield(ctx, x - 2, y - 2, ally.shieldPattern ? MAX_SHIELD_LEVEL : 1, ally.facing);
  }

  if (ally.attackWindup > 0.06) {
    ctx.fillStyle =
      ally.kind === "archer" ? "rgba(80, 160, 255, 0.55)" : "rgba(128, 183, 255, 0.5)";
    ctx.fillRect(x - 4, y + 16, ally.kind === "archer" ? ally.w + 40 : ally.w + 18, 8);
  }

  const healthRatio = ally.health / ally.maxHealth;
  if (showName) {
    ctx.fillStyle = "#f4f7fb";
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = "center";
    ctx.fillText(ally.name, x + ally.w / 2, y - 12);
    ctx.textAlign = "left";
  }
  ctx.fillStyle = "#182331";
  ctx.fillRect(x, y - 8, ally.w, 4);
  ctx.fillStyle = "#6fd476";
  ctx.fillRect(x, y - 8, ally.w * healthRatio, 4);
}

function drawBackground(ctx: CanvasRenderingContext2D, tick: number, enemyCount: number) {
  ctx.fillStyle = "#18213a";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "#24365f";
  ctx.fillRect(0, 0, WIDTH, 150);
  ctx.fillStyle = "#3f5b8f";
  ctx.fillRect(0, 150, WIDTH, 90);

  ctx.fillStyle = "#e5a661";
  ctx.fillRect(710, 52, 88, 88);
  ctx.fillStyle = "#ffd58b";
  ctx.fillRect(724, 66, 60, 60);
  ctx.fillStyle = "rgba(49, 28, 14, 0.78)";
  ctx.fillRect(724, 82, 60, 28);
  ctx.strokeStyle = "#fff1c1";
  ctx.lineWidth = 2;
  ctx.strokeRect(724, 82, 60, 28);
  ctx.fillStyle = "#fff1c1";
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.textAlign = "center";
  ctx.fillText("ENEMIES", 754, 94);
  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.fillText(String(enemyCount), 754, 108);
  ctx.textAlign = "left";

  ctx.fillStyle = "#2b3155";
  for (let index = 0; index < 8; index += 1) {
    const baseX = index * 140 - ((tick * 8) % 140);
    ctx.beginPath();
    ctx.moveTo(baseX, 260);
    ctx.lineTo(baseX + 46, 210);
    ctx.lineTo(baseX + 96, 260);
    ctx.fill();
  }

  ctx.fillStyle = "#31456f";
  for (let index = 0; index < 7; index += 1) {
    const baseX = index * 160 - ((tick * 14) % 160);
    ctx.beginPath();
    ctx.moveTo(baseX, 300);
    ctx.lineTo(baseX + 52, 240);
    ctx.lineTo(baseX + 120, 300);
    ctx.fill();
  }

  ctx.fillStyle = "#456d34";
  ctx.fillRect(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y);
  ctx.fillStyle = "#5f9348";
  for (let x = 0; x < WIDTH; x += 24) {
    ctx.fillRect(x, FLOOR_Y, 12, 8);
  }
  ctx.fillStyle = "#7ea85c";
  for (let x = 6; x < WIDTH; x += 28) {
    ctx.fillRect(x, FLOOR_Y + 18, 6, 24);
  }
}

function readHighScore(): HighScore {
  if (typeof window === "undefined") {
    return { name: "---", score: 0, level: 1, wave: 1 };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { name: "---", score: 0, level: 1, wave: 1 };
    const parsed = JSON.parse(raw) as Partial<HighScore>;
    if (typeof parsed.name === "string" && typeof parsed.score === "number") {
      return {
        name: parsed.name,
        score: parsed.score,
        level: typeof parsed.level === "number" ? parsed.level : 1,
        wave: typeof parsed.wave === "number" ? parsed.wave : 1
      };
    }
  } catch {}

  return { name: "---", score: 0, level: 1, wave: 1 };
}

function writeHighScore(highScore: HighScore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(highScore));
}

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredUser[];
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (user) =>
          typeof user.username === "string" && typeof user.password === "string"
      );
    }
  } catch {}

  return [];
}

function writeUsers(users: StoredUser[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function readPermanentShop(username: string): PermanentShop {
  if (typeof window === "undefined") return makePermanentShop();

  try {
    const raw = window.localStorage.getItem(userStorageKey(PERMANENT_SHOP_KEY, username));
    if (!raw) return makePermanentShop();
    const parsed = JSON.parse(raw) as Partial<PermanentShop>;
      return {
        squire: typeof parsed.squire === "number" ? parsed.squire : 0,
        archer: typeof parsed.archer === "number" ? parsed.archer : 0,
        shieldsman: typeof parsed.shieldsman === "number" ? parsed.shieldsman : 0,
        sniper: typeof parsed.sniper === "number" ? parsed.sniper : 0,
        food: typeof parsed.food === "number" ? parsed.food : 0,
        shield: typeof parsed.shield === "number" ? parsed.shield : 0,
        troopShield: typeof parsed.troopShield === "number" ? parsed.troopShield : 0
      };
  } catch {
    return makePermanentShop();
  }
}

function writePermanentShop(username: string, shop: PermanentShop) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    userStorageKey(PERMANENT_SHOP_KEY, username),
    JSON.stringify(shop)
  );
}

function readPermanentCores(username: string) {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(userStorageKey(PERMANENT_CORES_KEY, username));
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function writePermanentCores(username: string, cores: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(userStorageKey(PERMANENT_CORES_KEY, username), String(cores));
}

function readAccountCoins(username: string) {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(userStorageKey(ACCOUNT_COINS_KEY, username));
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function writeAccountCoins(username: string, silverCoins: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    userStorageKey(ACCOUNT_COINS_KEY, username),
    String(Math.max(0, Math.floor(silverCoins)))
  );
}

function readGems(username: string) {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(userStorageKey(GEMS_KEY, username));
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function writeGems(username: string, gems: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(userStorageKey(GEMS_KEY, username), String(Math.max(0, gems)));
}

function readCharacter(username: string): JediCharacter | "" {
  if (typeof window === "undefined") return "";
  const raw = window.localStorage.getItem(userStorageKey(CHARACTER_KEY, username));
  return JEDI_CHARACTERS.includes(raw as JediCharacter) ? (raw as JediCharacter) : "";
}

function writeCharacter(username: string, character: JediCharacter) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(userStorageKey(CHARACTER_KEY, username), character);
}

function readUnlockedTroops(username: string): UnlockableTroopKind[] {
  if (typeof window === "undefined") return ["squire"];

  try {
    const raw = window.localStorage.getItem(userStorageKey(DEX_TROOPS_KEY, username));
    if (!raw) return ["squire"];
    const parsed = JSON.parse(raw) as AllyKind[];
    if (!Array.isArray(parsed)) return ["squire"];
    const validTroops = parsed.filter(
      (kind): kind is UnlockableTroopKind => ALL_TROOPS.includes(kind as UnlockableTroopKind)
    );
    return Array.from(new Set<UnlockableTroopKind>(["squire", ...validTroops]));
  } catch {
    return ["squire"];
  }
}

function writeUnlockedTroops(username: string, troops: UnlockableTroopKind[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    userStorageKey(DEX_TROOPS_KEY, username),
    JSON.stringify(Array.from(new Set<UnlockableTroopKind>(["squire", ...troops])))
  );
}

function readUnlockedWeapons(username: string): WeaponType[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(userStorageKey(DEX_WEAPONS_KEY, username));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WeaponType[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((weapon): weapon is WeaponType => RARE_WEAPONS.includes(weapon));
  } catch {
    return [];
  }
}

function writeUnlockedWeapons(username: string, weapons: WeaponType[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    userStorageKey(DEX_WEAPONS_KEY, username),
    JSON.stringify(Array.from(new Set(weapons.filter((weapon) => RARE_WEAPONS.includes(weapon)))))
  );
}

function readDiscoveredAbilities(username: string): AbilityKind[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(userStorageKey(DEX_ABILITIES_KEY, username));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AbilityKind[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((ability): ability is AbilityKind => ALL_ABILITIES.includes(ability));
  } catch {
    return [];
  }
}

function writeDiscoveredAbilities(username: string, abilities: AbilityKind[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    userStorageKey(DEX_ABILITIES_KEY, username),
    JSON.stringify(Array.from(new Set(abilities.filter((ability) => ALL_ABILITIES.includes(ability)))))
  );
}

function readClaimedQuests(username: string): QuestId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(userStorageKey(CLAIMED_QUESTS_KEY, username));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QuestId[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is QuestId => QUESTS.some((quest) => quest.id === id));
  } catch {
    return [];
  }
}

function writeClaimedQuests(username: string, quests: QuestId[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    userStorageKey(CLAIMED_QUESTS_KEY, username),
    JSON.stringify(Array.from(new Set(quests)))
  );
}

function readPermanentTroopUpgrades(username: string): PermanentTroopUpgradeMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(userStorageKey(PERMANENT_TROOP_UPGRADES_KEY, username));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PermanentTroopUpgradeMap;
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function writePermanentTroopUpgrades(username: string, upgrades: PermanentTroopUpgradeMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    userStorageKey(PERMANENT_TROOP_UPGRADES_KEY, username),
    JSON.stringify(upgrades)
  );
}

function cloneGameState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

function readRunSaves(username: string): RunSaveSlot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(userStorageKey(RUN_SAVES_KEY, username));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RunSaveSlot[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (slot) =>
          typeof slot?.slot === "number" &&
          typeof slot?.label === "string" &&
          typeof slot?.savedAt === "string" &&
          typeof slot?.preview === "string" &&
          typeof slot?.state === "object"
      )
      .slice(0, RUN_SAVE_SLOTS);
  } catch {
    return [];
  }
}

function writeRunSaves(username: string, saves: RunSaveSlot[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    userStorageKey(RUN_SAVES_KEY, username),
    JSON.stringify(saves.slice(0, RUN_SAVE_SLOTS))
  );
}

function readRunSavesEnabled(username: string) {
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(userStorageKey(RUN_SAVES_ENABLED_KEY, username));
  return raw == null ? true : raw === "true";
}

function writeRunSavesEnabled(username: string, enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(userStorageKey(RUN_SAVES_ENABLED_KEY, username), String(enabled));
}

function readDailyRewardsState(username: string): DailyRewardsState {
  if (typeof window === "undefined") return makeDailyRewardsState();

  try {
    const raw = window.localStorage.getItem(userStorageKey(DAILY_REWARDS_KEY, username));
    if (!raw) return makeDailyRewardsState();
    const parsed = JSON.parse(raw) as Partial<DailyRewardsState>;
    const fallback = makeDailyRewardsState();
    return {
      lastRefreshDay:
        typeof parsed.lastRefreshDay === "string" && parsed.lastRefreshDay.length > 0
          ? parsed.lastRefreshDay
          : fallback.lastRefreshDay,
      pendingCount:
        typeof parsed.pendingCount === "number" && Number.isFinite(parsed.pendingCount)
          ? Math.max(0, Math.floor(parsed.pendingCount))
          : fallback.pendingCount,
      totalClaims:
        typeof parsed.totalClaims === "number" && Number.isFinite(parsed.totalClaims)
          ? Math.max(0, Math.floor(parsed.totalClaims))
          : fallback.totalClaims,
      chestResetDay:
        typeof parsed.chestResetDay === "string" && parsed.chestResetDay.length > 0
          ? parsed.chestResetDay
          : fallback.chestResetDay,
      silverChestBuys:
        typeof parsed.silverChestBuys === "number" && Number.isFinite(parsed.silverChestBuys)
          ? Math.max(0, Math.floor(parsed.silverChestBuys))
          : fallback.silverChestBuys,
      goldChestBuys:
        typeof parsed.goldChestBuys === "number" && Number.isFinite(parsed.goldChestBuys)
          ? Math.max(0, Math.floor(parsed.goldChestBuys))
          : fallback.goldChestBuys
    };
  } catch {
    return makeDailyRewardsState();
  }
}

function writeDailyRewardsState(username: string, rewards: DailyRewardsState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    userStorageKey(DAILY_REWARDS_KEY, username),
    JSON.stringify(rewards)
  );
}

function syncDailyRewardsState(rewards: DailyRewardsState) {
  const today = currentLocalDayId();
  const missedDays = daysBetweenDayIds(rewards.lastRefreshDay, today);
  const shouldResetChests = rewards.chestResetDay !== today;
  if (missedDays === 0 && !shouldResetChests) return rewards;
  const chestDaysMissed = shouldResetChests ? Math.max(1, daysBetweenDayIds(rewards.chestResetDay, today)) : 0;
  return {
    ...rewards,
    lastRefreshDay: missedDays > 0 ? today : rewards.lastRefreshDay,
    pendingCount: rewards.pendingCount + missedDays,
    chestResetDay: today,
    silverChestBuys: rewards.silverChestBuys + chestDaysMissed * DAILY_CHEST_BUY_LIMIT,
    goldChestBuys: rewards.goldChestBuys + chestDaysMissed * DAILY_CHEST_BUY_LIMIT
  };
}

export function KnightBattleGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(makeInitialState());
  const keysRef = useRef<Record<string, boolean>>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const attackQueuedRef = useRef(false);
  const [screen, setScreen] = useState<ScreenState>("menu");
  const [authView, setAuthView] = useState<AuthView>("welcome");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [menuView, setMenuView] = useState<MenuView>("main");
  const [paused, setPaused] = useState(false);
  const [levelReady, setLevelReady] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState<JediCharacter | "">("");
  const [password, setPassword] = useState("");
  const [menuError, setMenuError] = useState("");
  const [authError, setAuthError] = useState("");
  const [highScore, setHighScore] = useState<HighScore>({
    name: "---",
    score: 0,
    level: 1,
    wave: 1
  });
  const [hud, setHud] = useState<HudState>(makeHudState(makeInitialState()));
  const [abilityChoices, setAbilityChoices] = useState<AbilityKind[] | null>(null);
  const [rareWeaponReward, setRareWeaponReward] = useState<WeaponType | null>(null);
  const [rareWeaponChoices, setRareWeaponChoices] = useState<WeaponType[] | null>(null);
  const [mathChallenge, setMathChallenge] = useState<MathChallenge | null>(null);
  const [mathAnswer, setMathAnswer] = useState("");
  const [mathError, setMathError] = useState("");
  const [permanentShop, setPermanentShop] = useState<PermanentShop>(makePermanentShop());
  const [permanentCores, setPermanentCores] = useState(0);
  const [lastCoreReward, setLastCoreReward] = useState(0);
  const [troopUpgradeOpen, setTroopUpgradeOpen] = useState(false);
  const [selectedTroopIndex, setSelectedTroopIndex] = useState(0);
  const [shopDrawerOpen, setShopDrawerOpen] = useState(false);
  const [battleDexOpen, setBattleDexOpen] = useState(false);
  const [questsOpen, setQuestsOpen] = useState(false);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [runSavesOpen, setRunSavesOpen] = useState(false);
  const [unlockedTroops, setUnlockedTroops] = useState<UnlockableTroopKind[]>(["squire"]);
  const [unlockedRareWeapons, setUnlockedRareWeapons] = useState<WeaponType[]>([]);
  const [discoveredAbilities, setDiscoveredAbilities] = useState<AbilityKind[]>([]);
  const [gems, setGems] = useState(0);
  const [claimedQuests, setClaimedQuests] = useState<QuestId[]>([]);
  const [dailyRewards, setDailyRewards] = useState<DailyRewardsState>(makeDailyRewardsState());
  const [questMessage, setQuestMessage] = useState("");
  const [shopChestMessage, setShopChestMessage] = useState("");
  const [gemChestOpening, setGemChestOpening] = useState<GemChestOpening | null>(null);
  const [soundEffectsOn, setSoundEffectsOn] = useState(true);
  const [heartbeatOn, setHeartbeatOn] = useState(true);
  const [showAttackRange, setShowAttackRange] = useState(true);
  const [showTroopNames, setShowTroopNames] = useState(true);
  const [runSavesEnabled, setRunSavesEnabled] = useState(true);
  const [runSaves, setRunSaves] = useState<RunSaveSlot[]>([]);
  const [slotDraftNames, setSlotDraftNames] = useState<Record<number, string>>({});
  const [currentRunSaveSlot, setCurrentRunSaveSlot] = useState<number | null>(null);
  const [runSaveMessage, setRunSaveMessage] = useState("");
  const rewardedScoreRef = useRef<number | null>(null);
  const hybridSlashQueuedRef = useRef(false);

  const makeHud = (state: GameState): HudState => ({
    ...makeHudState(state),
    cores: permanentCores
  });

  const captureRunPreview = () => {
    try {
      return canvasRef.current?.toDataURL("image/png") ?? "";
    } catch {
      return "";
    }
  };

  const writeRunSavesForUser = (nextSaves: RunSaveSlot[]) => {
    const username = playerName || "Pilot";
    setRunSaves(nextSaves);
    writeRunSaves(username, nextSaves);
  };

  const persistRunSaveSlot = (slot: number, customLabel?: string, silent = false) => {
    if (screen !== "playing") return false;
    const trimmedLabel = (customLabel ?? slotDraftNames[slot] ?? "").trim();
    const label = trimmedLabel.length > 0 ? trimmedLabel : `Run Save ${slot + 1}`;
    const preview = captureRunPreview();
    const save: RunSaveSlot = {
      slot,
      label,
      savedAt: new Date().toLocaleString(),
      preview,
      state: cloneGameState(stateRef.current)
    };
    const nextSaves = [...runSaves.filter((entry) => entry.slot !== slot), save].sort((a, b) => a.slot - b.slot);
    writeRunSavesForUser(nextSaves);
    setSlotDraftNames((current) => ({ ...current, [slot]: label }));
    setCurrentRunSaveSlot(slot);
    if (!silent) {
      setRunSaveMessage(`Saved to slot ${slot + 1}.`);
    }
    return true;
  };

  const maybeAutoSaveCurrentRun = () => {
    if (!runSavesEnabled || currentRunSaveSlot == null || screen !== "playing") return;
    const existingSave = runSaves.find((entry) => entry.slot === currentRunSaveSlot);
    if (!existingSave) return;
    persistRunSaveSlot(currentRunSaveSlot, existingSave.label, true);
  };

  const persistWeaponUnlock = (weapon: WeaponType) => {
    unlockWeapon(stateRef.current.player, weapon);
    if (!RARE_WEAPONS.includes(weapon)) return;
    const nextWeapons = Array.from(new Set<WeaponType>([...unlockedRareWeapons, weapon]));
    setUnlockedRareWeapons(nextWeapons);
    writeUnlockedWeapons(playerName || "Pilot", nextWeapons);
  };

  const persistAbilityDiscovery = (ability: AbilityKind) => {
    const nextAbilities = Array.from(new Set<AbilityKind>([...discoveredAbilities, ability]));
    setDiscoveredAbilities(nextAbilities);
    writeDiscoveredAbilities(playerName || "Pilot", nextAbilities);
  };

  const buyRareWeaponForRun = (weapon: WeaponType) => {
    const state = stateRef.current;
    if (screen !== "playing" || !RARE_WEAPONS.includes(weapon) || isWeaponUnlocked(state.player, weapon)) return;
    if (state.player.silverCoins < RARE_WEAPON_RUN_COST) return;
    state.player.silverCoins -= RARE_WEAPON_RUN_COST;
    writeCurrentCoinBalance(state.player.silverCoins);
    unlockWeapon(state.player, weapon);
    setHud(makeHud(state));
  };

  const buyRareWeaponPermanent = (weapon: WeaponType) => {
    const state = stateRef.current;
    if (!RARE_WEAPONS.includes(weapon) || isWeaponUnlocked(state.player, weapon)) return;
    if (state.player.silverCoins < RARE_WEAPON_PERMANENT_COST) return;
    state.player.silverCoins -= RARE_WEAPON_PERMANENT_COST;
    writeCurrentCoinBalance(state.player.silverCoins);
    persistWeaponUnlock(weapon);
    setHud(makeHud(state));
  };

  const questComplete = (questId: QuestId) => {
    const state = stateRef.current;
    if (questId === "get_everything") {
      const troopKinds = new Set(state.allies.map((ally) => ally.kind));
      const allWeaponsUnlocked = [...BASE_WEAPONS, ...RARE_WEAPONS].every((weapon) => isWeaponUnlocked(state.player, weapon));
      const allAbilitiesUnlocked = ALL_ABILITIES.every((ability) => abilityLevel(state.player, ability) > 0);
      return ALL_TROOPS.every((kind) => troopKinds.has(kind)) && allWeaponsUnlocked && allAbilitiesUnlocked;
    }
    if (questId === "droid_crusher") return state.player.kills >= 100;
    if (questId === "boss_breaker") return state.bossesDefeated >= 1;
    if (questId === "treasure_hunter") return state.chestsOpened >= 5;
    if (questId === "clone_commander") return state.allies.length >= 6;
    return ALL_TROOPS.every((kind) =>
      state.allies.some(
        (ally) =>
          ally.kind === kind &&
          ally.maxHealth >= TROOP_MAX_HP &&
          ally.rangeLevel >= MASTER_TRAINER_RANGE_TARGET &&
          ally.speedLevel >= TROOP_SPEED_MAX_LEVEL
      )
    );
  };

  const claimQuestReward = (questId: QuestId) => {
    if (claimedQuests.includes(questId) || !questComplete(questId)) return;
    const nextClaimedQuests = [...claimedQuests, questId];
    setClaimedQuests(nextClaimedQuests);
    writeClaimedQuests(playerName || "Pilot", nextClaimedQuests);
    if (questId === "get_everything") {
      const nextSilver = stateRef.current.player.silverCoins + 500;
      stateRef.current.player.silverCoins = nextSilver;
      writeCurrentCoinBalance(nextSilver);
      setQuestMessage("Quest complete: Get Everything! Reward: 50 Gold.");
      setHud(makeHud(stateRef.current));
      return;
    }
    if (questId === "master_trainer") {
      const nextSilver = stateRef.current.player.silverCoins + 750;
      stateRef.current.player.silverCoins = nextSilver;
      writeCurrentCoinBalance(nextSilver);
      setQuestMessage("Quest complete: Master Trainer! Reward: 75 Gold.");
      setHud(makeHud(stateRef.current));
      return;
    }
    const gemReward =
      questId === "boss_breaker" ? 12 : questId === "droid_crusher" ? 8 : questId === "treasure_hunter" ? 6 : 5;
    writeCurrentGems(gems + gemReward);
    setQuestMessage(`Quest complete! Reward: ${gemReward} Gems.`);
  };

  const applyGemChestReward = (reward: GemChestReward, tier: GemChestTier) => {
    const state = stateRef.current;
    const chestLabel =
      tier === "grand"
        ? "Grand Gem Chest"
        : tier === "silver"
          ? "Silver Chest"
          : tier === "gold"
            ? "Gold Chest"
            : "Gem Chest";

    if (reward.kind === "weapon") {
      persistWeaponUnlock(reward.weapon);
      setShopChestMessage(`${chestLabel} reward: ${weaponLabel(reward.weapon)}!`);
      setHud(makeHud(state));
      return;
    }

    if (reward.kind === "abilities") {
      for (const ability of reward.abilities) {
        applyAbility(state, ability);
        persistAbilityDiscovery(ability);
      }
      setShopChestMessage(
        `${chestLabel} reward: ${reward.abilities.map((ability) => abilityLabel(ability)).join(", ")}.`
      );
      setHud(makeHud(state));
      return;
    }

    if (reward.kind === "silver") {
      state.player.silverCoins += reward.silver;
      writeCurrentCoinBalance(state.player.silverCoins);
      setShopChestMessage(`${chestLabel} reward: ${reward.silver} Silver.`);
      setHud(makeHud(state));
      return;
    }

    state.player.silverCoins += reward.gold * 10;
    writeCurrentCoinBalance(state.player.silverCoins);
    setShopChestMessage(`${chestLabel} reward: ${reward.gold} Gold.`);
    setHud(makeHud(state));
  };

  const tapGemChest = () => {
    if (!gemChestOpening) return;
    if (gemChestOpening.tapsLeft > 1) {
      setGemChestOpening({
        ...gemChestOpening,
        tapsLeft: gemChestOpening.tapsLeft - 1
      });
      return;
    }

    applyGemChestReward(gemChestOpening.reward, gemChestOpening.tier);
    setGemChestOpening(null);
  };

  const startChestOpening = (tier: GemChestTier) => {
    setGemChestOpening({
      tier,
      tapsLeft: 5,
      reward: rollGemChestReward(stateRef.current.player, tier)
    });
  };

  const openGemChest = (tier: GemChestTier = "basic") => {
    const chestCost = tier === "grand" ? GRAND_GEM_CHEST_COST : GEM_CHEST_COST;
    if (gems < chestCost || gemChestOpening) return;
    writeCurrentGems(gems - chestCost);
    startChestOpening(tier);
  };

  const buyCoinChest = (kind: ShopChestKind) => {
    const syncedRewards = syncCurrentDailyRewards();
    if (gemChestOpening) return;
    if (kind === "silver") {
      if (gems < SILVER_CHEST_GEM_COST || syncedRewards.silverChestBuys <= 0) return;
      writeCurrentGems(gems - SILVER_CHEST_GEM_COST);
      writeCurrentDailyRewards({
        ...syncedRewards,
        silverChestBuys: syncedRewards.silverChestBuys - 1
      });
      startChestOpening("silver");
      return;
    }

    if (gems < GOLD_CHEST_GEM_COST || syncedRewards.goldChestBuys <= 0) return;
    writeCurrentGems(gems - GOLD_CHEST_GEM_COST);
    writeCurrentDailyRewards({
      ...syncedRewards,
      goldChestBuys: syncedRewards.goldChestBuys - 1
    });
    startChestOpening("gold");
  };

  const writeCurrentCoinBalance = (silverCoins: number) => {
    writeAccountCoins(playerName || "Pilot", silverCoins);
  };

  const writeCurrentGems = (nextGems: number) => {
    setGems(nextGems);
    writeGems(playerName || "Pilot", nextGems);
  };

  const writeCurrentDailyRewards = (nextRewards: DailyRewardsState) => {
    setDailyRewards(nextRewards);
    writeDailyRewardsState(playerName || "Pilot", nextRewards);
  };

  const syncCurrentDailyRewards = () => {
    const nextRewards = syncDailyRewardsState(
      readDailyRewardsState(playerName || "Pilot")
    );
    writeCurrentDailyRewards(nextRewards);
    return nextRewards;
  };

  const claimDailyReward = () => {
    const nextRewards = syncCurrentDailyRewards();
    if (nextRewards.pendingCount <= 0) return;

    const reward = DAILY_REWARD_TRACK[nextRewards.totalClaims % DAILY_REWARD_TRACK.length];
    const state = stateRef.current;

    if (reward.chestKind) {
      startChestOpening(reward.chestKind);
    } else if (reward.kind === "silver") {
      state.player.silverCoins += reward.amount;
      writeCurrentCoinBalance(state.player.silverCoins);
    } else if (reward.kind === "gold") {
      state.player.silverCoins += reward.amount * 10;
      writeCurrentCoinBalance(state.player.silverCoins);
    } else if (reward.kind === "gems") {
      writeCurrentGems(gems + reward.amount);
    } else {
      const nextCores = permanentCores + reward.amount;
      setPermanentCores(nextCores);
      writePermanentCores(playerName || "Pilot", nextCores);
    }

    const updatedRewards = {
      ...nextRewards,
      pendingCount: nextRewards.pendingCount - 1,
      totalClaims: nextRewards.totalClaims + 1
    };
    writeCurrentDailyRewards(updatedRewards);
    setQuestMessage(`Daily reward claimed: ${reward.label}.`);
    setHud({ ...makeHud(state), cores: reward.kind === "cores" ? permanentCores + reward.amount : permanentCores });
  };

  const playSound = (kind: "hit" | "shoot" | "block") => {
    if (!soundEffectsOn || typeof window === "undefined") return;
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = audioContextRef.current ?? new AudioContextClass();
    audioContextRef.current = audioContext;
    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    const now = audioContext.currentTime;
    const master = audioContext.createGain();
    master.gain.setValueAtTime(0.12, now);
    master.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    master.connect(audioContext.destination);

    const playTone = (
      type: OscillatorType,
      startFrequency: number,
      endFrequency: number,
      duration: number,
      volume: number,
      delay = 0
    ) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const start = now + delay;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(startFrequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start);
      oscillator.stop(start + duration);
    };

    if (kind === "shoot") {
      playTone("sawtooth", 920, 180, 0.14, 0.28);
      playTone("triangle", 1320, 420, 0.08, 0.12, 0.015);
    } else if (kind === "block") {
      playTone("triangle", 380, 760, 0.18, 0.24);
      playTone("sine", 980, 1180, 0.12, 0.1);
    } else {
      playTone("square", 190, 82, 0.2, 0.22);
      playTone("triangle", 95, 55, 0.24, 0.12);
    }
  };

  const showChestMath = () => {
    setMathChallenge(createMathChallenge());
    setMathAnswer("");
    setMathError("");
  };

  const grantChestReward = () => {
    const state = stateRef.current;
    const lockedWeapons = RARE_WEAPONS.filter((weapon) => !isWeaponUnlocked(state.player, weapon));
    const showRareWeapons = lockedWeapons.length > 0 && Math.random() < 0.12;

    if (showRareWeapons) {
      setRareWeaponChoices(chooseRareWeaponChestOptions(lockedWeapons));
      return;
    }
    setAbilityChoices([...ALL_ABILITIES].sort(() => Math.random() - 0.5).slice(0, 3));
  };

  const submitMathAnswer = () => {
    if (!mathChallenge) return;
    const parsed = Number.parseInt(mathAnswer.trim(), 10);
    setMathChallenge(null);
    setMathAnswer("");

    if (Number.isFinite(parsed) && parsed === mathChallenge.answer) {
      setMathError("");
      grantChestReward();
      return;
    }

    const difference = Number.isFinite(parsed) ? Math.abs(parsed - mathChallenge.answer) : 1;
    const spawnedEnemy: EnemyKind =
      difference >= 6 ? "droideka" : difference >= 3 ? "brute" : "scout";
    setMathError(
      spawnedEnemy === "droideka"
        ? "Way off! A Droideka rolled out of the chest."
        : spawnedEnemy === "brute"
          ? "Wrong by a few! A B2 droid jumped out of the chest."
          : "Close, but wrong! A B1 droid jumped out of the chest."
    );
    spawnEnemy(stateRef.current, spawnedEnemy);
    setHud(makeHud(stateRef.current));
  };

  const loadUserProgress = (username: string) => {
    const savedShop = readPermanentShop(username);
    const savedCores = readPermanentCores(username);
    const savedCoins = readAccountCoins(username);
    const savedCharacter = readCharacter(username);
    const savedTroops = readUnlockedTroops(username);
    const savedWeapons = readUnlockedWeapons(username);
    const savedAbilities = readDiscoveredAbilities(username);
    const savedGems = readGems(username);
    const savedClaimedQuests = readClaimedQuests(username);
    const savedDailyRewards = syncDailyRewardsState(readDailyRewardsState(username));
    const savedRunSaves = readRunSaves(username);
    const savedRunSavesEnabled = readRunSavesEnabled(username);
    stateRef.current.player.silverCoins = savedCoins;
    stateRef.current.player.unlockedWeapons = [...BASE_WEAPONS, ...savedWeapons];
    stateRef.current.player.heavyBlasterUnlocked = savedWeapons.includes("heavy_blaster");
    applyCharacterPerks(stateRef.current.player, savedCharacter);
    setSelectedCharacter(savedCharacter);
    setPermanentShop(savedShop);
    setPermanentCores(savedCores);
    setUnlockedTroops(savedTroops);
    setUnlockedRareWeapons(savedWeapons);
    setDiscoveredAbilities(savedAbilities);
    setGems(savedGems);
    setClaimedQuests(savedClaimedQuests);
    setDailyRewards(savedDailyRewards);
    setRunSaves(savedRunSaves);
    setRunSavesEnabled(savedRunSavesEnabled);
    writeDailyRewardsState(username, savedDailyRewards);
    setSlotDraftNames(
      Object.fromEntries(savedRunSaves.map((save) => [save.slot, save.label]))
    );
    setCurrentRunSaveSlot(null);
    setRunSaveMessage("");
    setQuestMessage("");
    setShopChestMessage("");
    setRewardsOpen(false);
    setHud({ ...makeHudState(stateRef.current), cores: savedCores });
  };

  const finishRunRewards = () => {
    const currentState = stateRef.current;
    if (rewardedScoreRef.current === currentState.player.score) {
      return;
    }

    rewardedScoreRef.current = currentState.player.score;
    writeCurrentCoinBalance(currentState.player.silverCoins);

    if (currentState.player.score > highScore.score) {
      const nextHighScore = {
        name: playerName || "Hero",
        score: currentState.player.score,
        level: currentState.level,
        wave: currentState.wave
      };
      setHighScore(nextHighScore);
      writeHighScore(nextHighScore);
    }

    const earnedCores = rewardCoresForScore(currentState.player.score);
    if (earnedCores > 0) {
      setPermanentCores((current) => {
        const next = current + earnedCores;
        writePermanentCores(playerName || "Pilot", next);
        return next;
      });
    }
    setLastCoreReward(earnedCores);
  };

  const restartRun = () => {
    maybeAutoSaveCurrentRun();
    finishRunRewards();
    const nextState = makeInitialState();
    applyPermanentShop(nextState, permanentShop);
    nextState.player.silverCoins = readAccountCoins(playerName || "Pilot");
    nextState.player.unlockedWeapons = [...BASE_WEAPONS, ...unlockedRareWeapons];
    nextState.player.heavyBlasterUnlocked = unlockedRareWeapons.includes("heavy_blaster");
    applyCharacterPerks(nextState.player, selectedCharacter);
    stateRef.current = nextState;
    rewardedScoreRef.current = null;
    attackQueuedRef.current = false;
    resetTransientInput(keysRef.current);
    setPaused(true);
    setLevelReady(true);
    setScreen("playing");
    setMenuView("main");
    setAbilityChoices(null);
    setRareWeaponReward(null);
    setRareWeaponChoices(null);
    setMathChallenge(null);
    setMathAnswer("");
    setMathError("");
    setQuestsOpen(false);
    setRewardsOpen(false);
    setQuestMessage("");
    setShopChestMessage("");
    setRunSavesOpen(false);
    setCurrentRunSaveSlot(null);
    setHud(makeHud(nextState));
  };

  const signOut = () => {
    maybeAutoSaveCurrentRun();
    finishRunRewards();
    const emptyState = makeInitialState();
    setIsSignedIn(false);
    setAuthView("welcome");
    setMenuView("main");
    setScreen("menu");
    setPaused(false);
    setLevelReady(false);
    setPlayerName("");
    setPassword("");
    setPermanentShop(makePermanentShop());
    setPermanentCores(0);
    setSelectedCharacter("");
    setAbilityChoices(null);
    setRareWeaponReward(null);
    setRareWeaponChoices(null);
    setMathChallenge(null);
    setMathAnswer("");
    setMathError("");
    setTroopUpgradeOpen(false);
    setShopDrawerOpen(false);
    setBattleDexOpen(false);
    setQuestsOpen(false);
    setRunSavesOpen(false);
    setUnlockedTroops(["squire"]);
    setUnlockedRareWeapons([]);
    setDiscoveredAbilities([]);
    setGems(0);
    setClaimedQuests([]);
    setDailyRewards(makeDailyRewardsState());
    setQuestMessage("");
    setShopChestMessage("");
    setRewardsOpen(false);
    setRunSaves([]);
    setSlotDraftNames({});
    setCurrentRunSaveSlot(null);
    setRunSaveMessage("");
    setSelectedTroopIndex(0);
    rewardedScoreRef.current = null;
    attackQueuedRef.current = false;
    resetTransientInput(keysRef.current);
    stateRef.current = emptyState;
    setHud({ ...makeHudState(emptyState), cores: 0 });
  };

  const canUseLevelSkip = () =>
    isSignedIn &&
    ["cluper2320", "owner cluper2320"].includes(playerName.trim().toLowerCase()) &&
    password.trim() === "1234";

  const jumpToWave = (wave: number, pauseAfterJump: boolean) => {
    if (!canUseLevelSkip()) return;

    const state = stateRef.current;
    const nextWave = Math.max(1, wave);
    const nextLevel = 1 + Math.floor((nextWave - 1) / WAVES_PER_LEVEL);

    state.level = nextLevel;
    state.wave = nextWave;
    state.elapsed = (nextWave - 1) * LEVEL_DURATION;
    state.levelSpawnSide = randomSpawnSide();
    state.bossActive = false;
    state.bossWave = 0;
    state.spawnTimer = 1.5;
    state.enemies = [];
    state.projectiles = [];
    state.spikeTraps = [];
    attackQueuedRef.current = false;
    resetTransientInput(keysRef.current);

    setPaused(pauseAfterJump);
    setLevelReady(pauseAfterJump);
    setAbilityChoices(null);
    setRareWeaponReward(null);
    setRareWeaponChoices(null);
    setMathChallenge(null);
    setMathAnswer("");
    setMathError("");
    setHud(makeHud(state));
  };

  const jumpToLevel = (level: number) => {
    const nextLevel = Math.max(1, level);
    const nextWave = bossWaveForLevel(nextLevel) ?? (nextLevel - 1) * WAVES_PER_LEVEL + 1;
    jumpToWave(nextWave, true);
  };

  const skipToNextLevel = () => {
    jumpToLevel(stateRef.current.level + 1);
  };

  const skipToPreviousLevel = () => {
    jumpToLevel(stateRef.current.level - 1);
  };

  const skipToNextWave = () => {
    const state = stateRef.current;
    const nextWave = state.wave + 1;
    const nextLevel = 1 + Math.floor((nextWave - 1) / WAVES_PER_LEVEL);
    jumpToWave(nextWave, paused || nextLevel !== state.level || isBossWave(nextWave));
  };

  const skipToPreviousWave = () => {
    const state = stateRef.current;
    const nextWave = Math.max(1, state.wave - 1);
    jumpToWave(nextWave, true);
  };

  useEffect(() => {
    const stored = readHighScore();
    setHighScore(stored);
  }, []);

  useEffect(() => {
    if (!isSignedIn || !playerName.trim()) return;

    syncCurrentDailyRewards();
    const interval = window.setInterval(() => {
      syncCurrentDailyRewards();
    }, 60000);

    return () => window.clearInterval(interval);
  }, [isSignedIn, playerName]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = event.key;
      const isNumberShortcut = (number: string) =>
        key === number || event.code === `Digit${number}` || event.code === `Numpad${number}`;
      if (
        key === " " ||
        key === "ArrowUp" ||
        key === "ArrowDown" ||
        key === "ArrowLeft" ||
        key === "ArrowRight" ||
        key === "Shift"
      ) {
        event.preventDefault();
      }

      if (key.toLowerCase() === "p" && screen === "playing") {
        setPaused((current) => {
          const next = !current;
          if (!next) {
            setLevelReady(false);
          }
          return next;
        });
        return;
      }

      if (key.toLowerCase() === "o" && screen === "playing") {
        event.preventDefault();
        setTroopUpgradeOpen((current) => !current);
        setSelectedTroopIndex((current) =>
          stateRef.current.allies.length === 0 ? 0 : current % stateRef.current.allies.length
        );
        return;
      }

      if (isNumberShortcut("1") && screen === "playing" && canUseLevelSkip()) {
        event.preventDefault();
        skipToNextLevel();
        return;
      }

      if (isNumberShortcut("2") && screen === "playing" && canUseLevelSkip()) {
        event.preventDefault();
        skipToPreviousLevel();
        return;
      }

      if (isNumberShortcut("3") && screen === "playing" && canUseLevelSkip()) {
        event.preventDefault();
        skipToNextWave();
        return;
      }

      if (isNumberShortcut("4") && screen === "playing" && canUseLevelSkip()) {
        event.preventDefault();
        skipToPreviousWave();
        return;
      }

      if (screen === "playing" && !paused && !abilityChoices && !rareWeaponReward && !rareWeaponChoices && !mathChallenge && !gemChestOpening && !rewardsOpen) {
        if (key.toLowerCase() === "a") {
          stateRef.current.player.weapon = "blaster";
          setHud(makeHudState(stateRef.current));
          return;
        }
        if (key.toLowerCase() === "d") {
          stateRef.current.player.weapon = "lightsaber";
          setHud(makeHudState(stateRef.current));
          return;
        }
        if (key.toLowerCase() === "q" && stateRef.current.player.weapon === "lightsaber_gun") {
          attackQueuedRef.current = true;
          hybridSlashQueuedRef.current = true;
          return;
        }
        if (key.toLowerCase() === "w" && stateRef.current.player.weapon === "lightsaber_gun") {
          attackQueuedRef.current = true;
          hybridSlashQueuedRef.current = false;
          return;
        }
        if (key.toLowerCase() === "q") {
          cycleWeapon(stateRef.current.player);
          setHud(makeHudState(stateRef.current));
          return;
        }
        if (key.toLowerCase() === "s" && isWeaponUnlocked(stateRef.current.player, "heavy_blaster")) {
          stateRef.current.player.weapon = "heavy_blaster";
          setHud(makeHudState(stateRef.current));
          return;
        }
        if (key.toLowerCase() === "w" && isWeaponUnlocked(stateRef.current.player, "double_lightsaber")) {
          stateRef.current.player.weapon = "double_lightsaber";
          setHud(makeHudState(stateRef.current));
          return;
        }
        if (key.toLowerCase() === "x" && isWeaponUnlocked(stateRef.current.player, "ion_blaster")) {
          stateRef.current.player.weapon = "ion_blaster";
          setHud(makeHudState(stateRef.current));
          return;
        }
        if (key.toLowerCase() === "r" && isWeaponUnlocked(stateRef.current.player, "lightsaber_gun")) {
          stateRef.current.player.weapon = "lightsaber_gun";
          setHud(makeHudState(stateRef.current));
          return;
        }

        if (!event.repeat) {
          if (key === "ArrowUp") {
            triggerAbility(stateRef.current, "fireball", keysRef.current);
            setHud(makeHudState(stateRef.current));
            return;
          }
          if (key === "ArrowDown") {
            triggerAbility(stateRef.current, "spike_trap", keysRef.current);
            setHud(makeHudState(stateRef.current));
            return;
          }
          if (key === "Shift") {
            triggerAbility(stateRef.current, "dash_strike", keysRef.current);
            setHud(makeHudState(stateRef.current));
            return;
          }
          if (key.toLowerCase() === "h") {
            triggerAbility(stateRef.current, "heal_pulse", keysRef.current);
            setHud(makeHudState(stateRef.current));
            return;
          }
          if (key.toLowerCase() === "f") {
            triggerAbility(stateRef.current, "freeze_blast", keysRef.current);
            setHud(makeHudState(stateRef.current));
            return;
          }
          if (key.toLowerCase() === "t") {
            triggerAbility(stateRef.current, "turret_droid", keysRef.current);
            setHud(makeHudState(stateRef.current));
            return;
          }
          if (key.toLowerCase() === "m") {
            triggerAbility(stateRef.current, "coin_magnet", keysRef.current);
            setHud(makeHudState(stateRef.current));
            return;
          }
        }
      }

      if (screen === "playing" && !paused) {
        keysRef.current[key] = true;
      }

      if (
        key === " " &&
        screen === "playing" &&
        !paused &&
        stateRef.current.player.weapon !== "lightsaber_gun"
      ) {
        attackQueuedRef.current = true;
        hybridSlashQueuedRef.current = false;
      }

      if (screen === "gameover" && key.toLowerCase() === "r") {
        restartRun();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      keysRef.current[event.key] = false;
      if (event.key.toLowerCase() === "e") {
        keysRef.current.e = false;
        keysRef.current.E = false;
        const player = stateRef.current.player;
        if (player.shieldBubbleLevel > 0 && player.shieldBubbleTimer > 0) {
          player.shieldBubbleTimer = 0;
          player.shieldBubbleCooldown = 7;
          setHud(makeHudState(stateRef.current));
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [abilityChoices, gemChestOpening, isSignedIn, mathChallenge, password, paused, playerName, rareWeaponChoices, rareWeaponReward, rewardsOpen, screen, troopUpgradeOpen]);

  useEffect(() => {
    if (
      !runSavesEnabled ||
      currentRunSaveSlot == null ||
      screen !== "playing" ||
      paused ||
      abilityChoices ||
      rewardsOpen ||
      rareWeaponReward ||
      rareWeaponChoices ||
      mathChallenge ||
      gemChestOpening
    ) {
      return;
    }

    const autosaveInterval = window.setInterval(() => {
      maybeAutoSaveCurrentRun();
    }, 12000);

    return () => window.clearInterval(autosaveInterval);
  }, [
    abilityChoices,
    currentRunSaveSlot,
    gemChestOpening,
    mathChallenge,
    paused,
    rareWeaponChoices,
    rareWeaponReward,
    rewardsOpen,
    runSavesEnabled,
    screen,
    runSaves
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    let animationFrame = 0;
    let lastTime = performance.now();
    let hudTimer = 0;

    const loop = (now: number) => {
      const state = stateRef.current;
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      if (screen === "playing" && !paused && !abilityChoices && !rareWeaponReward && !rareWeaponChoices && !mathChallenge && !gemChestOpening && !rewardsOpen) {
        if (!state.bossActive) {
          state.elapsed += dt;
        }
        const nextWave = 1 + Math.floor(state.elapsed / LEVEL_DURATION);
        const nextLevel = 1 + Math.floor((nextWave - 1) / WAVES_PER_LEVEL);
        if (nextWave !== state.wave) {
          state.wave = nextWave;
          state.levelSpawnSide = randomSpawnSide();
        }
        if (isBossWave(state.wave) && !state.bossActive && state.bossWave !== state.wave) {
          state.bossActive = true;
          state.bossWave = state.wave;
          state.enemies = [];
          state.spawnTimer = 999;
          spawnEnemy(state, "sith");
        }
        if (nextLevel !== state.level) {
          state.level = nextLevel;
          setPaused(true);
          setLevelReady(true);
        }

        const player = state.player;
        player.cooldownTimer = Math.max(0, player.cooldownTimer - dt);
        player.attackTimer = Math.max(0, player.attackTimer - dt);
        player.invuln = Math.max(0, player.invuln - dt);
        player.comboTimer = Math.max(0, player.comboTimer - dt);
        player.fireballCooldown = Math.max(0, player.fireballCooldown - dt);
        player.spikeTrapCooldown = Math.max(0, player.spikeTrapCooldown - dt);
        player.dashStrikeCooldown = Math.max(0, player.dashStrikeCooldown - dt);
        player.healPulseCooldown = Math.max(0, player.healPulseCooldown - dt);
        player.freezeBlastCooldown = Math.max(0, player.freezeBlastCooldown - dt);
        player.turretDroidCooldown = Math.max(0, player.turretDroidCooldown - dt);
        player.shieldBubbleCooldown = Math.max(0, player.shieldBubbleCooldown - dt);
        player.shieldBubbleTimer = Math.max(0, player.shieldBubbleTimer - dt);
        player.coinMagnetCooldown = Math.max(0, player.coinMagnetCooldown - dt);
        player.coinMagnetTimer = Math.max(0, player.coinMagnetTimer - dt);
        const shieldHeld = keysRef.current.e || keysRef.current.E;
        if (shieldHeld && player.attackTimer > 0) {
          player.shieldBubbleTimer = 0;
        } else if (shieldHeld) {
          holdShieldBubble(state);
        }
        if (player.comboTimer === 0 && player.attackTimer === 0) {
          player.comboStep = 0;
        }

        const moveX =
          (keysRef.current.ArrowRight ? 1 : 0) - (keysRef.current.ArrowLeft ? 1 : 0);
        const moveY =
          (keysRef.current.ArrowDown ? 1 : 0) - (keysRef.current.ArrowUp ? 1 : 0);

        player.x += moveX * (PLAYER_SPEED + player.speedBonus) * dt;
        player.y += moveY * (PLAYER_SPEED - 20) * dt;
        player.x = clamp(player.x, 40, WIDTH - player.w - 40);
        player.y = clamp(player.y, FLOOR_Y - player.h, FLOOR_Y - player.h);

        if (moveX !== 0) {
          player.facing = moveX > 0 ? 1 : -1;
        }

        if (
          attackQueuedRef.current &&
          player.cooldownTimer === 0 &&
          player.attackTimer === 0
        ) {
          attackQueuedRef.current = false;
          player.shieldBubbleTimer = 0;
          player.attackId += 1;
          player.attackHits = 0;
          player.attackStyle = hybridSlashQueuedRef.current ? "hybrid_melee" : "normal";
          hybridSlashQueuedRef.current = false;
          player.attackTimer = ATTACK_DURATION;
          player.cooldownTimer = Math.max(0.12, ATTACK_COOLDOWN - player.cooldownBonus * 0.03);
          player.comboStep = (player.comboStep % 3) + 1;
          player.comboTimer = 0.7;
          if (isRangedWeapon(player.weapon)) {
            playSound("shoot");
          }
          spawnParticleBurst(
            state,
            player.x + (player.facing === 1 ? 40 : 0),
            player.y + 28,
            5,
            "#ffe085"
          );
        }

        state.spawnTimer -= dt;
        state.coinTimer -= dt;
        state.chestTimer -= dt;

        const spawnDelay = Math.max(1.45 - state.level * 0.08, 0.45);
        if (!state.bossActive && state.spawnTimer <= 0) {
          spawnEnemy(state);
          if (state.level >= 4 && Math.random() < 0.24) {
            spawnEnemy(state);
          }
          state.spawnTimer = spawnDelay + Math.random() * 0.4;
        }

        if (state.coinTimer <= 0) {
          state.coins.push({
            id: state.nextCoinId++,
            x: 100 + Math.random() * 740,
            y: FLOOR_Y - 12,
            value: 1,
            bob: Math.random() * Math.PI * 2,
            kind: "silver"
          });
          state.coinTimer = Math.max(4 - state.level * 0.14, 1.4);
        }

        if (state.chestTimer <= 0 && state.chests.length === 0) {
          state.chests.push({
            id: state.nextChestId++,
            x: 160 + Math.random() * 620,
            y: FLOOR_Y - 30,
            hitsLeft: 10,
            progress: 0,
            hitByAttack: 0
          });
          state.chestTimer = CHEST_MIN_DELAY + Math.random() * CHEST_RANDOM_DELAY;
        }

        const hybridMeleeAttack = player.weapon === "lightsaber_gun" && player.attackStyle === "hybrid_melee";
        const slashBox =
          player.attackTimer > 0 && (isMeleeWeapon(player.weapon) || hybridMeleeAttack)
            ? {
                x: player.facing === 1 ? player.x + player.w - 4 : player.x - weaponRange(player.weapon) + 4,
                y: player.y + (player.weapon === "double_lightsaber" ? 8 : hybridMeleeAttack ? 10 : 12),
                w: hybridMeleeAttack ? 56 : weaponRange(player.weapon),
                h: player.weapon === "double_lightsaber" ? 44 : 34
              }
            : null;
        const blasterBox =
          player.attackTimer > 0 && isRangedWeapon(player.weapon) && !hybridMeleeAttack
            ? {
                x: player.facing === 1
                  ? player.x + player.w
                  : player.x - weaponRange(player.weapon),
                y: player.y + 14,
                w: weaponRange(player.weapon),
                h: player.weapon === "heavy_blaster" ? 24 : player.weapon === "ion_blaster" ? 28 : 18
              }
            : null;

        for (const enemy of state.enemies) {
          enemy.attackTimer = Math.max(0, enemy.attackTimer - dt);
          enemy.attackWindup = Math.max(0, enemy.attackWindup - dt);
          enemy.slowTimer = Math.max(0, (enemy.slowTimer ?? 0) - dt);
          enemy.facing = enemy.x > player.x ? -1 : 1;
          enemy.rolling = false;
          if (enemy.kind === "sith") {
            enemy.summonTimer = Math.max(0, (enemy.summonTimer ?? 0) - dt);
            if (enemy.summonTimer === 0) {
              summonBossDroids(state);
              enemy.summonTimer = 6 + Math.random() * 4;
              spawnParticleBurst(state, enemy.x + enemy.w / 2, enemy.y + 24, 18, "#ff5c93");
            }
          }
          const speedMultiplier = (enemy.slowTimer ?? 0) > 0 ? 0.45 : 1;

          const focusX =
            state.allies.length > 0 && Math.random() < 0.45
              ? state.allies[0].x
              : player.x;
          const distanceX = focusX - enemy.x;
          const absDistanceX = Math.abs(distanceX);

          if (enemy.attackWindup === 0 && enemy.attackTimer === 0) {
            if (absDistanceX > enemy.attackRange) {
              enemy.x += Math.sign(distanceX) * enemy.speed * speedMultiplier * dt;
              if (enemy.kind === "droideka") {
                enemy.rolling = true;
              }
            } else {
              enemy.attackWindup = enemy.kind === "brute" || enemy.kind === "sith" ? 0.42 : 0.25;
              enemy.attackTimer = enemy.attackCooldown;
            }
          } else if (enemy.attackWindup > 0 && enemy.kind === "brute") {
            enemy.x += Math.sign(distanceX) * enemy.speed * speedMultiplier * 0.22 * dt;
          }

          const strikeWindow = enemy.attackWindup > 0 && enemy.attackWindup < 0.11;
          if (strikeWindow && player.invuln === 0) {
            const attackBox = {
              x: enemy.x + (enemy.facing === 1 ? enemy.w - 8 : -16),
              y: enemy.y + 10,
              w: 24,
              h: enemy.h - 22
            };

            if (intersects(attackBox, player)) {
              const attackFromFront =
                ((enemy.x + enemy.w / 2) - (player.x + player.w / 2)) * player.facing > 0;
              const incomingDamage = characterDamageTaken(enemy.damage, selectedCharacter);
              const activeShieldBlocks = Math.max(
                player.shieldBlocks,
                player.shieldBubbleTimer > 0
                  ? Math.min(MAX_SHIELD_LEVEL, player.shieldBubbleLevel)
                  : 0
              );
              const shielded =
                activeShieldBlocks > 0 &&
                attackFromFront &&
                (player.hitsTaken + 1) % 2 === 0;
              player.hitsTaken += 1;
              if (shielded) {
                player.health -= reduceDamageByShield(incomingDamage, activeShieldBlocks);
                playSound("block");
                spawnParticleBurst(
                  state,
                  player.x + player.w / 2,
                  player.y + 20,
                  8,
                  "#a7d8ff"
                );
              } else {
                player.health -= incomingDamage;
                playSound("hit");
              }
              player.invuln = 0.75;
              player.x += enemy.facing * 28;
              spawnParticleBurst(
                state,
                player.x + player.w / 2,
                player.y + 20,
                8,
                shielded ? "#d8e3ff" : "#ff8b6e"
              );
            } else {
              for (const ally of state.allies) {
                if (intersects(attackBox, ally)) {
                  const attackFromFront =
                    ((enemy.x + enemy.w / 2) - (ally.x + ally.w / 2)) * ally.facing > 0;
                  const allyBubbleShieldActive = troopBubbleShieldActive(state, ally);
                  const activeTroopShieldBlocks = Math.max(
                    state.player.troopShieldBlocks,
                    ally.guarding ? 1 : 0,
                    allyBubbleShieldActive
                      ? Math.min(MAX_SHIELD_LEVEL, state.player.shieldBubbleLevel)
                      : 0
                  );
                  const closestEnemy = state.enemies
                    .slice()
                    .sort((a, b) => Math.abs(a.x - ally.x) - Math.abs(b.x - ally.x))[0];
                  const regularShieldCanBlock =
                    ally.guardTargetId === enemy.id && closestEnemy?.id === enemy.id && attackFromFront;
                  const blocked =
                    activeTroopShieldBlocks > 0 &&
                    (allyBubbleShieldActive || regularShieldCanBlock) &&
                    ((ally.hitsTaken ?? 0) + 1) % 2 === 0;
                  ally.hitsTaken = (ally.hitsTaken ?? 0) + 1;
                  if (blocked) {
                    ally.health -= reduceDamageByShield(enemy.damage, activeTroopShieldBlocks);
                    playSound("block");
                    spawnParticleBurst(
                      state,
                      ally.x + ally.w / 2,
                      ally.y + 16,
                      5,
                      "#d8e3ff"
                    );
                    break;
                  }
                  ally.health -= enemy.damage;
                  playSound("hit");
                  spawnParticleBurst(
                    state,
                    ally.x + ally.w / 2,
                    ally.y + 16,
                    5,
                    "#ff9c85"
                  );
                  break;
                }
              }
            }
          }
        }

        if ((slashBox || blasterBox) && player.attackHits < 1 + player.multiStrike) {
          const playerCenterX = player.x + player.w / 2;
          const playerCenterY = player.y + player.h / 2;
          const maxTargets = 1 + player.multiStrike;
          const attackTargets = state.enemies
            .filter(
              (enemy) =>
                enemy.hitByAttack !== player.attackId &&
                ((slashBox && intersects(slashBox, enemy)) ||
                  (blasterBox && intersects(blasterBox, enemy)))
            )
            .sort((a, b) => {
              const distanceA = Math.hypot(
                a.x + a.w / 2 - playerCenterX,
                a.y + a.h / 2 - playerCenterY
              );
              const distanceB = Math.hypot(
                b.x + b.w / 2 - playerCenterX,
                b.y + b.h / 2 - playerCenterY
              );
              return distanceA - distanceB;
            })
            .slice(0, maxTargets - player.attackHits);

          for (const enemy of attackTargets) {
            enemy.hitByAttack = player.attackId;
            player.attackHits += 1;
            const baseDamage =
              player.weapon === "double_lightsaber"
                ? player.comboStep === 3 ? 6.25 : 5.25
                : player.weapon === "lightsaber_gun"
                  ? player.attackStyle === "hybrid_melee" ? 4.75 : 3.25
                : player.weapon === "heavy_blaster"
                  ? 3.5
                  : player.weapon === "ion_blaster"
                    ? 2.5
                : player.weapon === "blaster"
                  ? 1.5
                  : player.comboStep === 3 ? 5 : 4.25;
            const damage = baseDamage + player.bonusDamage;
            const damaged = damageEnemy(
              state,
              enemy,
              damage,
              enemy.x + enemy.w / 2,
              enemy.y + enemy.h / 3,
              isMeleeWeapon(player.weapon) || hybridMeleeAttack ? "melee" : "ranged"
            );
            if (damaged) {
              const weaponKnockback =
                player.weapon === "ion_blaster"
                  ? 22
                  : player.weapon === "lightsaber_gun"
                    ? player.attackStyle === "hybrid_melee" ? 16 : 12
                  : player.weapon === "heavy_blaster" ? 18 : player.weapon === "blaster" ? 8 : player.comboStep * 8;
              enemy.x += player.facing * (enemy.knockback + weaponKnockback);
            }
            spawnParticleBurst(
              state,
              enemy.x + enemy.w / 2,
              enemy.y + enemy.h / 3,
              player.weapon === "ion_blaster"
                ? 12
                : player.weapon === "heavy_blaster" ? 10 : player.weapon === "blaster" ? 5 : 7,
              player.weapon === "heavy_blaster"
                ? "#ffb056"
                : player.weapon === "ion_blaster"
                  ? "#6effec"
                  : player.weapon === "lightsaber_gun"
                    ? player.attackStyle === "hybrid_melee" ? "#8fe6ff" : "#8bd3ff"
                  : player.weapon === "double_lightsaber"
                    ? "#b47cff"
                : player.weapon === "blaster"
                  ? "#8bd3ff"
                  : player.comboStep === 3 ? "#fff6b8" : "#ffbf75"
            );
          }
        }

        for (const ally of state.allies) {
          ally.attackTimer = Math.max(0, ally.attackTimer - dt);
          ally.attackWindup = Math.max(0, ally.attackWindup - dt);
          ally.specialCooldown = Math.max(0, (ally.specialCooldown ?? 0) - dt);

          const targetPool =
            ally.kind === "archer" ||
            ally.kind === "sniper" ||
            ally.kind === "clone_commander" ||
            ally.kind === "medic_clone"
              ? state.enemies.filter(canRangedTarget)
              : state.enemies;
          let target =
            targetPool.find((enemy) => enemy.id === ally.targetId) ??
            targetPool
              .slice()
              .sort((a, b) => strongestEnemySort(a, b) || Math.abs(a.x - ally.x) - Math.abs(b.x - ally.x))[0];

          ally.targetId = target?.id ?? null;

          if (isSpecialHeroTroop(ally.kind) && useSpecialTroopAbility(state, ally, target ?? null)) {
            continue;
          }

          if (!target) {
            const followX = clamp(state.player.x - 60 + ally.id * 18, 60, WIDTH - 120);
            if (Math.abs(followX - ally.x) > 6) {
              ally.x += Math.sign(followX - ally.x) * ally.speed * dt;
            }
            continue;
          }

          const distanceX = target.x - ally.x;
          const absDistanceX = Math.abs(distanceX);
          if (!ally.guarding) {
            ally.facing = distanceX >= 0 ? 1 : -1;
          }
          const canGuard = ally.kind === "shieldsman" || Boolean(ally.shieldPattern);
          const incomingEnemy = state.enemies
            .filter((enemy) => {
              const enemyFacingAlly = enemy.x < ally.x ? 1 : -1;
              const enemyDistance = Math.abs(enemy.x - ally.x);
              return (
                enemy.attackWindup > 0 &&
                enemy.facing === enemyFacingAlly &&
                enemyDistance <= enemy.attackRange + 32 &&
                Math.abs(enemy.y - ally.y) < 70
              );
            })
            .sort((a, b) => Math.abs(a.x - ally.x) - Math.abs(b.x - ally.x))[0];
          const shouldGuard =
            canGuard &&
            ally.attackWindup === 0 &&
            Boolean(incomingEnemy);

          if (shouldGuard) {
            const guardTarget = ally.guardTargetId
              ? state.enemies.find((enemy) => enemy.id === ally.guardTargetId) ?? incomingEnemy
              : incomingEnemy;
            ally.guarding = true;
            ally.guardTargetId = guardTarget?.id ?? null;
            if (guardTarget) {
              ally.facing = guardTarget.x >= ally.x ? 1 : -1;
            }
            continue;
          }
          ally.guarding = false;
          ally.guardTargetId = null;

          if (ally.attackWindup === 0 && ally.attackTimer === 0) {
            if (absDistanceX > ally.attackRange) {
              ally.x += Math.sign(distanceX) * ally.speed * dt;
            } else {
              ally.attackWindup =
                ally.kind === "archer" ||
                ally.kind === "sniper" ||
                ally.kind === "clone_commander" ||
                ally.kind === "medic_clone"
                  ? 0.28
                  : 0.18;
              ally.attackTimer = ally.attackCooldown;
            }
          }

          if (ally.attackWindup > 0 && ally.attackWindup < 0.08) {
            if (
              ally.kind === "archer" ||
              ally.kind === "sniper" ||
              ally.kind === "clone_commander" ||
              ally.kind === "medic_clone"
            ) {
              ally.weaponMode =
                ally.kind === "clone_commander" || ally.kind === "medic_clone"
                  ? Math.abs(target.x - ally.x) > 130
                    ? "blaster"
                    : "dual"
                  : ally.weaponMode;
              playSound("shoot");
              damageEnemy(
                state,
                target,
                ally.kind === "clone_commander"
                  ? ally.weaponMode === "blaster"
                    ? ally.damage + 1
                    : ally.damage
                  : ally.damage,
                target.x + target.w / 2,
                target.y + 12,
                "ranged"
              );
              spawnParticleBurst(
                state,
                target.x + target.w / 2,
                target.y + 12,
                ally.kind === "sniper" ? 7 : 4,
                ally.kind === "medic_clone"
                  ? "#79f2a6"
                  : ally.kind === "clone_commander"
                    ? "#8bd3ff"
                    : ally.kind === "sniper"
                      ? "#d7e8ff"
                      : "#5ab4ff"
              );
            } else if (
              absDistanceX <= ally.attackRange + 8 &&
              Math.abs(target.y - ally.y) < 60
            ) {
              const damaged = damageEnemy(
                state,
                target,
                ally.damage,
                target.x + target.w / 2,
                target.y + target.h / 2,
                "melee"
              );
              if (damaged) {
                target.x += 12;
              }
              spawnParticleBurst(
                state,
                target.x + target.w / 2,
                target.y + target.h / 2,
                4,
                "#9dd2ff"
              );
            }

            ally.attackWindup = 0;
          }
        }

        state.projectiles = state.projectiles.filter((projectile) => {
          projectile.x += projectile.vx * dt;
          projectile.life -= dt;
          let hitEnemy = false;
          let hitChest = false;
          for (const chest of state.chests) {
            const chestBox = { x: chest.x - 14, y: chest.y - 16, w: 28, h: 28 };
            if (!projectile.chestHitIds.includes(chest.id) && intersects(projectile, chestBox)) {
              projectile.chestHitIds.push(chest.id);
              hitChest = true;
              chest.progress += 5;
              chest.hitsLeft = Math.max(0, 10 - chest.progress);
              spawnParticleBurst(state, chest.x, chest.y, 6, "#ff9b3d");
              break;
            }
          }
          for (const enemy of state.enemies) {
            if (
              !hitChest &&
              !hitEnemy &&
              !projectile.hitIds.includes(enemy.id) &&
              intersects(projectile, enemy)
            ) {
              projectile.hitIds.push(enemy.id);
              hitEnemy = true;
              damageEnemy(
                state,
                enemy,
                projectile.damage,
                enemy.x + enemy.w / 2,
                enemy.y + enemy.h / 2,
                "ranged"
              );
              spawnParticleBurst(state, enemy.x + enemy.w / 2, enemy.y + 24, 8, "#ff9b3d");
            }
          }
          const traveled = Math.abs(projectile.x - projectile.startX);
          return (
            !hitChest &&
            !hitEnemy &&
            projectile.life > 0 &&
            traveled <= projectile.maxDistance &&
            projectile.x > -80 &&
            projectile.x < WIDTH + 80
          );
        });

        state.chests = state.chests.filter((chest) => {
          if (chest.progress < 10) return true;
          state.chestsOpened += 1;
          showChestMath();
          spawnParticleBurst(state, chest.x, chest.y, 12, "#ffe282");
          state.chestTimer = CHEST_MIN_DELAY + Math.random() * CHEST_RANDOM_DELAY;
          return false;
        });

        state.spikeTraps = state.spikeTraps.filter((trap) => {
          trap.armTimer = Math.max(0, trap.armTimer - dt);
          const playerTouchedTrap = trap.armTimer === 0 && intersects(trap, player);
          let enemyTouchedTrap = false;
          for (const enemy of state.enemies) {
            if (!enemyTouchedTrap && !trap.hitIds.includes(enemy.id) && intersects(trap, enemy)) {
              trap.hitIds.push(enemy.id);
              enemyTouchedTrap = true;
              damageEnemy(state, enemy, trap.damage, enemy.x + enemy.w / 2, FLOOR_Y - 12, "melee");
              enemy.slowTimer = Math.max(enemy.slowTimer ?? 0, 0.7);
              spawnParticleBurst(state, enemy.x + enemy.w / 2, FLOOR_Y - 12, 5, "#d7e0ef");
            }
          }
          if (playerTouchedTrap) {
            spawnParticleBurst(state, player.x + player.w / 2, FLOOR_Y - 12, 5, "#d7e0ef");
          }
          return !playerTouchedTrap && !enemyTouchedTrap;
        });

        state.turrets = state.turrets.filter((turret) => {
          turret.life -= dt;
          turret.cooldown = Math.max(0, turret.cooldown - dt);
          if (turret.cooldown === 0) {
            const target = state.enemies
              .filter(
                (enemy) =>
                  canRangedTarget(enemy) && Math.abs(enemy.x - turret.x) <= turret.range
              )
              .sort((a, b) => strongestEnemySort(a, b) || Math.abs(a.x - turret.x) - Math.abs(b.x - turret.x))[0];
            if (target) {
              turret.cooldown = 0.55;
              playSound("shoot");
              damageEnemy(state, target, turret.damage, target.x + target.w / 2, target.y + 20, "ranged");
              spawnParticleBurst(state, target.x + target.w / 2, target.y + 20, 4, "#b5e2ff");
            }
          }
          return turret.life > 0;
        });

        state.enemies = state.enemies.filter((enemy) => {
          if (enemy.health <= 0) {
            state.player.score += enemy.scoreValue + state.level * 2;
            state.player.kills += 1;
            spawnCoinDrop(
              state,
              enemy.x + enemy.w / 2,
              enemy.y + enemy.h - 8,
              enemy.kind === "sith" ? 18 : enemy.kind === "brute" ? 4 : 2
            );
            spawnParticleBurst(
              state,
              enemy.x + enemy.w / 2,
              enemy.y + enemy.h / 2,
              enemy.kind === "sith" ? 28 : enemy.kind === "brute" ? 12 : 8,
              "#ffcf7c"
            );
            return false;
          }

          return enemy.x > -80 && enemy.x < WIDTH + 80;
        });
        if (state.bossActive && state.enemies.length === 0) {
          state.bossActive = false;
          state.bossesDefeated += 1;
          state.elapsed = state.wave * LEVEL_DURATION;
          state.spawnTimer = 1.8;
          spawnParticleBurst(state, player.x + player.w / 2, player.y + 20, 20, "#ffe282");
        }

        state.allies = state.allies.filter((ally) => ally.health > 0);

        state.coins = state.coins.filter((coin) => {
          coin.bob += dt * 5;
          const dx = state.player.x + state.player.w / 2 - coin.x;
          const dy = state.player.y + 20 - coin.y;
          const distance = Math.hypot(dx, dy);
          const magnetBoost = state.player.coinMagnetTimer > 0 ? 460 : 0;
          const pull = Math.max(110 + magnetBoost, 260 + magnetBoost - distance);
          coin.x += (dx / Math.max(distance, 1)) * pull * dt;
          coin.y += (dy / Math.max(distance, 1)) * pull * dt;
          if (distance < 26) {
            state.player.silverCoins += coin.value + state.player.coinBonus;
            writeCurrentCoinBalance(state.player.silverCoins);
            state.player.score += 5;
            spawnParticleBurst(state, coin.x, coin.y, 4, "#ffe282");
            return false;
          }

          return true;
        });

        if (slashBox || blasterBox) {
          state.chests = state.chests.filter((chest) => {
            const chestBox = { x: chest.x - 14, y: chest.y - 16, w: 28, h: 28 };
            const lightsaberHit = Boolean(slashBox && intersects(slashBox, chestBox));
            const blasterHit = Boolean(blasterBox && intersects(blasterBox, chestBox));
            if (!lightsaberHit && !blasterHit) return true;
            if (chest.hitByAttack === player.attackId) return true;
            chest.hitByAttack = player.attackId;
            chest.progress += chestDamageForWeapon(player.weapon);
            chest.hitsLeft = Math.max(0, 10 - chest.progress);
            spawnParticleBurst(state, chest.x, chest.y, 5, "#f5d98a");
            if (chest.progress >= 10) {
              showChestMath();
              state.chestTimer = CHEST_MIN_DELAY + Math.random() * CHEST_RANDOM_DELAY;
              return false;
            }
            return true;
          });
        }

        state.particles = state.particles.filter((particle) => {
          particle.life -= dt;
          particle.x += particle.vx * dt;
          particle.y += particle.vy * dt;
          particle.vy += 220 * dt;
          return particle.life > 0;
        });

        if (player.health <= 0) {
          finishRunRewards();
          setScreen("gameover");
          setPaused(false);
          resetTransientInput(keysRef.current);
        }

        hudTimer += dt;
        if (hudTimer >= 0.1) {
          hudTimer = 0;
          setHud(makeHud(state));
        }
      }

      drawBackground(ctx, state.elapsed, state.enemies.length);

      for (const coin of state.coins) {
        const bobOffset = Math.sin(coin.bob) * 3;
        ctx.fillStyle = coin.kind === "gold" ? "#7a5b14" : "#5f6772";
        ctx.fillRect(Math.round(coin.x) - 8, Math.round(coin.y + bobOffset), 16, 16);
        ctx.fillStyle = coin.kind === "gold" ? "#f7b733" : "#d3d9e7";
        ctx.fillRect(Math.round(coin.x) - 6, Math.round(coin.y + bobOffset) + 2, 12, 12);
        ctx.fillStyle = coin.kind === "gold" ? "#ffe38b" : "#f9fdff";
        ctx.fillRect(Math.round(coin.x) - 1, Math.round(coin.y + bobOffset) + 4, 2, 8);
      }

      for (const chest of state.chests) {
        ctx.fillStyle = "#704a20";
        ctx.fillRect(Math.round(chest.x) - 16, Math.round(chest.y) - 14, 32, 24);
        ctx.fillStyle = "#e2b76a";
        ctx.fillRect(Math.round(chest.x) - 14, Math.round(chest.y) - 10, 28, 8);
        ctx.fillStyle = "#2d1c10";
        ctx.fillRect(Math.round(chest.x) - 2, Math.round(chest.y) - 14, 4, 24);

        const panelX = Math.round(clamp(chest.x + 28, 20, WIDTH - 260));
        const panelY = Math.round(clamp(chest.y - 132, 140, FLOOR_Y - 146));
        const weaponHitsLeft = chestHitsLeftForWeapon(chest, state.player.weapon);
        const abilityChestGroups: AbilityKind[][] = [
          ["fireball", "spike_trap", "dash_strike", "heal_pulse"],
          ["freeze_blast", "turret_droid", "shield_bubble", "coin_magnet"]
        ];
        const abilityChestLines = abilityChestGroups.map((line) =>
          line
            .map((ability) => {
              const unlocked =
                abilityLevel(state.player, ability) > 0 || discoveredAbilities.includes(ability);
              return `${abilityLabel(ability)} ${unlocked ? "Unlocked" : "Not unlocked"}`;
            })
            .join(" | ")
        );
        ctx.fillStyle = "rgba(17, 24, 39, 0.88)";
        ctx.fillRect(panelX, panelY, 238, 126);
        ctx.strokeStyle = "#e2b76a";
        ctx.lineWidth = 3;
        ctx.strokeRect(panelX, panelY, 238, 126);
        ctx.fillStyle = "#fff1c1";
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillText("CHEST", panelX + 12, panelY + 22);
        ctx.fillStyle = "#f4f7fb";
        ctx.font = '13px "Courier New", monospace';
        ctx.fillText(`${weaponLabel(state.player.weapon)}: ${weaponHitsLeft} hit${weaponHitsLeft === 1 ? "" : "s"} left`, panelX + 12, panelY + 42);
        const chestRuleLineOne = [
          isWeaponUnlocked(state.player, "lightsaber") ? "Saber 2" : null,
          isWeaponUnlocked(state.player, "double_lightsaber") ? "Double 1" : null,
          isWeaponUnlocked(state.player, "blaster") ? "Blaster 10" : null
        ]
          .filter((rule): rule is string => Boolean(rule))
          .join(" | ");
        const chestRuleLineTwo = [
          isWeaponUnlocked(state.player, "heavy_blaster") ? "Heavy 5" : null,
          isWeaponUnlocked(state.player, "ion_blaster") ? "Ion 5" : null,
          isWeaponUnlocked(state.player, "lightsaber_gun") ? "LS Gun 5" : null,
          state.player.fireballLevel > 0 ? "Fireball 2" : null
        ]
          .filter((rule): rule is string => Boolean(rule))
          .join(" | ");
        if (chestRuleLineOne) {
          ctx.fillText(chestRuleLineOne, panelX + 12, panelY + 60);
        }
        if (chestRuleLineTwo) {
          ctx.fillText(chestRuleLineTwo, panelX + 12, panelY + 78);
        }
        ctx.fillStyle = "#fff1c1";
        ctx.fillText("Abilities", panelX + 12, panelY + 96);
        ctx.fillStyle = "#f4f7fb";
        ctx.fillText(abilityChestLines[0], panelX + 12, panelY + 112);
        ctx.fillText(abilityChestLines[1], panelX + 12, panelY + 128);
      }

      for (const trap of state.spikeTraps) {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(Math.round(trap.x - trap.w / 2), Math.round(trap.y), trap.w, 8);
        ctx.fillStyle = "#d7e0ef";
        for (let spikeX = trap.x - trap.w / 2 + 6; spikeX < trap.x + trap.w / 2; spikeX += 12) {
          ctx.fillRect(Math.round(spikeX), Math.round(trap.y - 8), 6, 14);
        }
      }

      for (const turret of state.turrets) {
        ctx.fillStyle = "#23324c";
        ctx.fillRect(Math.round(turret.x - 12), Math.round(turret.y), 24, 26);
        ctx.fillStyle = "#8bd3ff";
        ctx.fillRect(Math.round(turret.x - 5), Math.round(turret.y - 8), 10, 10);
        ctx.fillStyle = "#dff7ff";
        ctx.fillRect(Math.round(turret.x + 10), Math.round(turret.y + 8), 14, 4);
      }

      for (const projectile of state.projectiles) {
        ctx.fillStyle = "#8f2f1c";
        ctx.fillRect(Math.round(projectile.x), Math.round(projectile.y), projectile.w, projectile.h);
        ctx.fillStyle = "#ffb347";
        ctx.fillRect(Math.round(projectile.x + 4), Math.round(projectile.y + 3), projectile.w - 8, projectile.h - 6);
      }

      if (screen === "playing" && showAttackRange) {
        drawPlayerAttackRange(ctx, state.player);
      }

      for (const ally of state.allies) {
        drawAlly(ctx, ally, troopBubbleShieldActive(state, ally), showTroopNames);
      }

      for (const enemy of state.enemies) {
        drawEnemy(ctx, enemy);
      }

      drawPixelKnight(ctx, state.player, state.player.invuln > 0, selectedCharacter);

      for (const particle of state.particles) {
        ctx.globalAlpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color;
        ctx.fillRect(
          Math.round(particle.x),
          Math.round(particle.y),
          Math.round(particle.size),
          Math.round(particle.size)
        );
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#111827";
      ctx.fillRect(18, 18, 360, 150);
      ctx.strokeStyle = "#6f86bb";
      ctx.lineWidth = 4;
      ctx.strokeRect(18, 18, 360, 150);

      ctx.fillStyle = "#f4f7fb";
      ctx.font = '18px "Courier New", monospace';
      const bonusHearts = Math.max(0, state.player.health - state.player.maxHealth);
      ctx.fillText(
        `HP ${Math.min(state.player.health, state.player.maxHealth).toFixed(state.player.health % 1 === 0 ? 0 : 1)}/${state.player.maxHealth}${bonusHearts > 0 ? ` +${bonusHearts.toFixed(bonusHearts % 1 === 0 ? 0 : 1)}` : ""}`,
        34,
        36
      );
      drawHealthHeartsWithPulse(ctx, state.player.health, state.player.maxHealth, state.elapsed, heartbeatOn);
      ctx.fillText(`Level ${state.level}`, 240, 44);
      ctx.fillText(`Wave ${waveWithinLevel(state.wave)}/${WAVES_PER_LEVEL}`, 240, 68);
      ctx.fillText(`Allies ${state.allies.length}`, 240, 92);
      if (state.bossActive) {
        ctx.fillStyle = "#ff9bb7";
        ctx.fillText(`Sith Boss Wave ${state.wave}`, 190, 120);
      }
      ctx.fillText(`Score ${state.player.score}`, 34, 120);
      ctx.fillText(`Gold ${toGoldSilver(state.player.silverCoins).gold}`, 34, 144);
      ctx.fillText(`Silver ${toGoldSilver(state.player.silverCoins).silver}  Cores ${permanentCores}`, 166, 144);

      if (screen === "menu") {
        ctx.fillStyle = "rgba(8, 11, 19, 0.75)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = "#fff1c1";
        ctx.font = 'bold 42px "Courier New", monospace';
        ctx.fillText("BATTLE DROIDS", WIDTH / 2 - 190, HEIGHT / 2 - 64);
        ctx.font = '18px "Courier New", monospace';
        ctx.fillText("Create your hero below to start the run", WIDTH / 2 - 182, HEIGHT / 2 - 28);
      }

      if (paused) {
        ctx.fillStyle = "rgba(8, 11, 19, 0.56)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = "#fff1c1";
        ctx.font = 'bold 40px "Courier New", monospace';
        ctx.fillText(
          levelReady ? `LEVEL ${state.level} READY` : "PAUSED",
          levelReady ? WIDTH / 2 - 176 : WIDTH / 2 - 88,
          HEIGHT / 2 - 16
        );
        ctx.font = '18px "Courier New", monospace';
        ctx.fillText(
          levelReady
            ? `Wave ${waveWithinLevel(state.wave)}/${WAVES_PER_LEVEL} starts after you press Play`
            : "Press play or tap P to return to battle",
          levelReady ? WIDTH / 2 - 214 : WIDTH / 2 - 186,
          HEIGHT / 2 + 20
        );
        if (levelReady) {
          ctx.fillText("Buy troops, food, and shields before the fight", WIDTH / 2 - 224, HEIGHT / 2 + 48);
        }
      }

      if (screen === "gameover") {
        ctx.fillStyle = "rgba(8, 11, 19, 0.72)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = "#fff1c1";
        ctx.font = 'bold 44px "Courier New", monospace';
        ctx.fillText("GAME OVER", WIDTH / 2 - 145, HEIGHT / 2 - 28);
        ctx.font = '20px "Courier New", monospace';
        ctx.fillText(
          `Final Score ${state.player.score}   Level ${state.level}   Wave ${waveWithinLevel(state.wave)}/${WAVES_PER_LEVEL}`,
          WIDTH / 2 - 250,
          HEIGHT / 2 + 12
        );
        ctx.fillText(
          `Earned ${rewardCoresForScore(state.player.score)} cores for permanent upgrades`,
          WIDTH / 2 - 260,
          HEIGHT / 2 + 42
        );
        ctx.fillText("Press R or the restart button to battle again", WIDTH / 2 - 238, HEIGHT / 2 + 72);
      }

      if (abilityChoices) {
        ctx.fillStyle = "rgba(8, 11, 19, 0.82)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = "#fff1c1";
        ctx.font = 'bold 34px "Courier New", monospace';
        ctx.fillText("Choose 1 Upgrade Below", WIDTH / 2 - 198, HEIGHT / 2 - 24);
      }

      animationFrame = window.requestAnimationFrame(loop);
    };

    animationFrame = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [
    abilityChoices,
    heartbeatOn,
    highScore.score,
    levelReady,
    mathChallenge,
    paused,
    permanentCores,
    playerName,
    rareWeaponChoices,
    rareWeaponReward,
    screen,
    showAttackRange,
    showTroopNames,
    soundEffectsOn
  ]);

  const selectedTroop =
    stateRef.current.allies.length > 0
      ? stateRef.current.allies[Math.min(selectedTroopIndex, stateRef.current.allies.length - 1)]
      : null;

  const cycleSelectedTroop = (direction: -1 | 1) => {
    setSelectedTroopIndex((current) => {
      const troopCount = stateRef.current.allies.length;
      if (troopCount === 0) return 0;
      return (current + direction + troopCount) % troopCount;
    });
  };

  const loadRunSave = (slot: number) => {
    const save = runSaves.find((entry) => entry.slot === slot);
    if (!save) return;
    stateRef.current = cloneGameState(save.state);
    rewardedScoreRef.current = null;
    attackQueuedRef.current = false;
    resetTransientInput(keysRef.current);
    setScreen("playing");
    setPaused(true);
    setLevelReady(false);
    setAbilityChoices(null);
    setRareWeaponReward(null);
    setRareWeaponChoices(null);
    setMathChallenge(null);
    setMathAnswer("");
    setMathError("");
    setRunSavesOpen(false);
    setCurrentRunSaveSlot(slot);
    setHud(makeHud(stateRef.current));
    setRunSaveMessage(`Loaded ${save.label}.`);
  };

  const deleteRunSave = (slot: number) => {
    const nextSaves = runSaves.filter((entry) => entry.slot !== slot);
    writeRunSavesForUser(nextSaves);
    setSlotDraftNames((current) => {
      const next = { ...current };
      delete next[slot];
      return next;
    });
    if (currentRunSaveSlot === slot) {
      setCurrentRunSaveSlot(null);
    }
    setRunSaveMessage(`Deleted slot ${slot + 1}.`);
  };

  const isTroopUnlocked = (kind: UnlockableTroopKind) => unlockedTroops.includes(kind);

  const unlockTroopType = (kind: UnlockableTroopKind) => {
    const state = stateRef.current;
    const cost = TROOP_UNLOCK_COSTS[kind];
    if (isTroopUnlocked(kind) || state.player.silverCoins < cost) return;
    const nextTroops = Array.from(new Set<UnlockableTroopKind>([...unlockedTroops, kind]));
    state.player.silverCoins -= cost;
    writeCurrentCoinBalance(state.player.silverCoins);
    setUnlockedTroops(nextTroops);
    writeUnlockedTroops(playerName || "Pilot", nextTroops);
    setHud(makeHud(state));
  };

  const openTroopUpgradeFromDex = (kind: AllyKind) => {
    const troopIndex = stateRef.current.allies.findIndex((ally) => ally.kind === kind);
    if (troopIndex < 0) return;
    setSelectedTroopIndex(troopIndex);
    setTroopUpgradeOpen(true);
    setShopDrawerOpen(true);
    setBattleDexOpen(false);
  };

  const buyTroop = (kind: UnlockableTroopKind, cost: number) => {
    const state = stateRef.current;
    if (screen !== "playing" || !isTroopUnlocked(kind) || state.player.silverCoins < cost) {
      return;
    }

    state.player.silverCoins -= cost;
    writeCurrentCoinBalance(state.player.silverCoins);
    addAlly(state, kind);
    setSelectedTroopIndex(state.allies.length - 1);
    setHud(makeHud(state));
  };

  const buySpecialTroop = (kind: "clone_commander" | "medic_clone", cost: number) => {
    const state = stateRef.current;
    if (screen !== "playing" || state.player.silverCoins < cost) return;
    if (state.allies.some((ally) => ally.kind === kind)) return;

    state.player.silverCoins -= cost;
    writeCurrentCoinBalance(state.player.silverCoins);
    addAlly(state, kind);
    setSelectedTroopIndex(state.allies.length - 1);
    setHud(makeHud(state));
  };

  const upgradeTroop = (upgrade: "health" | "range" | "speed") => {
    const state = stateRef.current;
    const ally = state.allies[Math.min(selectedTroopIndex, state.allies.length - 1)];
    if (!ally) return;
    if (isTroopUpgradeMaxed(ally, upgrade)) return;
    const cost = upgradeCost(ally, upgrade);
    if (screen !== "playing" || state.player.silverCoins < cost) return;

    state.player.silverCoins -= cost;
    writeCurrentCoinBalance(state.player.silverCoins);
    if (upgrade === "health") {
      ally.healthLevel += 1;
      const healthGain = Math.min(2, TROOP_MAX_HP - ally.maxHealth);
      ally.maxHealth += healthGain;
      ally.health = Math.min(ally.maxHealth, ally.health + 2);
    } else if (upgrade === "range") {
      const nextRangeLevel = nextRangeUpgradeLevel(ally.rangeLevel);
      const rangeGain = nextRangeLevel - ally.rangeLevel;
      ally.rangeLevel = nextRangeLevel;
      ally.attackRange += (ally.kind === "sniper" ? 36 : ally.kind === "archer" ? 24 : 10) * rangeGain;
    } else {
      ally.speedLevel += 1;
      ally.attackCooldown = Math.max(0.35, ally.attackCooldown - 0.1);
    }
    setHud(makeHud(state));
  };

  const buyFood = () => {
    const state = stateRef.current;
    if (
      screen !== "playing" ||
      state.player.health >= MAX_HEARTS ||
      state.player.health >= maxFoodHealth(state.player) ||
      state.player.silverCoins < SHOP_COSTS.food
    ) return;
    state.player.silverCoins -= SHOP_COSTS.food;
    writeCurrentCoinBalance(state.player.silverCoins);
    state.player.health = Math.min(maxFoodHealth(state.player), state.player.health + 1);
    setHud(makeHud(state));
  };

  const buyShield = () => {
    const state = stateRef.current;
    if (screen !== "playing" || !isTroopUnlocked("shieldsman") || state.player.silverCoins < SHOP_COSTS.shieldsman) return;
    state.player.silverCoins -= SHOP_COSTS.shieldsman;
    writeCurrentCoinBalance(state.player.silverCoins);
    addAlly(state, "shieldsman");
    setHud(makeHud(state));
  };

  const buyPlayerShield = () => {
    const state = stateRef.current;
    if (
      screen !== "playing" ||
      state.player.shieldBlocks >= MAX_SHIELD_LEVEL ||
      state.player.silverCoins < SHOP_COSTS.playerShield
    ) return;
    state.player.silverCoins -= SHOP_COSTS.playerShield;
    writeCurrentCoinBalance(state.player.silverCoins);
    state.player.shieldBlocks = Math.min(MAX_SHIELD_LEVEL, state.player.shieldBlocks + 1);
    setHud(makeHud(state));
  };

  const buyTroopShield = () => {
    const state = stateRef.current;
    if (
      screen !== "playing" ||
      state.player.troopShieldBlocks >= MAX_SHIELD_LEVEL ||
      state.player.silverCoins < SHOP_COSTS.troopShield
    ) return;
    state.player.silverCoins -= SHOP_COSTS.troopShield;
    writeCurrentCoinBalance(state.player.silverCoins);
    state.player.troopShieldBlocks = Math.min(
      MAX_SHIELD_LEVEL,
      state.player.troopShieldBlocks + 1
    );
    for (const ally of state.allies) {
      ally.shieldPattern = true;
      ally.hitsTaken = ally.hitsTaken ?? 0;
    }
    setHud(makeHud(state));
  };

  const buyPermanent = (item: keyof PermanentShop, cost: number) => {
    const state = stateRef.current;
    if ((screen !== "playing" && screen !== "menu") || permanentCores < cost) {
      return;
    }
    if (
      (item === "archer" && !isTroopUnlocked("archer")) ||
      (item === "shieldsman" && !isTroopUnlocked("shieldsman")) ||
      (item === "sniper" && !isTroopUnlocked("sniper"))
    ) {
      return;
    }
    if (
      (item === "shield" && permanentShop.shield >= MAX_SHIELD_LEVEL) ||
      (item === "troopShield" && permanentShop.troopShield >= MAX_SHIELD_LEVEL)
    ) {
      return;
    }

    const nextShop = {
      ...permanentShop,
      [item]:
        item === "shield" || item === "troopShield"
          ? Math.min(MAX_SHIELD_LEVEL, permanentShop[item] + 1)
          : permanentShop[item] + 1
    };

    if (screen === "playing") {
      if (item === "food") {
        state.player.health = Math.min(maxFoodHealth(state.player), state.player.health + 1);
      } else if (item === "squire") {
        addAlly(state, "squire");
      } else if (item === "archer") {
        addAlly(state, "archer");
      } else if (item === "shieldsman") {
        addAlly(state, "shieldsman");
      } else if (item === "sniper") {
        addAlly(state, "sniper");
      } else if (item === "shield") {
        state.player.shieldBlocks = Math.min(MAX_SHIELD_LEVEL, state.player.shieldBlocks + 1);
      } else if (item === "troopShield") {
        state.player.troopShieldBlocks = Math.min(
          MAX_SHIELD_LEVEL,
          state.player.troopShieldBlocks + 1
        );
        for (const ally of state.allies) {
          ally.shieldPattern = true;
          ally.hitsTaken = ally.hitsTaken ?? 0;
        }
      }
    }

    setPermanentShop(nextShop);
    writePermanentShop(playerName || "Pilot", nextShop);
    const nextCores = permanentCores - cost;
    setPermanentCores(nextCores);
    writePermanentCores(playerName || "Pilot", nextCores);
    setHud({ ...makeHud(state), cores: nextCores });
  };

  const unlockedAbilityControls = [
    stateRef.current.player.fireballLevel > 0 ? "Up: Fireball" : null,
    stateRef.current.player.spikeTrapLevel > 0 ? "Down: Spike Trap" : null,
    stateRef.current.player.dashStrikeLevel > 0 ? "Shift + Arrow: Dash Strike" : null,
    stateRef.current.player.healPulseLevel > 0 ? "H: Heal Pulse" : null,
    stateRef.current.player.freezeBlastLevel > 0 ? "F + Arrow: Freeze Blast" : null,
    stateRef.current.player.turretDroidLevel > 0 ? "T: Turret Droid" : null,
    stateRef.current.player.shieldBubbleLevel > 0 ? "Hold E: Shield Bubble" : null,
    stateRef.current.player.coinMagnetLevel > 0 ? "M: Coin Magnet" : null
  ].filter((control): control is string => Boolean(control));
  const heroLabel = selectedCharacter
    ? `${selectedCharacter} (${playerName || "Pilot"})`
    : playerName || "---";
  const pendingDailyRewards = dailyRewards.pendingCount;
  const nextDailyReward = DAILY_REWARD_TRACK[dailyRewards.totalClaims % DAILY_REWARD_TRACK.length];
  const silverChestUsesAvailable = dailyRewards.silverChestBuys;
  const goldChestUsesAvailable = dailyRewards.goldChestBuys;

  return (
    <main className="battlePage">
      <section className="battleShell">
        <div className="battleHeader">
          <div>
            <p className="kicker">Pixel Arena</p>
            <h1>Battle Droids</h1>
            <p className="intro">Created by Cluper2320</p>
            <p className="intro">
              Survive longer waves, hire help in the shop, and chase the top
              score with your own named hero.
            </p>
          </div>
          <div className="battleStats" aria-live="polite">
            <span>Score {hud.score}</span>
            <span>Level {hud.level}</span>
            <span>Wave {waveWithinLevel(hud.wave)}/{WAVES_PER_LEVEL}</span>
            <span>Enemies {hud.enemyCount}</span>
            <span>Rank {hud.waveLabel}</span>
            <span>Gems {gems}</span>
            <span>Cores {permanentCores}</span>
            <span>
              High Score {highScore.score} - {highScore.name} L{highScore.level} W{waveWithinLevel(highScore.wave)}/{WAVES_PER_LEVEL}
            </span>
          </div>
        </div>

        {screen === "menu" ? (
          <section className="menuPanel">
            {isSignedIn && authView === "character" ? (
              <>
                <p className="shopKicker">Choose Character</p>
                <h2>Pick Your Jedi</h2>
                <p>Select who this account will play as. You can choose before entering the main menu.</p>
                <div className="characterGrid">
                  {JEDI_CHARACTERS.map((character) => (
                    <button
                      key={character}
                      className="characterCard"
                      type="button"
                      onClick={() => {
                        const username = playerName.trim() || "Pilot";
                        setSelectedCharacter(character);
                        writeCharacter(username, character);
                        setAuthView("welcome");
                        setMenuView("main");
                      }}
                    >
                      <strong>{character}</strong>
                      <span>
                        {character === "Obi-Wan"
                          ? "Balanced defender"
                          : character === "Anakin"
                            ? "Aggressive attacker"
                            : "Strong duelist"}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {isSignedIn && authView !== "character" ? (
              <>
                <p className="shopKicker">Main Menu</p>
                <h2>Welcome, {heroLabel}</h2>
                <p>
                  Choose where to go next. Cores are permanent and can be spent
                  before or during a run.
                </p>
                <div className="authActions">
                  <button className="menuButton" type="button" onClick={restartRun}>
                    Play
                  </button>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => setMenuView("howToPlay")}
                  >
                    How to Play
                  </button>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => setMenuView("permanentShop")}
                  >
                    Permanent Shop
                  </button>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => setMenuView("highScore")}
                  >
                    High Score
                  </button>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => setMenuView("settings")}
                  >
                    Settings
                  </button>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={signOut}
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : null}

            {!isSignedIn && authView === "welcome" ? (
              <>
                <h2>Start Here</h2>
                <p>Choose how you want to enter the arena.</p>
                <div className="authActions">
                  <button
                    className="menuButton"
                    type="button"
                    onClick={() => {
                      setAuthError("");
                      setPassword("");
                      setAuthView("signin");
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    className="menuButton"
                    type="button"
                    onClick={() => {
                      setAuthError("");
                      setPassword("");
                      setAuthView("signup");
                    }}
                  >
                    Sign Up for Free
                  </button>
                </div>
              </>
            ) : null}

            {!isSignedIn && authView === "signin" ? (
              <>
                <h2>Sign In</h2>
                <p>Enter your saved username and password.</p>
                <label className="fieldLabel" htmlFor="heroName">
                  Username
                </label>
                <input
                  id="heroName"
                  className="textField"
                  value={playerName}
                  maxLength={18}
                  onChange={(event) => setPlayerName(event.target.value)}
                  placeholder="Username"
                />
                <label className="fieldLabel" htmlFor="heroPassword">
                  Password
                </label>
                <input
                  id="heroPassword"
                  className="textField"
                  type="password"
                  value={password}
                  maxLength={18}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                />
                {authError ? <p className="menuError">{authError}</p> : null}
                <div className="authActions">
                  <button
                    className="menuButton"
                    type="button"
                    onClick={() => {
                      const username = playerName.trim();
                      const pass = password.trim();
                      const users = readUsers();
                      const match = users.find(
                        (user) => user.username === username && user.password === pass
                      );

                      if (username.length < 2 || pass.length < 2) {
                        setAuthError("Username and password must both be at least 2 characters.");
                        return;
                      }

                      if (!match) {
                        setAuthError("That sign in was not found. Try again or sign up for free.");
                        return;
                      }

                      setAuthError("");
                      setMenuError("");
                      loadUserProgress(username);
                      setIsSignedIn(true);
                      setAuthView(readCharacter(username) ? "welcome" : "character");
                      setMenuView("main");
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => {
                      setAuthError("");
                      setAuthView("welcome");
                    }}
                  >
                    Back
                  </button>
                </div>
              </>
            ) : null}

            {!isSignedIn && authView === "signup" ? (
              <>
                <h2>Main Menu</h2>
                <p>Make a username and password, then start your battle.</p>
                <label className="fieldLabel" htmlFor="signupName">
                  Username
                </label>
                <input
                  id="signupName"
                  className="textField"
                  value={playerName}
                  maxLength={18}
                  onChange={(event) => setPlayerName(event.target.value)}
                  placeholder="Knight name"
                />
                <label className="fieldLabel" htmlFor="signupPassword">
                  Password
                </label>
                <input
                  id="signupPassword"
                  className="textField"
                  type="password"
                  value={password}
                  maxLength={18}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 2 characters"
                />
                {menuError ? <p className="menuError">{menuError}</p> : null}
                <div className="authActions">
                  <button
                    className="menuButton"
                    type="button"
                    onClick={() => {
                      const username = playerName.trim();
                      const pass = password.trim();
                      const users = readUsers();

                      if (username.length < 2 || pass.length < 2) {
                        setMenuError("Username and password must both be at least 2 characters.");
                        return;
                      }

                      if (users.some((user) => user.username === username)) {
                        setMenuError("That username already exists. Pick a different one.");
                        return;
                      }

                      writeUsers([...users, { username, password: pass }]);
                      setMenuError("");
                      setPermanentShop(makePermanentShop());
                      setPermanentCores(0);
                      writePermanentShop(username, makePermanentShop());
                      writePermanentCores(username, 0);
                      writeAccountCoins(username, 0);
                      writeGems(username, 0);
                      writeUnlockedTroops(username, ["squire"]);
                      writeUnlockedWeapons(username, []);
                      writeDiscoveredAbilities(username, []);
                      writeClaimedQuests(username, []);
                      writeDailyRewardsState(username, makeDailyRewardsState());
                      setSelectedCharacter("");
                      setUnlockedTroops(["squire"]);
                      setUnlockedRareWeapons([]);
                      setDiscoveredAbilities([]);
                      setGems(0);
                      setClaimedQuests([]);
                      setDailyRewards(makeDailyRewardsState());
                      stateRef.current.player.silverCoins = 0;
                      setHud({ ...makeHudState(stateRef.current), cores: 0 });
                      setIsSignedIn(true);
                      setAuthView("character");
                      setMenuView("main");
                    }}
                  >
                    Create Account
                  </button>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => {
                      setMenuError("");
                      setAuthView("welcome");
                    }}
                  >
                    Back
                  </button>
                </div>
              </>
            ) : null}
          </section>
        ) : null}

        <div className={`battleArenaRow ${screen === "playing" && shopDrawerOpen ? "shopOpen" : ""}`}>
        <div className="battleFrame">
          <canvas
            ref={canvasRef}
            className="battleCanvas"
            width={WIDTH}
            height={HEIGHT}
          />
          {isSignedIn ? (
            <>
              <button
                className="rewardsButton"
                type="button"
                onClick={() => {
                  syncCurrentDailyRewards();
                  setRewardsOpen(true);
                }}
              >
                Rewards
                {pendingDailyRewards > 0 ? (
                  <span className="buttonBadge">{pendingDailyRewards}</span>
                ) : null}
              </button>
              <button
                className="questsButton"
                type="button"
                onClick={() => setQuestsOpen(true)}
              >
                Quests
              </button>
              <button
                className="battleDexButton"
                type="button"
                onClick={() => setBattleDexOpen(true)}
              >
                Battle Dex
              </button>
              <button
                className="runSavesButton"
                type="button"
                onClick={() => setRunSavesOpen(true)}
              >
                Run Saves
              </button>
            </>
          ) : null}
          {questsOpen ? (
            <div className="arenaAbilityOverlay">
              <div className="arenaAbilityPanel battleDexPanel">
                <p className="shopKicker">Quests</p>
                <h2>Mission Board</h2>
                <p>Complete quests for rewards. Gems can be spent on gem chests in the shop.</p>
                {questMessage ? <p>{questMessage}</p> : null}
                <div className="arenaAbilityGrid">
                  {QUESTS.map((quest) => {
                    const completed = questComplete(quest.id);
                    const claimed = claimedQuests.includes(quest.id);
                    return (
                      <div key={quest.id} className="arenaAbilityCard dexInfoCard">
                        <strong>{quest.name}</strong>
                        <span>{quest.description}</span>
                        <span>Reward: {quest.rewardLabel}</span>
                        <button
                          className="shopButton dexBuyButton"
                          type="button"
                          disabled={!completed || claimed}
                          onClick={() => claimQuestReward(quest.id)}
                        >
                          {claimed ? "Claimed" : completed ? "Claim Reward" : "In Progress"}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="authActions battleDexActions">
                  <button className="secondaryButton" type="button" onClick={() => setQuestsOpen(false)}>
                    Close Quests
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          {rewardsOpen ? (
            <div className="arenaAbilityOverlay">
              <div className="arenaAbilityPanel">
                <p className="shopKicker">Daily Rewards</p>
                <h2>{pendingDailyRewards > 0 ? "Rewards Ready" : "No Reward Ready Yet"}</h2>
                <p>
                  {pendingDailyRewards > 0
                    ? `${pendingDailyRewards} daily reward${pendingDailyRewards === 1 ? "" : "s"} waiting. Rewards still stack after 12:00 AM even if you were signed out.`
                    : "Come back after 12:00 AM for the next daily reward. Rewards can only be claimed while signed in."}
                </p>
                <p>
                  Silver Chest and Gold Chest uses also stack after midnight in groups of {DAILY_CHEST_BUY_LIMIT}.
                </p>
                <div className="arenaAbilityGrid">
                  <div className="arenaAbilityCard dexInfoCard">
                    <strong>Next Reward</strong>
                    <span>{nextDailyReward.label}</span>
                    <span>Track Day {(dailyRewards.totalClaims % DAILY_REWARD_TRACK.length) + 1}</span>
                  </div>
                  <button
                    className="arenaAbilityCard"
                    type="button"
                    disabled={pendingDailyRewards <= 0}
                    onClick={claimDailyReward}
                  >
                    <strong>Claim Reward</strong>
                    <span>
                      {pendingDailyRewards > 0
                        ? `Claim ${nextDailyReward.label} now.`
                        : "Nothing to claim yet."}
                    </span>
                  </button>
                </div>
                <div className="authActions battleDexActions">
                  <button className="secondaryButton" type="button" onClick={() => setRewardsOpen(false)}>
                    Close Rewards
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          {runSavesOpen ? (
            <div className="arenaAbilityOverlay">
              <div className="arenaAbilityPanel battleDexPanel">
                <p className="shopKicker">Run Saves</p>
                <h2>Save Or Load A Run</h2>
                <p>
                  Save the run into 1 of 8 slots, name it, and load it later. If this run was already saved in a slot,
                  starting a new run will auto-update that same slot.
                </p>
                {runSaveMessage ? <p>{runSaveMessage}</p> : null}
                <div className="arenaAbilityGrid runSaveGrid">
                  {Array.from({ length: RUN_SAVE_SLOTS }, (_, slot) => {
                    const save = runSaves.find((entry) => entry.slot === slot) ?? null;
                    return (
                      <div key={slot} className="arenaAbilityCard runSaveCard">
                        <strong>Slot {slot + 1}</strong>
                        {save?.preview ? (
                          <img className="runSavePreview" src={save.preview} alt={save.label} />
                        ) : (
                          <div className="runSavePreview runSavePreviewEmpty">Empty</div>
                        )}
                        <input
                          className="textField"
                          value={slotDraftNames[slot] ?? save?.label ?? ""}
                          maxLength={20}
                          onKeyDown={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            setSlotDraftNames((current) => ({ ...current, [slot]: event.target.value }))
                          }
                          placeholder={`Run Save ${slot + 1}`}
                        />
                        <span>
                          {save
                            ? `${save.label} • ${save.savedAt}${currentRunSaveSlot === slot ? " • Auto-updates" : ""}`
                            : "Empty slot"}
                        </span>
                        <div className="shopActions">
                          {!save ? (
                            <button
                              className="shopButton"
                              type="button"
                              disabled={!runSavesEnabled || screen !== "playing"}
                              onClick={() => persistRunSaveSlot(slot)}
                            >
                              Save Here
                            </button>
                          ) : (
                            <>
                              <button
                                className="shopButton"
                                type="button"
                                onClick={() => loadRunSave(slot)}
                              >
                                Load
                              </button>
                              <button
                                className="secondaryButton"
                                type="button"
                                onClick={() => deleteRunSave(slot)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="authActions battleDexActions">
                  <button className="secondaryButton" type="button" onClick={() => setRunSavesOpen(false)}>
                    Close Run Saves
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          {battleDexOpen ? (
            <div className="arenaAbilityOverlay">
              <div className="arenaAbilityPanel battleDexPanel">
                <p className="shopKicker">Battle Dex</p>
                <h2>Unlocks And Collection</h2>
                <p>Unlock troop types with silver before you can buy them. Regular Troopers start unlocked.</p>

                <h3>Troops</h3>
                <div className="arenaAbilityGrid">
                  {ALL_TROOPS.map((kind) => {
                    const unlocked = isTroopUnlocked(kind);
                    const ownedCount = stateRef.current.allies.filter((ally) => ally.kind === kind).length;
                    const cost = TROOP_UNLOCK_COSTS[kind];
                    return (
                      <button
                        key={kind}
                        className="arenaAbilityCard"
                        type="button"
                        onClick={() => {
                          if (unlocked) {
                            openTroopUpgradeFromDex(kind);
                            return;
                          }
                          unlockTroopType(kind);
                        }}
                        disabled={!unlocked && stateRef.current.player.silverCoins < cost}
                      >
                        {unlocked ? (
                          <>
                            {renderTroopDexPreview(kind)}
                            <strong>{troopLabel(kind)}</strong>
                            <span>
                              {`Unlocked. Owned: ${ownedCount}. ${ownedCount > 0 ? "Click to upgrade." : "Buy one in the shop."}`}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="dexMystery">?</div>
                            <span className="dexMysteryName">
                              {troopLabel(kind)} • Unlock for {cost} Silver
                            </span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>

                <h3>Weapons</h3>
                <div className="arenaAbilityGrid">
                  {[...BASE_WEAPONS, ...RARE_WEAPONS].map((weapon) => {
                    const unlocked = isWeaponUnlocked(stateRef.current.player, weapon);
                    const canBuyRareWeapon = !unlocked && RARE_WEAPONS.includes(weapon);
                    return (
                      <div key={weapon} className="arenaAbilityCard dexInfoCard">
                        {unlocked ? (
                          <>
                            {renderWeaponDexPreview(weapon)}
                            <strong>{weaponLabel(weapon)}</strong>
                            <span>{weaponDescription(weapon)}</span>
                          </>
                        ) : (
                          <>
                            <div className="dexMystery">?</div>
                            <span className="dexMysteryName">
                              {weaponLabel(weapon)}
                              {canBuyRareWeapon ? " • 100 Gold / 1000 Silver run • 1000 Gold / 10000 Silver permanent" : ""}
                            </span>
                            {canBuyRareWeapon ? (
                              <div className="dexBuyActions">
                                <button
                                  className="shopButton dexBuyButton"
                                  type="button"
                                  disabled={screen !== "playing" || stateRef.current.player.silverCoins < RARE_WEAPON_RUN_COST}
                                  onClick={() => buyRareWeaponForRun(weapon)}
                                >
                                  Buy For Run
                                </button>
                                <button
                                  className="secondaryButton dexBuyButton"
                                  type="button"
                                  disabled={stateRef.current.player.silverCoins < RARE_WEAPON_PERMANENT_COST}
                                  onClick={() => buyRareWeaponPermanent(weapon)}
                                >
                                  Buy Permanent
                                </button>
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <h3>Abilities</h3>
                <div className="arenaAbilityGrid">
                  {ALL_ABILITIES.map((ability) => {
                    const level = abilityLevel(stateRef.current.player, ability);
                    const discovered = level > 0 || discoveredAbilities.includes(ability);
                    return (
                      <div key={ability} className="arenaAbilityCard dexInfoCard">
                        {discovered ? (
                          <>
                            {renderAbilityDexPreview(ability)}
                            <strong>{abilityLabel(ability)}</strong>
                            <span>
                              {level > 0
                                ? `Unlocked Lv ${level} - ${abilityDescription(ability)}`
                                : `Discovered before - ${abilityDescription(ability)}`}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="dexMystery">?</div>
                            <span className="dexMysteryName">{abilityLabel(ability)}</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="authActions battleDexActions">
                  <button className="secondaryButton" type="button" onClick={() => setBattleDexOpen(false)}>
                    Close Battle Dex
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          {abilityChoices ? (
            <div className="arenaAbilityOverlay">
              <div className="arenaAbilityPanel">
                <p className="shopKicker">Chest Opened</p>
                <h2>Choose 1 Ability</h2>
                <p>Pick one to unlock it. Picking the same ability again makes it stronger.</p>
                <div className="arenaAbilityGrid">
                  {abilityChoices.map((ability) => (
                    <button
                      key={ability}
                      className="arenaAbilityCard"
                      type="button"
                      onClick={() => {
                        applyAbility(stateRef.current, ability);
                        persistAbilityDiscovery(ability);
                        setAbilityChoices(null);
                        setHud(makeHudState(stateRef.current));
                      }}
                    >
                      <strong>{abilityLabel(ability)}</strong>
                      <span>{abilityDescription(ability)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          {mathChallenge ? (
            <div className="arenaAbilityOverlay">
              <div className="arenaAbilityPanel">
                <p className="shopKicker">Chest Lock</p>
                <h2>Solve To Open</h2>
                <p>Use math to open chests. Wrong answers release a battle droid.</p>
                <form
                  className="mathChallengeForm"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitMathAnswer();
                  }}
                >
                  <label className="mathQuestion" htmlFor="mathAnswer">
                    {mathChallenge.question} =
                  </label>
                  <input
                    id="mathAnswer"
                    className="textField"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={3}
                    value={mathAnswer}
                    onKeyDown={(event) => event.stopPropagation()}
                    onChange={(event) => setMathAnswer(event.target.value.replace(/\D/g, "").slice(0, 3))}
                    autoFocus
                  />
                  <button className="menuButton" type="submit">
                    Submit
                  </button>
                </form>
              </div>
            </div>
          ) : null}
          {rareWeaponChoices ? (
            <div className="arenaAbilityOverlay">
              <div className="arenaAbilityPanel">
                <p className="shopKicker">Rare Weapon</p>
                <h2>Choose 1 New Weapon</h2>
                <p>Rare chest reward! Pick one weapon to unlock and equip.</p>
                <div className="arenaAbilityGrid">
                  {rareWeaponChoices.map((weapon) => (
                    <button
                      key={weapon}
                      className="arenaAbilityCard"
                      type="button"
                      onClick={() => {
                        persistWeaponUnlock(weapon);
                        setRareWeaponChoices(null);
                        setHud(makeHudState(stateRef.current));
                      }}
                    >
                      <strong>{weaponLabel(weapon)}</strong>
                      <span>{weaponDescription(weapon)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          {rareWeaponReward ? (
            <div className="arenaAbilityOverlay">
              <div className="arenaAbilityPanel">
                <p className="shopKicker">Rare Weapon</p>
                <h2>{weaponLabel(rareWeaponReward)} Unlocked</h2>
                <p>{weaponDescription(rareWeaponReward)}</p>
                <div className="arenaAbilityGrid">
                  <button
                    className="arenaAbilityCard"
                    type="button"
                    onClick={() => {
                      persistWeaponUnlock(rareWeaponReward);
                      setRareWeaponReward(null);
                      setHud(makeHudState(stateRef.current));
                    }}
                  >
                    <strong>Claim {weaponLabel(rareWeaponReward)}</strong>
                    <span>{weaponDescription(rareWeaponReward)}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          {gemChestOpening ? (
            <div className="arenaAbilityOverlay">
              <div className="arenaAbilityPanel">
                <p className="shopKicker">
                  {gemChestOpening.tier === "grand"
                    ? "Grand Gem Chest"
                    : gemChestOpening.tier === "silver"
                      ? "Silver Chest"
                      : gemChestOpening.tier === "gold"
                        ? "Gold Chest"
                        : "Gem Chest"}
                </p>
                <h2>{gemChestOpening.tapsLeft > 1 ? "Tap To Crack It Open" : "Tap To Open"}</h2>
                <p>
                  {gemChestOpening.tapsLeft > 1
                    ? `${gemChestOpening.tapsLeft - 1} crack tap${gemChestOpening.tapsLeft - 1 === 1 ? "" : "s"} left, then 1 final tap to open it.`
                    : "One more tap opens the gem chest and gives the reward automatically."}
                </p>
                <div className="arenaAbilityGrid">
                  <button
                    className="arenaAbilityCard"
                    type="button"
                    onClick={tapGemChest}
                  >
                    <strong>
                      {gemChestOpening.tapsLeft > 1
                        ? `Tap Chest (${gemChestOpening.tapsLeft - 1} left)`
                        : "Open Chest"}
                    </strong>
                    <span>
                      {gemChestOpening.tapsLeft > 1
                        ? "Keep tapping like a Clash Royale chest."
                        : "Claim the reward now."}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        {screen === "playing" ? (
          <>
            <button
              className="shopDrawerTab"
              type="button"
              onClick={() => setShopDrawerOpen((current) => !current)}
              aria-expanded={shopDrawerOpen}
            >
              <span>{shopDrawerOpen ? ">" : "<"}</span>
              <strong>Shop</strong>
            </button>
            <aside className={`shopDrawer ${shopDrawerOpen ? "open" : ""}`}>
              <section className="drawerSection">
                <p className="shopKicker">Troop Shop</p>
                <h2>Hire Backup</h2>
                <p className="shopCopy">
                  Buy troop types here. Once hired, they appear with their own name above them.
                </p>
                <div className="shopActions">
                  <button
                    className="shopButton"
                    type="button"
                    disabled={stateRef.current.player.silverCoins < SHOP_COSTS.squire}
                    onClick={() => buyTroop("squire", SHOP_COSTS.squire)}
                  >
                    Regular Trooper - {SHOP_COSTS.squire} Silver
                  </button>
                  <button
                    className="shopButton"
                    type="button"
                    disabled={!isTroopUnlocked("archer") || stateRef.current.player.silverCoins < SHOP_COSTS.archer}
                    onClick={() => buyTroop("archer", SHOP_COSTS.archer)}
                  >
                    {isTroopUnlocked("archer")
                      ? `501st Clone Trooper - ${SHOP_COSTS.archer} Silver`
                      : "Unlock 501st in Battle Dex"}
                  </button>
                  <button
                    className="shopButton"
                    type="button"
                    disabled={!isTroopUnlocked("shieldsman") || stateRef.current.player.silverCoins < SHOP_COSTS.shieldsman}
                    onClick={buyShield}
                  >
                    {isTroopUnlocked("shieldsman")
                      ? `Shield Trooper - ${SHOP_COSTS.shieldsman} Silver`
                      : "Unlock Shield Trooper in Battle Dex"}
                  </button>
                  <button
                    className="shopButton"
                    type="button"
                    disabled={!isTroopUnlocked("sniper") || stateRef.current.player.silverCoins < SHOP_COSTS.sniper}
                    onClick={() => buyTroop("sniper", SHOP_COSTS.sniper)}
                  >
                    {isTroopUnlocked("sniper")
                      ? `Sniper Clone - ${SHOP_COSTS.sniper} Silver`
                      : "Unlock Sniper Clone in Battle Dex"}
                  </button>
                  <button
                    className="shopButton"
                    type="button"
                    disabled={
                      stateRef.current.player.silverCoins < SHOP_COSTS.cloneCommander ||
                      stateRef.current.allies.some((ally) => ally.kind === "clone_commander")
                    }
                    onClick={() => buySpecialTroop("clone_commander", SHOP_COSTS.cloneCommander)}
                  >
                    {stateRef.current.allies.some((ally) => ally.kind === "clone_commander")
                      ? "Clone Commander - Already Hired"
                      : `Clone Commander - ${SHOP_COSTS.cloneCommander} Silver`}
                  </button>
                  <button
                    className="shopButton"
                    type="button"
                    disabled={
                      stateRef.current.player.silverCoins < SHOP_COSTS.medicClone ||
                      stateRef.current.allies.some((ally) => ally.kind === "medic_clone")
                    }
                    onClick={() => buySpecialTroop("medic_clone", SHOP_COSTS.medicClone)}
                  >
                    {stateRef.current.allies.some((ally) => ally.kind === "medic_clone")
                      ? "Medic Clone - Already Hired"
                      : `Medic Clone - ${SHOP_COSTS.medicClone} Silver`}
                  </button>
                  <button
                    className="shopButton"
                    type="button"
                    disabled={
                      stateRef.current.player.shieldBlocks >= MAX_SHIELD_LEVEL ||
                      stateRef.current.player.silverCoins < SHOP_COSTS.playerShield
                    }
                    onClick={buyPlayerShield}
                  >
                    Player Shield - {SHOP_COSTS.playerShield} Silver
                  </button>
                  <button
                    className="shopButton"
                    type="button"
                    disabled={
                      stateRef.current.player.troopShieldBlocks >= MAX_SHIELD_LEVEL ||
                      stateRef.current.player.silverCoins < SHOP_COSTS.troopShield
                    }
                    onClick={buyTroopShield}
                  >
                    Troop Shields - {SHOP_COSTS.troopShield} Silver
                  </button>
                  <button
                    className="shopButton"
                    type="button"
                    disabled={
                      stateRef.current.player.health >= maxFoodHealth(stateRef.current.player) ||
                      stateRef.current.player.silverCoins < SHOP_COSTS.food
                    }
                    onClick={buyFood}
                  >
                    Food Bonus Heart - {SHOP_COSTS.food} Silver
                  </button>
                </div>
              </section>

              <section className="drawerSection">
                <p className="shopKicker">Troop Upgrades</p>
                <h2>{selectedTroop ? `${selectedTroop.name} - ${troopLabel(selectedTroop.kind)}` : "No Troops Yet"}</h2>
                <p className="shopCopy">Press O to show/hide this panel. Use the side arrows to switch troops.</p>
                {stateRef.current.allies.length > 1 ? (
                  <div className="troopSwitcher">
                    <button
                      className="secondaryButton troopArrow"
                      type="button"
                      onClick={() => cycleSelectedTroop(-1)}
                    >
                      &lt;
                    </button>
                    <span className="shopCopy">
                      {Math.min(selectedTroopIndex + 1, stateRef.current.allies.length)} / {stateRef.current.allies.length}
                    </span>
                    <button
                      className="secondaryButton troopArrow"
                      type="button"
                      onClick={() => cycleSelectedTroop(1)}
                    >
                      &gt;
                    </button>
                  </div>
                ) : null}
                {selectedTroop ? (
                  <p className="shopCopy">
                    {isSpecialHeroTroop(selectedTroop.kind)
                      ? "Special troop: no upgrades. Clone Commander and Medic Clone keep their own base stats."
                      : `HP Max ${selectedTroop.maxHealth}/${TROOP_MAX_HP} | Range Lv ${selectedTroop.rangeLevel}/${TROOP_RANGE_MAX_LEVEL} | Speed Lv ${selectedTroop.speedLevel}/${TROOP_SPEED_MAX_LEVEL}`}
                  </p>
                ) : null}
                <div className="shopActions">
                  <button
                    className="shopButton"
                    type="button"
                    disabled={!selectedTroop || isTroopUpgradeMaxed(selectedTroop, "health") || stateRef.current.player.silverCoins < (selectedTroop ? upgradeCost(selectedTroop, "health") : 0)}
                    onClick={() => upgradeTroop("health")}
                  >
                    Health - {troopUpgradeLabel(selectedTroop, "health")}
                  </button>
                  <button
                    className="shopButton"
                    type="button"
                    disabled={!selectedTroop || isTroopUpgradeMaxed(selectedTroop, "range") || stateRef.current.player.silverCoins < (selectedTroop ? upgradeCost(selectedTroop, "range") : 0)}
                    onClick={() => upgradeTroop("range")}
                  >
                    Range - {troopUpgradeLabel(selectedTroop, "range")}
                  </button>
                  <button
                    className="shopButton"
                    type="button"
                    disabled={!selectedTroop || isTroopUpgradeMaxed(selectedTroop, "speed") || stateRef.current.player.silverCoins < (selectedTroop ? upgradeCost(selectedTroop, "speed") : 0)}
                    onClick={() => upgradeTroop("speed")}
                  >
                    Attack Speed - {troopUpgradeLabel(selectedTroop, "speed")}
                  </button>
                </div>
              </section>

              <section className="drawerSection">
                <p className="shopKicker">Permanent Shop</p>
                <h2>Keep Items Every Run</h2>
                <p className="shopCopy">
                  Spend cores here during battle too. Permanent items come back at the start of every run.
                </p>
                <div className="shopActions">
                  <button
                    className="shopButton"
                    type="button"
                    disabled={permanentCores < 28}
                    onClick={() => buyPermanent("squire", 28)}
                  >
                    Regular Trooper + Run - 28 Cores ({permanentShop.squire})
                  </button>
                  <button
                    className="shopButton"
                    type="button"
                    disabled={!isTroopUnlocked("archer") || permanentCores < 34}
                    onClick={() => buyPermanent("archer", 34)}
                  >
                    {isTroopUnlocked("archer")
                      ? `501st Clone Trooper + Run - 34 Cores (${permanentShop.archer})`
                      : "Unlock 501st in Battle Dex"}
                  </button>
                  <button
                    className="shopButton"
                    type="button"
                    disabled={!isTroopUnlocked("shieldsman") || permanentCores < 30}
                    onClick={() => buyPermanent("shieldsman", 30)}
                  >
                    {isTroopUnlocked("shieldsman")
                      ? `Shield Trooper + Run - 30 Cores (${permanentShop.shieldsman})`
                      : "Unlock Shield Trooper in Battle Dex"}
                  </button>
                  <button
                    className="shopButton"
                    type="button"
                    disabled={!isTroopUnlocked("sniper") || permanentCores < 42}
                    onClick={() => buyPermanent("sniper", 42)}
                  >
                    {isTroopUnlocked("sniper")
                      ? `Sniper Clone + Run - 42 Cores (${permanentShop.sniper})`
                      : "Unlock Sniper Clone in Battle Dex"}
                  </button>
                  <button
                    className="shopButton"
                    type="button"
                    disabled={permanentCores < 23}
                    onClick={() => buyPermanent("food", 23)}
                  >
                    Food Bonus Heart + Run - 23 Cores ({permanentShop.food})
                  </button>
                  <button
                    className="shopButton"
                    type="button"
                    disabled={
                      permanentShop.shield >= MAX_SHIELD_LEVEL ||
                      permanentCores < 30
                    }
                    onClick={() => buyPermanent("shield", 30)}
                  >
                    Player Shield + Run - 30 Cores ({permanentShop.shield}/{MAX_SHIELD_LEVEL})
                  </button>
                  <button
                    className="shopButton"
                    type="button"
                    disabled={
                      permanentShop.troopShield >= MAX_SHIELD_LEVEL ||
                      permanentCores < 30
                    }
                    onClick={() => buyPermanent("troopShield", 30)}
                  >
                    Troop Shields + Run - 30 Cores ({permanentShop.troopShield}/{MAX_SHIELD_LEVEL})
                  </button>
                </div>
              </section>
              <section className="drawerSection">
                <p className="shopKicker">Gem Chests</p>
                <h2>Open With Gems</h2>
                <p className="shopCopy">
                  Spend gems for a chest. Basic chests can give big rewards, and the more expensive grand chest gives even more gold, silver, or abilities, plus a better rare weapon chance.
                </p>
                {shopChestMessage ? <p className="shopCopy">{shopChestMessage}</p> : null}
                <div className="shopActions">
                  <button
                    className="shopButton"
                    type="button"
                    disabled={gems < GEM_CHEST_COST}
                    onClick={() => openGemChest("basic")}
                  >
                    Gem Chest - {GEM_CHEST_COST} Gems
                  </button>
                  <button
                    className="shopButton"
                    type="button"
                    disabled={gems < GRAND_GEM_CHEST_COST}
                    onClick={() => openGemChest("grand")}
                  >
                    Grand Gem Chest - {GRAND_GEM_CHEST_COST} Gems
                  </button>
                  <button
                    className="shopButton"
                    type="button"
                    disabled={gems < SILVER_CHEST_GEM_COST || silverChestUsesAvailable <= 0}
                    onClick={() => buyCoinChest("silver")}
                  >
                    {silverChestUsesAvailable > 0
                      ? `Silver Chest - ${SILVER_CHEST_GEM_COST} Gems (${silverChestUsesAvailable} buys available)`
                      : "Silver Chest - No Buys Available"}
                  </button>
                  <button
                    className="shopButton"
                    type="button"
                    disabled={gems < GOLD_CHEST_GEM_COST || goldChestUsesAvailable <= 0}
                    onClick={() => buyCoinChest("gold")}
                  >
                    {goldChestUsesAvailable > 0
                      ? `Gold Chest - ${GOLD_CHEST_GEM_COST} Gems (${goldChestUsesAvailable} buys available)`
                      : "Gold Chest - No Buys Available"}
                  </button>
                </div>
              </section>
              <div className="shopDrawerFooter">
                <div className="drawerSection">
                  <p className="shopKicker">Instructions</p>
                  <h2>Quick Controls</h2>
                  <p className="shopCopy">
                    Arrows move. Space attacks. D equips lightsaber, A equips blaster, Q cycles weapons.
                    Hit chests, solve the math, then choose an ability or rare weapon. Press Play to start each level.
                    Food gives up to 8 temporary bonus hearts that disappear after damage.
                  </p>
                </div>
                <div className="drawerSection">
                  <p className="shopKicker">Settings</p>
                  <h2>Game Feel</h2>
                  <div className="settingsGrid">
                    <button
                      className="secondaryButton"
                      type="button"
                      onClick={() => setSoundEffectsOn((current) => !current)}
                    >
                      Sound Effects: {soundEffectsOn ? "On" : "Off"}
                    </button>
                    <button
                      className="secondaryButton"
                      type="button"
                      onClick={() => setHeartbeatOn((current) => !current)}
                    >
                      Heartbeat Hearts: {heartbeatOn ? "On" : "Off"}
                    </button>
                    <button
                      className="secondaryButton"
                      type="button"
                      onClick={() => setShowAttackRange((current) => !current)}
                    >
                      Attack Range Line: {showAttackRange ? "On" : "Off"}
                    </button>
                    <button
                      className="secondaryButton"
                      type="button"
                      onClick={() => setShowTroopNames((current) => !current)}
                    >
                      Troop Names: {showTroopNames ? "On" : "Off"}
                    </button>
                    <button
                      className="secondaryButton"
                      type="button"
                      onClick={() => {
                        const next = !runSavesEnabled;
                        setRunSavesEnabled(next);
                        writeRunSavesEnabled(playerName || "Pilot", next);
                      }}
                    >
                      Run Saves: {runSavesEnabled ? "On" : "Off"}
                    </button>
                  </div>
                </div>
                {isSignedIn ? (
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={signOut}
                  >
                    Sign Out
                  </button>
                ) : null}
              </div>
            </aside>
          </>
        ) : null}
        </div>

        <div className="battleHud">
          <p>
            Hero <strong>{heroLabel}</strong> | Move with{" "}
            <strong>Arrow Keys</strong> | Attack with <strong>Space</strong> |
            Pause with <strong>P</strong> | <strong>A</strong> Blaster |{" "}
            <strong>D</strong> Lightsaber
            {stateRef.current.player.heavyBlasterUnlocked ? (
              <>
                {" | "}
                <strong>S</strong> Heavy Blaster
              </>
            ) : null}
            {isWeaponUnlocked(stateRef.current.player, "lightsaber_gun") ? (
              <>
                {" | "}
                <strong>R</strong> Lightsaber Gun
              </>
            ) : null}
          </p>
          {unlockedAbilityControls.length > 0 ? (
            <p>Unlocked Abilities: {unlockedAbilityControls.join(" | ")}</p>
          ) : (
            <p>Unlocked Abilities: open a chest to unlock ability controls.</p>
          )}
          {stateRef.current.player.weapon === "lightsaber_gun" ? (
            <p>Lightsaber Gun Controls: <strong>Q</strong> slash | <strong>W</strong> shoot | <strong>R</strong> equip</p>
          ) : null}
          {mathError ? <p className="menuError">{mathError}</p> : null}
          <p>
            Health {Math.ceil(hud.health)} | Gold {hud.goldCoins} | Silver {hud.silverCoins} | Gems {gems} | Cores {permanentCores} | Kills {hud.kills} | Enemies {hud.enemyCount}
            {" | "}
            Regular Troopers {hud.squireCount} | 501st Clone Troopers {hud.archerCount} | Shield Troopers {hud.shieldsmanCount} | Sniper Clones {hud.sniperCount} | Player Shields {hud.shieldBlocks} | Troop Shields {hud.troopShieldBlocks}
          </p>
          <p>Troop Upgrades: press <strong>O</strong> to open, then use the left/right arrows to switch named troops.</p>
          <div className="battleControls">
            <button
              className="restartButton"
              type="button"
              onClick={() =>
                setPaused((current) => {
                  const next = !current;
                  if (!next) {
                    setLevelReady(false);
                  }
                  return next;
                })
              }
              disabled={screen !== "playing"}
            >
              {paused ? "Play" : "Pause"}
            </button>
            <button
              className="restartButton"
              type="button"
              onClick={restartRun}
              disabled={screen === "menu"}
            >
              Restart Run
            </button>
            {isSignedIn ? (
              <button
                className="restartButton"
                type="button"
                onClick={signOut}
              >
                Sign Out
              </button>
            ) : null}
          </div>
        </div>

        {screen === "menu" && isSignedIn && menuView === "howToPlay" ? (
        <section className="shopPanel">
          <div>
            <p className="shopKicker">How to Play</p>
            <h2>Survive, Upgrade, And Build Your Troop Squad</h2>
            <p className="shopCopy">
              Move with Arrow Keys. Press Space to attack. Press D for lightsaber
              and A for blaster. Chests spawn every 10-20 seconds; hit a chest
              then use math to open it. Answer correctly to choose an ability like Fireball, Spike Trap, Dash Strike,
              Heal Pulse, Freeze Blast, Turret Droid, Shield Bubble, or Coin
              Magnet, or rarely unlock a new weapon. A wrong answer releases a battle droid.
              Picking the same ability again makes it stronger. Each
              level has 5 waves. The game pauses at the start of every new
              level so you can shop, then press Play to start fighting. Waves
              20-39 can spawn enemies from both sides. Droidekas appear on wave
              40 and block every second hit. Gold is worth 10 silver.
            </p>
          </div>
        </section>
        ) : null}

        {screen === "menu" && isSignedIn && menuView === "permanentShop" ? (
        <section className="shopPanel">
          <div>
            <p className="shopKicker">Permanent Shop</p>
            <h2>Keep Items Every Run</h2>
            <p className="shopCopy">
              Spend Cores earned from finished runs. Permanent items come back
              at the start of every run and apply immediately if bought mid-run.
            </p>
          </div>
          <div className="shopActions">
            <button
              className="shopButton"
              type="button"
              disabled={permanentCores < 28}
              onClick={() => buyPermanent("squire", 28)}
            >
              Regular Trooper + Run - 28 Cores ({permanentShop.squire})
            </button>
            <button
              className="shopButton"
              type="button"
              disabled={!isTroopUnlocked("archer") || permanentCores < 34}
              onClick={() => buyPermanent("archer", 34)}
            >
              {isTroopUnlocked("archer")
                ? `501st Clone Trooper + Run - 34 Cores (${permanentShop.archer})`
                : "Unlock 501st in Battle Dex"}
            </button>
            <button
              className="shopButton"
              type="button"
              disabled={!isTroopUnlocked("shieldsman") || permanentCores < 30}
              onClick={() => buyPermanent("shieldsman", 30)}
            >
              {isTroopUnlocked("shieldsman")
                ? `Shield Trooper + Run - 30 Cores (${permanentShop.shieldsman})`
                : "Unlock Shield Trooper in Battle Dex"}
            </button>
            <button
              className="shopButton"
              type="button"
              disabled={!isTroopUnlocked("sniper") || permanentCores < 42}
              onClick={() => buyPermanent("sniper", 42)}
            >
              {isTroopUnlocked("sniper")
                ? `Sniper Clone + Run - 42 Cores (${permanentShop.sniper})`
                : "Unlock Sniper Clone in Battle Dex"}
            </button>
            <button
              className="shopButton"
              type="button"
              disabled={permanentCores < 23}
              onClick={() => buyPermanent("food", 23)}
            >
              Food Bonus Heart + Run - 23 Cores ({permanentShop.food})
            </button>
            <button
              className="shopButton"
              type="button"
              disabled={
                permanentShop.shield >= MAX_SHIELD_LEVEL ||
                permanentCores < 30
              }
              onClick={() => buyPermanent("shield", 30)}
            >
              Player Shield + Run - 30 Cores ({permanentShop.shield}/{MAX_SHIELD_LEVEL})
            </button>
            <button
              className="shopButton"
              type="button"
              disabled={
                permanentShop.troopShield >= MAX_SHIELD_LEVEL ||
                permanentCores < 30
              }
              onClick={() => buyPermanent("troopShield", 30)}
            >
              Troop Shields + Run - 30 Cores ({permanentShop.troopShield}/{MAX_SHIELD_LEVEL})
            </button>
          </div>
        </section>
        ) : null}
        {screen === "menu" && isSignedIn && menuView === "highScore" ? (
          <section className="shopPanel">
            <div>
              <p className="shopKicker">High Score</p>
              <h2>{highScore.score} Points</h2>
              <p className="shopCopy">
                Best pilot: {highScore.name}. Reached Level {highScore.level},
                Wave {waveWithinLevel(highScore.wave)}/{WAVES_PER_LEVEL}. Your last run earned{" "}
                {lastCoreReward} Cores. Current permanent Cores:{" "}
                {permanentCores}.
              </p>
            </div>
          </section>
        ) : null}
        {screen === "menu" && isSignedIn && menuView === "settings" ? (
          <section className="shopPanel">
            <div>
              <p className="shopKicker">Settings</p>
              <h2>Game Feel</h2>
              <p className="shopCopy">
                Tune the feedback while you play. Sound effects are generated
                in the browser for hits, blocks, and shots.
              </p>
            </div>
            <div className="settingsGrid">
              <button
                className="secondaryButton"
                type="button"
                onClick={() => setSoundEffectsOn((current) => !current)}
              >
                Sound Effects: {soundEffectsOn ? "On" : "Off"}
              </button>
              <button
                className="secondaryButton"
                type="button"
                onClick={() => setHeartbeatOn((current) => !current)}
              >
                Heartbeat Hearts: {heartbeatOn ? "On" : "Off"}
              </button>
              <button
                className="secondaryButton"
                type="button"
                onClick={() => setShowAttackRange((current) => !current)}
              >
                Attack Range Line: {showAttackRange ? "On" : "Off"}
              </button>
              <button
                className="secondaryButton"
                type="button"
                onClick={() => setShowTroopNames((current) => !current)}
              >
                Troop Names: {showTroopNames ? "On" : "Off"}
              </button>
              <button
                className="secondaryButton"
                type="button"
                onClick={() => {
                  const next = !runSavesEnabled;
                  setRunSavesEnabled(next);
                  writeRunSavesEnabled(playerName || "Pilot", next);
                }}
              >
                Run Saves: {runSavesEnabled ? "On" : "Off"}
              </button>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
