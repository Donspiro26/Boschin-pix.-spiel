let scene, camera, renderer;
let player, roadGroup, cityGroup;
let obstacles = [];
let collectibles = [];
let fireflyParticles = [];

let gameRunning = false;
let lane = 1;
let lanes = [-2.6, 0, 2.6];
let speed = 0.32;
let score = 0;
let isJumping = false;
let jumpVelocity = 0;
let pendingMenuAfterBox = false;
let lootClickCount = 0;
let currentLootRarity = "";

let coins = Number(localStorage.getItem("coins") || 0);
let bags = Number(localStorage.getItem("bags") || 0);
let crowns = Number(localStorage.getItem("crowns") || 0);
let beers = Number(localStorage.getItem("beers") || 0);
let fireflies = Number(localStorage.getItem("fireflies") || 0);
let boxes = Number(localStorage.getItem("boxes") || 0);

let selectedSkin = localStorage.getItem("selectedSkin") || "classic";
let ownedSkins = JSON.parse(localStorage.getItem("ownedSkins") || '["classic"]');
let usedCode = localStorage.getItem("usedElradaro7") === "yes";

let skins = [
  { id:"classic", name:"Classic Boschin", icon:"😎", price:"Gratis", type:"free", cost:0, rarity:"Normal" },
  { id:"bier", name:"Bierkönig Boschin", icon:"🍺😎", price:"300 🍺", type:"beers", cost:300, rarity:"Selten" },
  { id:"shopping", name:"Shopping Queen Boschin", icon:"👜💅", price:"350 👜", type:"bags", cost:350, rarity:"Episch" },
  { id:"king", name:"Kaiser Boschin", icon:"👑😎", price:"250 👑", type:"crowns", cost:250, rarity:"Episch" },
  { id:"pilot", name:"Pilot Boschin", icon:"✈️🎧", price:"8000 💰", type:"coins", cost:8000, rarity:"Legendär" },
  { id:"greek", name:"Fustanella Boschin", icon:"🇬🇷🍺", price:"Nur Lootbox", type:"loot", cost:0, rarity:"Ultra-Legendär" }
];

updateHud();
updateMenu();
init3D();

function saveAll() {
  localStorage.setItem("coins", coins);
  localStorage.setItem("bags", bags);
  localStorage.setItem("crowns", crowns);
  localStorage.setItem("beers", beers);
  localStorage.setItem("fireflies", fireflies);
  localStorage.setItem("boxes", boxes);
  localStorage.setItem("selectedSkin", selectedSkin);
  localStorage.setItem("ownedSkins", JSON.stringify(ownedSkins));
  localStorage.setItem("usedElradaro7", usedCode ? "yes" : "no");
}

function updateHud() {
  ["coins","mCoins","sCoins"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).innerText = coins; });
  ["bags","mBags","sBags"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).innerText = bags; });
  ["crowns","mCrowns","sCrowns"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).innerText = crowns; });
  ["beers","mBeers","sBeers"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).innerText = beers; });
  ["fireflies","mFireflies","sFireflies"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).innerText = fireflies; });
  ["boxes","mBoxes","sBoxes"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).innerText = boxes; });
}

function getSkin() {
  return skins.find(s => s.id === selectedSkin) || skins[0];
}

function updateMenu() {
  let s = getSkin();
  document.getElementById("activeSkin").innerText = "Aktiv: " + s.name;
  document.getElementById("skinPreview").innerText = s.icon;
  updateHud();
}

function init3D() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050010);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 4.2, 7.5);
  camera.lookAt(0, 1.3, -4);

  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(1.4);
  document.getElementById("game").appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x888888));

  let light = new THREE.DirectionalLight(0xffffff, 1.4);
  light.position.set(3, 8, 5);
  scene.add(light);

  let pink = new THREE.PointLight(0xff4fc3, 2.5, 35);
  pink.position.set(0, 5, 1);
  scene.add(pink);

  createRoad();
  createCity();
  createPlayer();
  animate();
}

