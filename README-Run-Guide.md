RutiMind — Run Guide

This file includes practical steps to install dependencies and run the project on Windows (PowerShell).

Prerequisites
- Install Node.js LTS (includes npm). Recommended ways:
  - Using winget (Windows 10/11):
    winget install --id OpenJS.NodeJS.LTS -e
  - Or download the LTS installer from https://nodejs.org and run it.

Quick run steps (PowerShell)
1. Open a NEW PowerShell window (so PATH updates from Node installer take effect).
2. Change to the project folder:
   cd "C:\Users\Bedirhan\Desktop\RutiMind"
3. Install dependencies (reproducible):
   npm ci
   # or if you prefer flexible installs:
   # npm install
4. Start the project (uses Expo):
   npm start

Notes
- `npm start` maps to `expo start` per `package.json`. If you don't have the Expo CLI globally installed, the local `expo` binary will be used from node_modules when running npm start.
- If you want a global expo CLI: `npm install -g expo-cli` (optional).

If you want, I can add a short PowerShell script to automate steps 2–4. Run it from PowerShell after installing Node.
