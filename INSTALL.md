# Installation & Distribution Guide

This document describes how to generate the Phantom installers and how to install it on Linux systems.

## ⬇️ Download and Installation (Recommended)

The easiest way to install is by downloading the latest version from the GitHub **Releases** page:

👉 **[Download latest version (Releases)](https://github.com/victorradael/phantom/releases/latest)**

1. Download the `.deb` file (for installation) or `.AppImage` (for direct execution).
2. Follow the installation instructions below.

---

## 🛠️ Generating Installers Locally (Development)

### Prerequisites

This project uses **Yarn 4** via [Corepack](https://yarnpkg.com/corepack). Run these commands once per machine before cloning:

```bash
corepack enable   # activates corepack as the yarn interceptor
corepack install  # downloads and caches the Yarn version declared in package.json
```

> Corepack is included by default in all official Node.js distributions starting from v16.9.

## 📦 Installation (Ubuntu/Debian)

If you generated or downloaded a `.deb` file, you can install it via terminal:

### Install:
```bash
# Navigate to the download/dist folder and install the package
sudo dpkg -i dist/phantom_*.deb
# If dependencies are missing:
sudo apt-get install -f
```

### Uninstall:
```bash
sudo apt remove phantom
```

---

## 🚀 AppImage Execution

The `AppImage` format does not require installation. Just grant execution permission:

1. Right-click on the `dist/phantom_*.AppImage` file.
2. Go to **Properties** > **Permissions** > Check **Allow executing file as program**.
3. Or via terminal:
   ```bash
   chmod +x dist/phantom_*.AppImage
   ./dist/phantom_*.AppImage
   ```

---

## 🧹 Cleanup (Development)

To remove temporary build files:
```bash
rm -rf dist/ out/
```

---

## 🔄 Update Flow

### Automated Script
The `install.sh` script (linked in the README) automatically detects if Phantom (or Mini Browser) is already present on the system. If it finds a previous version, it automatically runs the uninstaller before applying the new version, ensuring a clean transition.

### In-App Notifications
Phantom periodically checks for new releases on GitHub. When a newer version is detected:
1. An elegant **Blue Steel** notification appears in the corner of the screen.
2. Clicking **"View Release"** opens the GitHub release page in your default browser, where you can download the latest `.deb` or `.AppImage`.

---

## 🐧 Troubleshooting (Linux Sandbox)

If the application fails to start with a "SUID sandbox helper" error, you can:

1. **Run without sandbox (Quick)**:
   Add `--no-sandbox` to the execution command.

2. **Enable in Kernel (Recommended)**:
   ```bash
   sudo sysctl -w kernel.unprivileged_userns_clone=1
   ```

3. **Check Limits and AppArmor**:
   *   Ensure `user.max_user_namespaces` is not 0.
   *   If on Ubuntu 24.04+, you might need:
       ```bash
       sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0
       ```

---

## 🔐 Security Considerations

When using the above commands to resolve Linux sandbox issues, be aware of the implications:

| Command / Flag | Risk | Recommendation |
| :--- | :--- | :--- |
| `--no-sandbox` | Removes isolation between web content and your system. | Use only for development and with trusted URLs. |
| `unprivileged_userns_clone` | Increases attack surface for Kernel exploits. | Required for Docker/Flatpak; keep enabled if using these tools. |
| `apparmor_restrict_unprivileged_userns` | Removes a specific Ubuntu lock against privilege exploits. | Prefer enabling specific AppArmor profiles if in a production environment. |

> [!IMPORTANT]
> The sandbox is the browser's primary defense against malicious sites. Never browse unknown sites with the `--no-sandbox` flag active.