function makeTextSprite(text, size = 180) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const c = canvas.getContext("2d");
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, 256, 256);
  c.font = "bold " + size + "px Arial";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(text, 128, 140);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;

  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.2, 2.2, 2.2);
  return sprite;
}

function createRoad() {
  roadGroup = new THREE.Group();
  scene.add(roadGroup);

  for (let i = 0; i < 24; i++) {
    let road = new THREE.Mesh(
      new THREE.BoxGeometry(9, 0.08, 8),
      new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.8 })
    );
    road.position.set(0, 0, -i * 8);
    roadGroup.add(road);

    let middleLine = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.1, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xaa7700 })
    );
    middleLine.position.set(0, 0.09, -i * 8);
    roadGroup.add(middleLine);

    let curbL = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.18, 8),
      new THREE.MeshStandardMaterial({ color: 0x777777 })
    );
    curbL.position.set(-4.6, 0.12, -i * 8);
    roadGroup.add(curbL);

    let curbR = curbL.clone();
    curbR.position.x = 4.6;
    roadGroup.add(curbR);
  }
}

function createCity() {
  cityGroup = new THREE.Group();
  scene.add(cityGroup);

  for (let i = 0; i < 36; i++) {
    createShop(-6.8, -i * 7, i);
    createShop(6.8, -i * 7 - 3.5, i + 1);
  }
}

function createShop(x, z, i) {
  let colors = [0xff4fc3, 0xffd700, 0x00ffff, 0xff6600];
  let color = colors[i % colors.length];

  let shop = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 3.5 + Math.random() * 2, 2.3),
    new THREE.MeshStandardMaterial({ color: 0x242424 })
  );
  shop.position.set(x, 1.7, z);
  cityGroup.add(shop);

  let sign = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.5, 0.12),
    new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 1.0 })
  );
  sign.position.set(x, 3.3, z + 1.2);
  cityGroup.add(sign);

  let windowLight = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.0, 0.08),
    new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.45 })
  );
  windowLight.position.set(x, 1.6, z + 1.22);
  cityGroup.add(windowLight);
}

function createPlayer() {
  if (player) scene.remove(player);

  player = new THREE.Group();

  let accent = 0xffd700;
  if (selectedSkin === "shopping") accent = 0xff4fc3;
  if (selectedSkin === "bier") accent = 0xffaa00;
  if (selectedSkin === "king") accent = 0xffffff;
  if (selectedSkin === "pilot") accent = 0x00aaff;
  if (selectedSkin === "greek") accent = 0x0055ff;

  let body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.75, 1.55, 8),
    new THREE.MeshStandardMaterial({ color: 0x050505 })
  );
  body.position.y = 1.05;
  player.add(body);

  let head = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xd69a72 })
  );
  head.position.y = 2.0;
  player.add(head);

  let glasses = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.1, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x000000 })
  );
  glasses.position.set(0, 2.05, 0.35);
  player.add(glasses);

  let medallion = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.04, 6, 12),
    new THREE.MeshStandardMaterial({ color: accent, metalness: 0.8 })
  );
  medallion.position.set(0, 1.42, 0.55);
  player.add(medallion);

  let pixelFace = makeTextSprite("😎", 95);
  pixelFace.position.set(0, 2.05, 0.48);
  pixelFace.scale.set(0.75, 0.75, 0.75);
  player.add(pixelFace);

  if (selectedSkin === "king") {
    let s = makeTextSprite("👑", 110);
    s.position.set(0, 2.65, 0.1);
    s.scale.set(1.3, 1.3, 1.3);
    player.add(s);
  }

  if (selectedSkin === "shopping") {
    let s1 = makeTextSprite("👜", 120);
    s1.position.set(-0.7, 1.1, 0.45);
    s1.scale.set(1.1, 1.1, 1.1);
    player.add(s1);

    let s2 = makeTextSprite("🛍️", 120);
    s2.position.set(0.7, 1.1, 0.45);
    s2.scale.set(1.1, 1.1, 1.1);
    player.add(s2);
  }

  if (selectedSkin === "bier") {
    let b = makeTextSprite("🍺", 120);
    b.position.set(0.65, 1.15, 0.45);
    b.scale.set(1.1, 1.1, 1.1);
    player.add(b);
  }

  if (selectedSkin === "pilot") {
    let p = makeTextSprite("🎧", 105);
    p.position.set(0, 2.25, 0.1);
    p.scale.set(1.0, 1.0, 1.0);
    player.add(p);
  }

  if (selectedSkin === "greek") {
    let g = makeTextSprite("🇬🇷", 105);
    g.position.set(0, 1.15, 0.5);
    g.scale.set(1.0, 1.0, 1.0);
    player.add(g);
  }

  if (selectedSkin === "classic") {
    let c = makeTextSprite("🛍️", 95);
    c.position.set(-0.65, 1.05, 0.45);
    c.scale.set(0.9, 0.9, 0.9);
    player.add(c);
  }

  player.scale.set(0.85, 0.85, 0.85);
  player.position.set(lanes[lane], 0, 2.4);
  scene.add(player);
}

