# Orpheus Lau — Portfolio & AI Systems Engineering

> **Creative Technologist & AI Systems Engineer**  
> Engineering at the intersection of AI, Cybersecurity, Edge Computing, and Social Impact with 20+ years of sector leadership.

[![Website](https://img.shields.io/badge/Website-orpheuslau.dev-f97316?style=flat-square)](https://www.orpheuslau.dev/)
[![WebGL](https://img.shields.io/badge/3D-Three.js%20WebGL-10b981?style=flat-square)](https://threejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

---

## 🌟 Overview

This repository contains the production portfolio website for **Orpheus Lau**, featuring an interactive, real-time **3D Reinforcement Learning (RL) Snake Experiment** directly on the front-page hero section.

The site highlights 20+ years of frontline digital leadership across Hong Kong's social welfare governance, enterprise AI systems, edge computer vision pipelines, and cryptographic mobile applications.

---

## 🎮 Interactive 3D Reinforcement Learning Experiment

The hero section features a real-time, autonomous AI agent navigating a 3D isometric cyberpunk voxel arena using spatial reinforcement learning ($Q$-learning & flood-fill safety heuristics):

- **Autonomous Agent**: Voxel snake agent calculating optimal policies in real-time.
- **Dynamic Sensory Raycasts**: Projects 3 visual observation rays from the snake's head (green = clear, red = hazard/wall, gold = target alignment).
- **Live HTML Telemetry HUD**: Crisp parameter counters tracking **Episode**, **Score**, **Best Score**, and **Steps**.
- **Interactive Controls**:
  - `Spawn Target`: Drops a new energy target into the 3D grid arena.
  - `Speed Toggle`: Adjusts simulation speed ($1\times$, $2\times$, $4\times$).
  - `Reset Run`: Starts a new training episode.
  - `360° Orbit`: Click and drag to inspect the 3D board from any camera angle.

---

## 📂 Project Structure

```bash
├── index.html           # Main production portfolio page with 3D RL hero section
├── original_index.html  # Verified reference clone
├── css/
│   └── styles8.css      # Design system, glassmorphism tokens, and card spotlight shaders
├── js/
│   ├── hero-3d.js       # Dedicated Three.js WebGL Reinforcement Learning Snake engine
│   └── scripts8.js      # Case study reader, project registry, modal lightbox, and navigation
├── assets/              # Architecture diagrams, covers, and whitepaper PDFs
│   ├── img/             # Project screenshots, covers, and thumbnails
│   └── ...
└── README.md
```

---

## 🚀 Running Locally

To run the site locally:

```bash
# Clone the repository
git clone https://github.com/orpheuslau/portfolio.git
cd portfolio

# Start a local static server (Python 3)
python3 -m http.server 8080

# Open in your browser
open http://localhost:8080
```

---

## 📬 Contact & Advisory

- **Email**: [orpheuslau@gmail.com](mailto:orpheuslau@gmail.com)
- **LinkedIn**: [linkedin.com/in/ktklau](https://www.linkedin.com/in/ktklau/)
- **GitHub**: [@orpheuslau](https://github.com/orpheuslau)
- **Website**: [orpheuslau.dev](https://www.orpheuslau.dev/)
