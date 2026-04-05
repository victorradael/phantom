# <img src="public/icon.png" width="32" height="32" align="center" alt="Phantom icon"> Phantom

A minimalist, elegant, and productivity-focused browser. Phantom was designed to be a lightweight reference tool, always at hand while you work on other tasks.

---

## ✨ Visual Identity & Experience
Phantom abandons the standard browser look for a modern native app experience:
- **Frameless Window**: Interface without borders or system title bars, maximizing content space.
- **Minimalist Identity**: Custom icon reflecting its stealthy, focused nature.
- **Smart Favicons**: The header and dashboard automatically display site icons (favicons) with a resilient fallback system.
- **Dynamic Title**: The header acts as a smart tab, updating the title as you navigate.

## 🚀 Key Features
- **Workspaces Dashboard**: Save and organize your frequent URLs with custom aliases.
- **Always on Top**: Pin the window over other apps with a single click for continuous reference.
- **Bitwarden Sidebar**: Integrated password manager via a resizable sidebar.
- **Elegant Error Handling**: Custom error screen for failed connections or invalid URLs.
- **Automatic Updates**: Detects new versions on startup and offers in-app download and install without leaving the app.
- **Quick Shortcuts**: Instantly close the application with `Ctrl + Q`.

---

## 🛠️ Tech Stack
- **Engine**: Electron + Chromium
- **Frontend**: React + Vite
- **Styling**: Tailwind CSS (Modern Dark Theme)
- **Icons**: Lucide Icons + DuckDuckGo Favicon Service
- **Persistence**: `electron-store` (encrypted via OS keychain)

## 📦 Getting Started

### Installation for Users
We recommend downloading the official compiled version to avoid the need for compilation:
👉 **[Download latest version (GitHub Releases)](https://github.com/victorradael/phantom/releases)**

### Linux

#### Quick Install & Update (Debian/Ubuntu/AppImage)
You can install or update Phantom to the latest version with a single command. The script automatically detects and replaces existing versions:
```bash
curl -fsSL https://raw.githubusercontent.com/victorradael/phantom/master/scripts/install.sh | bash
```

To uninstall:
```bash
curl -fsSL https://raw.githubusercontent.com/victorradael/phantom/master/scripts/uninstall.sh | bash
```

#### Manual Installation
- Download the `.deb` or `.AppImage` from the [latest release](https://github.com/victorradael/phantom/releases/latest).

### For Developers

This project uses **Yarn 4** managed via [Corepack](https://yarnpkg.com/corepack), which is bundled with Node.js 16.9+.

**First-time machine setup** (run once per machine):
```bash
corepack enable
corepack install
```

**Clone and run**:
```bash
git clone https://github.com/victorradael/phantom
cd phantom
yarn
```

**Development**: `yarn dev`
**Local Build**: `yarn build:linux`

---

## 🔐 Bitwarden Integration
Instead of complex extensions, we use the official **Web Vault** in a sidebar:
1.  Open the sidebar via the **Shield** icon or button on the Dashboard.
2.  Resize the width by pulling the side edge.
3.  Your credentials will always be at hand to copy/paste securely.

## 📄 License
This project is licensed under the MIT license. Created by Victor Radael.
