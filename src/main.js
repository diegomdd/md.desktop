const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const isMarkdownFile = (fileName) => fileName.toLowerCase().endsWith('.md');

async function collectMarkdownFiles(dirPath, basePath = dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const nested = await collectMarkdownFiles(fullPath, basePath);
      files.push(...nested);
      continue;
    }

    if (entry.isFile() && isMarkdownFile(entry.name)) {
      files.push({
        name: entry.name,
        path: fullPath,
        relativePath: path.relative(basePath, fullPath)
      });
    }
  }

  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('dialog:pickFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const folderPath = result.filePaths[0];
  const files = await collectMarkdownFiles(folderPath);

  return { folderPath, files };
});

ipcMain.handle('markdown:readFile', async (_, filePath) => {
  return fs.readFile(filePath, 'utf8');
});

ipcMain.handle('markdown:saveFile', async (_, { filePath, content }) => {
  await fs.writeFile(filePath, content, 'utf8');
  return { ok: true };
});

ipcMain.handle('markdown:createFile', async (_, { folderPath, fileName }) => {
  const normalizedName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
  const filePath = path.join(folderPath, normalizedName);

  await fs.writeFile(filePath, '# Nuevo archivo\n', { flag: 'wx' });

  return {
    name: path.basename(filePath),
    path: filePath,
    relativePath: path.relative(folderPath, filePath)
  };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