function startGame() {
  document.getElementById("menu").style.display = "none";
  document.getElementById("shop").style.display = "none";
  document.getElementById("lootModal").style.display = "none";

  score = 0;
  speed = 0.32;
  lane = 1;
  isJumping = false;
  jumpVelocity = 0;
  pendingMenuAfterBox = false;

  obstacles.forEach(o => scene.remove(o.mesh));
  collectibles.forEach(c => scene.remove(c.mesh));
  obstacles = [];
  collectibles = [];

  createPlayer();
  gameRunning = true;
}

function endGame() {
  gameRunning = false;

  let earnedBoxes = 0;
  if (score >= 3000) earnedBoxes += 1;
  if (score >= 8000) earnedBoxes += 1;
  if (score >= 15000) earnedBoxes += 2;
  if (score >= 30000) earnedBoxes += 3;

  coins += Math.floor(score / 10);
  boxes += earnedBoxes;

  saveAll();
  updateHud();

  document.getElementById("boxResult").innerHTML =
    "Score: " + Math.floor(score) + "<br>+" + earnedBoxes + " 📦 +" + Math.floor(score / 10) + " 💰";

  if (earnedBoxes > 0) {
    pendingMenuAfterBox = true;
    showLootBox();
  } else {
    document.getElementById("menu").style.display = "block";
    updateMenu();
  }
}

function openShop() {
  document.getElementById("shop").style.display = "block";
  renderShop();
}

function closeShop() {
  document.getElementById("shop").style.display = "none";
  updateMenu();
}

function renderShop() {
  let list = document.getElementById("skinList");
  list.innerHTML = "";

  let codeBox = document.createElement("div");
  codeBox.className = "skinCard";
  codeBox.innerHTML = `
    <h3>🎁 Geheim-Code</h3>
    <input id="giftCode" placeholder="Code eingeben" style="font-size:18px;padding:10px;border-radius:10px;">
    <button onclick="redeemCode()">EINLÖSEN</button>
    <div id="giftResult"></div>
  `;
  list.appendChild(codeBox);

  skins.forEach(skin => {
    let has = ownedSkins.includes(skin.id);
    let active = selectedSkin === skin.id;

    let card = document.createElement("div");
    card.className = "skinCard";
    card.innerHTML = `
      <div class="skinPreviewSmall">${skin.icon}</div>
      <h3>${skin.name}</h3>
      <div>${skin.rarity}</div>
      <div class="price">${skin.price}</div>
    `;

    let btn = document.createElement("button");

    if (active) {
      btn.innerText = "AKTIV";
      btn.disabled = true;
    } else if (has) {
      btn.innerText = "AUSWÄHLEN";
      btn.onclick = function() {
        selectedSkin = skin.id;
        saveAll();
        createPlayer();
        renderShop();
        updateMenu();
      };
    } else if (skin.type === "loot") {
      btn.innerText = "NUR LOOTBOX";
      btn.disabled = true;
    } else {
      btn.innerText = "KAUFEN";
      btn.onclick = function() {
        buySkin(skin);
      };
    }

    card.appendChild(btn);
    list.appendChild(card);
  });

  updateHud();
}

