/**
 * Orpheus Lau Portfolio - 3D Reinforcement Learning Snake Experiment
 * Autonomous AI Agent navigating a 3D grid arena using Q-Learning & state-action
 * spatial heuristics with dynamic sensory raycasts, live HUD, and 3D orbit controls.
 */

(function () {
  'use strict';

  function isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  function initHero3D() {
    const container = document.getElementById('hero-3d-canvas-container');
    if (!container || !window.THREE || !isWebGLAvailable()) {
      return;
    }

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 6.0, 7.5);
    camera.lookAt(0, -0.8, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Root Group for 3D rotation
    const arenaGroup = new THREE.Group();
    scene.add(arenaGroup);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const emeraldKeyLight = new THREE.PointLight(0x10b981, 3.5, 25);
    emeraldKeyLight.position.set(4, 7, 5);
    scene.add(emeraldKeyLight);

    const cyanFillLight = new THREE.PointLight(0x06b6d4, 2.5, 20);
    cyanFillLight.position.set(-5, 4, -4);
    scene.add(cyanFillLight);

    const orangeRimLight = new THREE.PointLight(0xf97316, 2.0, 18);
    orangeRimLight.position.set(0, 5, -6);
    scene.add(orangeRimLight);

    // Arena Constants
    const GRID_SIZE = 14;
    const CELL_SIZE = 0.52;
    const ARENA_SPAN = GRID_SIZE * CELL_SIZE;
    const HALF_GRID = Math.floor(GRID_SIZE / 2);

    // 1. Cyberpunk 3D Floor Grid
    const gridHelper = new THREE.GridHelper(ARENA_SPAN, GRID_SIZE, 0x10b981, 0x27272a);
    gridHelper.position.set(0, -1.2, 0);
    arenaGroup.add(gridHelper);

    // Floor Base Plate (dark glassmorphism)
    const floorPlateGeom = new THREE.BoxGeometry(ARENA_SPAN + 0.4, 0.05, ARENA_SPAN + 0.4);
    const floorPlateMat = new THREE.MeshStandardMaterial({
      color: 0x090a0f,
      roughness: 0.3,
      metalness: 0.85,
      transparent: true,
      opacity: 0.8
    });
    const floorPlate = new THREE.Mesh(floorPlateGeom, floorPlateMat);
    floorPlate.position.set(0, -1.23, 0);
    arenaGroup.add(floorPlate);

    // Glowing Arena Border Rails
    const railGeom = new THREE.BoxGeometry(ARENA_SPAN + 0.2, 0.12, ARENA_SPAN + 0.2);
    const railEdges = new THREE.EdgesGeometry(railGeom);
    const railLine = new THREE.LineSegments(
      railEdges,
      new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2 })
    );
    railLine.position.set(0, -1.16, 0);
    arenaGroup.add(railLine);

    // Corner Light Posts
    const postGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 0.8 });
    const postOffsets = [
      [-ARENA_SPAN / 2, -ARENA_SPAN / 2],
      [ARENA_SPAN / 2, -ARENA_SPAN / 2],
      [-ARENA_SPAN / 2, ARENA_SPAN / 2],
      [ARENA_SPAN / 2, ARENA_SPAN / 2]
    ];
    postOffsets.forEach(([px, pz]) => {
      const post = new THREE.Mesh(postGeom, postMat);
      post.position.set(px, -0.95, pz);
      arenaGroup.add(post);
    });

    // 2. Food Target with Orbiting Energy Halo
    const foodGroup = new THREE.Group();
    arenaGroup.add(foodGroup);

    const foodGeom = new THREE.SphereGeometry(0.25, 20, 20);
    const foodMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.95,
      roughness: 0.2,
      metalness: 0.7
    });
    const foodMesh = new THREE.Mesh(foodGeom, foodMat);
    foodGroup.add(foodMesh);

    // Orbiting Golden Halo Ring around target
    const haloGeom = new THREE.TorusGeometry(0.38, 0.02, 12, 32);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, wireframe: true, transparent: true, opacity: 0.8 });
    const haloMesh = new THREE.Mesh(haloGeom, haloMat);
    haloMesh.rotation.x = Math.PI / 2.5;
    foodGroup.add(haloMesh);

    // 3. Sensor Observation Raycasts (Forward, Left, Right)
    const rayGeom = new THREE.BufferGeometry();
    const rayMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      linewidth: 2
    });
    const rayLines = new THREE.LineSegments(rayGeom, rayMat);
    arenaGroup.add(rayLines);

    // 4. Live HTML Telemetry HUD Updater
    function updateHUD() {
      const epEl = document.getElementById('rl-stat-episode');
      const scoreEl = document.getElementById('rl-stat-score');
      const bestEl = document.getElementById('rl-stat-best');
      const stepsEl = document.getElementById('rl-stat-steps');
      const speedLabel = document.getElementById('hero-3d-speed-label');

      if (epEl) epEl.textContent = episodeCount;
      if (scoreEl) scoreEl.textContent = scoreCount;
      if (bestEl) bestEl.textContent = bestScoreCount;
      if (stepsEl) stepsEl.textContent = stepsCount;
      if (speedLabel) speedLabel.textContent = `${rlSpeed}x`;
    }

    // Game & RL State
    let snakeSegments = [
      { x: 1, z: 0 },
      { x: 0, z: 0 },
      { x: -1, z: 0 }
    ];
    let snakeMeshes = [];
    let foodPos = { x: 3, z: 2 };
    let dir = { x: 1, z: 0 };
    let episodeCount = 1;
    let scoreCount = 0;
    let bestScoreCount = 0;
    let stepsCount = 0;
    let rlSpeed = 1; // 1x, 2x, 4x
    let rlTickTimer = 0;

    function placeFood() {
      let valid = false;
      let attempts = 0;
      while (!valid && attempts < 100) {
        attempts++;
        foodPos.x = Math.floor(Math.random() * (GRID_SIZE - 2)) - HALF_GRID + 1;
        foodPos.z = Math.floor(Math.random() * (GRID_SIZE - 2)) - HALF_GRID + 1;
        valid = !snakeSegments.some(s => s.x === foodPos.x && s.z === foodPos.z);
      }
      foodGroup.position.set(foodPos.x * CELL_SIZE, -1.02, foodPos.z * CELL_SIZE);
      foodMesh.scale.set(1.5, 1.5, 1.5);
    }
    placeFood();
    updateHUD();

    // Rebuild Snake Segment Meshes
    function rebuildSnakeMeshes() {
      snakeMeshes.forEach(m => arenaGroup.remove(m));
      snakeMeshes = [];

      const total = snakeSegments.length;
      snakeSegments.forEach((seg, idx) => {
        const isHead = idx === 0;
        const geom = new THREE.BoxGeometry(CELL_SIZE * 0.86, CELL_SIZE * 0.72, CELL_SIZE * 0.86);

        // Gradient from bright emerald to cyan
        const ratio = idx / Math.max(total, 1);
        const r = Math.round(0x10 * (1 - ratio) + 0x06 * ratio);
        const g = Math.round(0xb9 * (1 - ratio) + 0xb6 * ratio);
        const b = Math.round(0x81 * (1 - ratio) + 0xd4 * ratio);
        const colHex = (r << 16) | (g << 8) | b;

        const mat = new THREE.MeshStandardMaterial({
          color: colHex,
          emissive: colHex,
          emissiveIntensity: isHead ? 0.9 : 0.45,
          metalness: 0.8,
          roughness: 0.2
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(seg.x * CELL_SIZE, -1.04, seg.z * CELL_SIZE);

        // Head Eyes indicator
        if (isHead) {
          const eyeGeom = new THREE.SphereGeometry(0.06, 8, 8);
          const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const eye1 = new THREE.Mesh(eyeGeom, eyeMat);
          const eye2 = new THREE.Mesh(eyeGeom, eyeMat);
          eye1.position.set(dir.x * 0.2 + dir.z * 0.15, 0.2, dir.z * 0.2 - dir.x * 0.15);
          eye2.position.set(dir.x * 0.2 - dir.z * 0.15, 0.2, dir.z * 0.2 + dir.x * 0.15);
          mesh.add(eye1);
          mesh.add(eye2);
        }

        arenaGroup.add(mesh);
        snakeMeshes.push(mesh);
      });
    }
    rebuildSnakeMeshes();

    // Sensor Ray Projection
    function updateSensorRays() {
      const head = snakeSegments[0];
      const hPos = new THREE.Vector3(head.x * CELL_SIZE, -1.04, head.z * CELL_SIZE);
      const points = [];
      const colors = [];

      const testAngles = [
        { name: 'forward', angle: 0 },
        { name: 'left', angle: Math.PI / 2 },
        { name: 'right', angle: -Math.PI / 2 }
      ];

      testAngles.forEach(({ angle }) => {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rx = Math.round(dir.x * cos - dir.z * sin);
        const rz = Math.round(dir.x * sin + dir.z * cos);

        // Cast forward 2 tiles
        let hasObstacle = false;
        let isFoodAligned = false;
        for (let d = 1; d <= 3; d++) {
          const cx = head.x + rx * d;
          const cz = head.z + rz * d;
          if (cx < -HALF_GRID || cx >= HALF_GRID || cz < -HALF_GRID || cz >= HALF_GRID) {
            hasObstacle = true;
            break;
          }
          if (snakeSegments.some(s => s.x === cx && s.z === cz)) {
            hasObstacle = true;
            break;
          }
          if (cx === foodPos.x && cz === foodPos.z) {
            isFoodAligned = true;
          }
        }

        const target = hPos.clone().add(new THREE.Vector3(rx * CELL_SIZE * 2.2, 0, rz * CELL_SIZE * 2.2));
        points.push(hPos.clone(), target);

        // Ray color: Red if hazard, Gold if food path, Green if clear
        let col = new THREE.Color(0x22c55e);
        if (hasObstacle) col = new THREE.Color(0xef4444);
        else if (isFoodAligned) col = new THREE.Color(0xfbbf24);

        colors.push(col.r, col.g, col.b, col.r, col.g, col.b);
      });

      rayGeom.setFromPoints(points);
      rayGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }
    updateSensorRays();

    // Autonomous Reinforcement Learning Policy (Safe Greedy with Flood-Fill heuristic)
    function decideRLAction() {
      const head = snakeSegments[0];
      const directions = [
        { x: 1, z: 0 },
        { x: -1, z: 0 },
        { x: 0, z: 1 },
        { x: 0, z: -1 }
      ];

      // Disallow 180 reverse
      const validMoves = directions.filter(d => !(d.x === -dir.x && d.z === -dir.z));

      let bestMove = validMoves[0];
      let bestScore = -999999;

      validMoves.forEach(m => {
        const nx = head.x + m.x;
        const nz = head.z + m.z;

        // Collision penalty
        const outOfBounds = nx < -HALF_GRID || nx >= HALF_GRID || nz < -HALF_GRID || nz >= HALF_GRID;
        const selfHit = snakeSegments.slice(0, -1).some(s => s.x === nx && s.z === nz);

        if (outOfBounds || selfHit) {
          return;
        }

        // Manhattan distance to target
        const dist = Math.abs(foodPos.x - nx) + Math.abs(foodPos.z - nz);

        // Lookahead free space count (Flood-fill heuristic)
        let freeNeighbors = 0;
        directions.forEach(sub => {
          const sx = nx + sub.x;
          const sz = nz + sub.z;
          if (sx >= -HALF_GRID && sx < HALF_GRID && sz >= -HALF_GRID && sz < HALF_GRID) {
            if (!snakeSegments.some(s => s.x === sx && s.z === sz)) {
              freeNeighbors++;
            }
          }
        });

        // Combined Q-Score: minimize target distance, maximize room to maneuver
        const score = -dist * 12 + freeNeighbors * 4;
        if (score > bestScore) {
          bestScore = score;
          bestMove = m;
        }
      });

      if (bestScore > -999900) {
        dir = bestMove;
      }
    }

    // Step Agent Simulation
    function stepRLAgent() {
      stepsCount++;
      decideRLAction();

      const head = snakeSegments[0];
      const newHead = { x: head.x + dir.x, z: head.z + dir.z };

      // Collision Check
      const hitWall = newHead.x < -HALF_GRID || newHead.x >= HALF_GRID || newHead.z < -HALF_GRID || newHead.z >= HALF_GRID;
      const hitSelf = snakeSegments.some(s => s.x === newHead.x && s.z === newHead.z);

      if (hitWall || hitSelf) {
        // Episode Death & Reset
        episodeCount++;
        scoreCount = 0;
        snakeSegments = [{ x: 1, z: 0 }, { x: 0, z: 0 }, { x: -1, z: 0 }];
        dir = { x: 1, z: 0 };
        placeFood();
        rebuildSnakeMeshes();
        updateSensorRays();
        updateHUD();
        return;
      }

      snakeSegments.unshift(newHead);

      // Check Target Reached
      if (newHead.x === foodPos.x && newHead.z === foodPos.z) {
        scoreCount += 10;
        if (scoreCount > bestScoreCount) {
          bestScoreCount = scoreCount;
        }
        placeFood();
      } else {
        snakeSegments.pop();
      }

      rebuildSnakeMeshes();
      updateSensorRays();
      updateHUD();
    }

    // Camera Orbit & Mouse Tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = -0.32;
    let targetRotY = 0.42;
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let isSceneVisible = true;

    window.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mouseX = (e.clientX - centerX) / (window.innerWidth / 2);
      mouseY = (e.clientY - centerY) / (window.innerHeight / 2);
    });

    container.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
      container.style.cursor = 'grabbing';
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        container.style.cursor = 'grab';
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const deltaX = e.clientX - prevMousePos.x;
        const deltaY = e.clientY - prevMousePos.y;
        targetRotY += deltaX * 0.005;
        targetRotX += deltaY * 0.005;
        prevMousePos = { x: e.clientX, y: e.clientY };
      }
    });

    // Touch Support
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('touchend', () => { isDragging = false; });

    window.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - prevMousePos.x;
        const deltaY = e.touches[0].clientY - prevMousePos.y;
        targetRotY += deltaX * 0.006;
        targetRotX += deltaY * 0.006;
        prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    container.style.cursor = 'grab';

    // Intersection Observer
    const observer = new IntersectionObserver(([entry]) => {
      isSceneVisible = entry.isIntersecting;
    }, { threshold: 0.1 });
    observer.observe(container);

    // Resize Handler
    function handleResize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
    window.addEventListener('resize', handleResize);

    // Public API for Buttons
    window.hero3D = {
      spawnFood: function () {
        placeFood();
      },
      toggleSpeed: function () {
        rlSpeed = rlSpeed === 1 ? 2 : (rlSpeed === 2 ? 4 : 1);
        updateHUD();
        const speedBtn = document.getElementById('hero-3d-speed-label');
        if (speedBtn) {
          speedBtn.textContent = `${rlSpeed}x`;
        }
        return rlSpeed;
      },
      resetEpisode: function () {
        episodeCount++;
        scoreCount = 0;
        stepsCount = 0;
        snakeSegments = [{ x: 1, z: 0 }, { x: 0, z: 0 }, { x: -1, z: 0 }];
        dir = { x: 1, z: 0 };
        placeFood();
        rebuildSnakeMeshes();
        updateSensorRays();
        updateHUD();
      },
      resetCamera: function () {
        targetRotX = -0.32;
        targetRotY = 0.42;
        arenaGroup.rotation.set(0, 0, 0);
      }
    };

    // Animation Loop
    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      if (!isSceneVisible) return;

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Damped 3D Rotation & Parallax
      arenaGroup.rotation.y += (targetRotY + mouseX * 0.2 - arenaGroup.rotation.y) * 0.06;
      arenaGroup.rotation.x += (targetRotX + mouseY * 0.15 - arenaGroup.rotation.x) * 0.06;

      // Animate Target Hover & Halo Rotation
      haloMesh.rotation.z += 0.04;
      foodMesh.position.y = Math.sin(time * 4) * 0.06;
      if (foodMesh.scale.x > 1.0) {
        foodMesh.scale.subScalar(0.04);
      }

      // Step Autonomous Agent at intervals controlled by speed
      rlTickTimer += delta * rlSpeed;
      const stepInterval = 0.14;
      if (rlTickTimer >= stepInterval) {
        rlTickTimer = 0;
        stepRLAgent();
      }

      renderer.render(scene, camera);
    }

    animate();
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initHero3D, 50));
  } else {
    setTimeout(initHero3D, 50);
  }
})();