function redeemCode() {
  let input = document.getElementById("giftCode").value.trim().toLowerCase();
  let result = document.getElementById("giftResult");

  if (input !== "elradaro7") {
    result.innerText = "Falscher Code!";
    return;
  }

  if (usedCode) {
    result.innerText = "Code wurde schon benutzt!";
    return;
  }

  let locked = skins.filter(s => !ownedSkins.includes(s.id) && s.id !== "classic");

  if (locked.length > 0) {
    let drop = locked[Math.floor(Math.random() * locked.length)];
    ownedSkins.push(drop.id);
    selectedSkin = drop.id;
    result.innerText = "🎉 Gratis Skin: " + drop.name + " + 2 Lootboxen!";
  } else {
    result.innerText = "🎉 Du hast alle Skins! + 2 Lootboxen!";
  }

  boxes += 2;
  usedCode = true;

  saveAll();
  updateHud();
  updateMenu();
  createPlayer();
  renderShop();
}

function buySkin(skin) {
  if (skin.type === "coins" && coins >= skin.cost) coins -= skin.cost;
  else if (skin.type === "bags" && bags >= skin.cost) bags -= skin.cost;
  else if (skin.type === "crowns" && crowns >= skin.cost) crowns -= skin.cost;
  else if (skin.type === "beers" && beers >= skin.cost) beers -= skin.cost;
  else {
    alert("Nicht genug gesammelt!");
    return;
  }

  ownedSkins.push(skin.id);
  selectedSkin = skin.id;
  saveAll();
  updateHud();
  updateMenu();
  createPlayer();
  renderShop();
}

function showLootBox() {
  lootClickCount = 0;
  currentLootRarity = getLootRarity();

  document.getElementById("lootModal").style.display = "block";
  document.getElementById("lootBox").innerText = "📦";
  document.getElementById("lootText").innerHTML =
    "Du hast eine Glühwürmchen-Box bekommen!<br>Tippe 3x zum Öffnen.";
}

function getLootRarity() {
  let r = Math.random() * 100;
  if (r < 50) return "SELTEN";
  if (r < 75) return "EPISCH";
  if (r < 90) return "MYTHISCH";
  if (r < 97) return "LEGENDÄR";
  return "ULTRA-LEGENDÄR";
}

function rarityColor(rarity) {
  if (rarity === "SELTEN") return "🔵";
  if (rarity === "EPISCH") return "🟣";
  if (rarity === "MYTHISCH") return "🔴";
  if (rarity === "LEGENDÄR") return "🟡";
  if (rarity === "ULTRA-LEGENDÄR") return "🌈";
  return "✨";
}

function spawnFireflyParticles() {
  for (let i = 0; i < 30; i++) {
    let p = document.createElement("div");
    p.innerText = "✨";
    p.style.position = "absolute";
    p.style.left = "50%";
    p.style.top = "45%";
    p.style.zIndex = "60";
    p.style.fontSize = (16 + Math.random() * 18) + "px";
    p.style.pointerEvents = "none";
    p.style.transition = "all 1s ease-out";
    document.getElementById("game").appendChild(p);

    setTimeout(() => {
      p.style.left = (20 + Math.random() * 60) + "%";
      p.style.top = (15 + Math.random() * 65) + "%";
      p.style.opacity = "0";
      p.style.transform = "scale(1.8)";
    }, 30);

    setTimeout(() => p.remove(), 1200);
  }
}

function openBox() {
  let result = document.getElementById("lootText");
  let box = document.getElementById("lootBox");

  if (boxes <= 0) {
    result.innerText = "Keine Box vorhanden!";
    return;
  }

  lootClickCount++;

  if (lootClickCount === 1) {
    box.innerText = "📦";
    result.innerHTML = "Die Box wackelt...<br>Tippe nochmal!";
    box.style.transform = "scale(1.12) rotate(-5deg)";
    return;
  }

  if (lootClickCount === 2) {
    box.innerText = "✨";
    spawnFireflyParticles();
    result.innerHTML = "Noch einmal tippen!";
    box.style.transform = "scale(1.22) rotate(5deg)";
    return;
  }

  boxes--;
  box.style.transform = "scale(1)";
  box.innerText = "🎁";

  giveLootReward(currentLootRarity);

  saveAll();
  updateHud();
  updateMenu();
  createPlayer();

  setTimeout(function() {
    document.getElementById("lootModal").style.display = "none";
    if (pendingMenuAfterBox) {
      pendingMenuAfterBox = false;
      document.getElementById("menu").style.display = "block";
    }
  }, 2600);
}

function giveLootReward(rarity) {
  let result = document.getElementById("lootText");
  let symbol = rarityColor(rarity);

  if (rarity === "SELTEN") {
    let amount = 80 + Math.floor(Math.random() * 41);
    bags += amount;
    result.innerHTML = symbol + " <b>SELTEN</b><br>👜 +" + amount + " Taschen";
    return;
  }

  if (rarity === "EPISCH") {
    let amount = 60 + Math.floor(Math.random() * 41);
    beers += amount;
    crowns += 10;
    result.innerHTML = symbol + " <b>EPISCH</b><br>🍺 +" + amount + " Bier<br>👑 +10 Kronen";
    return;
  }

  if (rarity === "MYTHISCH") {
    let amount = 150 + Math.floor(Math.random() * 101);
    fireflies += amount;
    boxes += 1;
    result.innerHTML = symbol + " <b>MYTHISCH</b><br>✨ +" + amount + " Glühwürmchen<br>📦 +1 Box";
    return;
  }

  if (rarity === "LEGENDÄR") {
    let possible = ["pilot", "king", "shopping", "bier"];
    let locked = possible.filter(id => !ownedSkins.includes(id));

    if (locked.length > 0) {
      let drop = locked[Math.floor(Math.random() * locked.length)];
      ownedSkins.push(drop);
      selectedSkin = drop;
      result.innerHTML = symbol + " <b>LEGENDÄR</b><br>🔥 Neuer Skin:<br>" + getSkinName(drop);
    } else {
      coins += 10000;
      result.innerHTML = symbol + " <b>LEGENDÄR</b><br>💰 +10000 Coins";
    }
    return;
  }

  if (rarity === "ULTRA-LEGENDÄR") {
    let possible = ["greek", "pilot"];
    let locked = possible.filter(id => !ownedSkins.includes(id));

    if (locked.length > 0) {
      let drop = locked[Math.floor(Math.random() * locked.length)];
      ownedSkins.push(drop);
      selectedSkin = drop;
      result.innerHTML = symbol + " <b>ULTRA-LEGENDÄR</b><br>🌈 Neuer Super-Skin:<br>" + getSkinName(drop);
    } else {
      coins += 30000;
      boxes += 3;
      result.innerHTML = symbol + " <b>ULTRA-LEGENDÄR</b><br>💰 +30000 Coins<br>📦 +3 Boxen";
    }
  }
}

function getSkinName(id) {
  let s = skins.find(x => x.id === id);
  return s ? s.name : id;
}

function spawnObstacle() {
  const emojis = ["🚧", "📦", "🛒", "🚨", "🪨", "🚛"];

  let sprite = makeTextSprite(
    emojis[Math.floor(Math.random() * emojis.length)],
    180
  );

  sprite.scale.set(2.3, 2.3, 2.3);
  sprite.position.set(lanes[Math.floor(Math.random() * 3)], 0.78, -60);

  scene.add(sprite);
  obstacles.push({ mesh: sprite });
}

function spawnCollectible() {
  const items = [
    { emoji: "💰", type: "coin" },
    { emoji: "👜", type: "bag" },
    { emoji: "👑", type: "crown" },
    { emoji: "🍺", type: "beer" },
    { emoji: "✨", type: "firefly" }
  ];

  const item = items[Math.floor(Math.random() * items.length)];

  let sprite = makeTextSprite(item.emoji, 160);
  sprite.scale.set(1.55, 1.55, 1.55);
  sprite.position.set(lanes[Math.floor(Math.random() * 3)], 2.25, -60);

  scene.add(sprite);
  collectibles.push({
    mesh: sprite,
    type: item.type,
    floatOffset: Math.random() * Math.PI * 2
  });
}

function gameStep() {
  if (!gameRunning) return;

  score += 2;
  speed += 0.00012;

  roadGroup.children.forEach(obj => {
    obj.position.z += speed;
    if (obj.position.z > 8) obj.position.z -= 192;
  });

  cityGroup.children.forEach(obj => {
    obj.position.z += speed;
    if (obj.position.z > 8) obj.position.z -= 252;
  });

  if (Math.random() < 0.014) spawnObstacle();
  if (Math.random() < 0.034) spawnCollectible();

  obstacles.forEach((o, i) => {
    o.mesh.position.z += speed * 2.5;

    if (o.mesh.position.z > 6) {
      scene.remove(o.mesh);
      obstacles.splice(i, 1);
    }

    if (
      Math.abs(o.mesh.position.z - player.position.z) < 1.0 &&
      Math.abs(o.mesh.position.x - player.position.x) < 1.0 &&
      player.position.y < 1.2
    ) {
      scene.remove(o.mesh);
      obstacles.splice(i, 1);
      endGame();
    }
  });

  collectibles.forEach((c, i) => {
    c.mesh.position.z += speed * 2.5;
    c.mesh.position.y = 2.25 + Math.sin(Date.now() * 0.006 + c.floatOffset) * 0.25;

    if (c.mesh.position.z > 6) {
      scene.remove(c.mesh);
      collectibles.splice(i, 1);
    }

    if (
      Math.abs(c.mesh.position.z - player.position.z) < 1.0 &&
      Math.abs(c.mesh.position.x - player.position.x) < 1.0 &&
      Math.abs(c.mesh.position.y - (player.position.y + 1.6)) < 1.5
    ) {
      if (c.type === "coin") coins += 10;
      if (c.type === "bag") bags++;
      if (c.type === "crown") crowns++;
      if (c.type === "beer") beers++;
      if (c.type === "firefly") fireflies += 2;

      scene.remove(c.mesh);
      collectibles.splice(i, 1);
      saveAll();
      updateHud();
    }
  });

  if (isJumping) {
    player.position.y += jumpVelocity;
    jumpVelocity -= 0.035;

    if (player.position.y <= 0) {
      player.position.y = 0;
      isJumping = false;
      jumpVelocity = 0;
    }
  }

  player.position.x += (lanes[lane] - player.position.x) * 0.22;
  player.rotation.y = Math.sin(Date.now() * 0.006) * 0.08;
}

function animate() {
  requestAnimationFrame(animate);
  gameStep();
  renderer.render(scene, camera);
}

document.addEventListener("keydown", e => {
  if (!gameRunning) return;

  if (e.key === "ArrowLeft" && lane > 0) lane--;
  if (e.key === "ArrowRight" && lane < 2) lane++;

  if ((e.key === "ArrowUp" || e.code === "Space") && !isJumping) {
    isJumping = true;
    jumpVelocity = 0.82;
  }

  if (e.key === "ArrowDown") {
    player.scale.y = 0.45;
    setTimeout(() => player.scale.y = 0.85, 400);
  }
});

let sx = 0;
let sy = 0;

document.addEventListener("touchstart", e => {
  sx = e.touches[0].clientX;
  sy = e.touches[0].clientY;
}, { passive: false });

document.addEventListener("touchend", e => {
  if (!gameRunning) return;

  let dx = e.changedTouches[0].clientX - sx;
  let dy = e.changedTouches[0].clientY - sy;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 30 && lane < 2) lane++;
    if (dx < -30 && lane > 0) lane--;
  } else {
    if (dy < -30 && !isJumping) {
      isJumping = true;
      jumpVelocity = 0.82;
    }

    if (dy > 30) {
      player.scale.y = 0.45;
      setTimeout(() => player.scale.y = 0.85, 400);
    }
  }
}, { passive: false });

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});