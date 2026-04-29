const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

function normalizeMarkdownName(filePath) {
  return filePath.toLowerCase().endsWith('.md') ? filePath : `${filePath}.md`;
}

function toFilePayload(filePath, content = '') {
  return {
    name: path.basename(filePath),
    path: filePath,
    directory: path.dirname(filePath),
    content
  };
}

function buildApplicationMenu() {
  return Menu.buildFromTemplate([
    {
      label: 'Archivo',
      submenu: [
        { role: 'quit', label: 'Salir' }
      ]
    },
    {
      label: 'Edición',
      submenu: [
        { role: 'undo', label: 'Deshacer' },
        { role: 'redo', label: 'Rehacer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' },
        { role: 'selectAll', label: 'Seleccionar todo' }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'forceReload', label: 'Forzar recarga' },
        { role: 'toggleDevTools', label: 'Herramientas de desarrollo' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom normal' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla completa' }
      ]
    }
  ]);
}

function attachContextMenu(mainWindow) {
  mainWindow.webContents.on('context-menu', (_, params) => {
    const menuTemplate = [];

    if (params.editFlags.canCut) {
      menuTemplate.push({ role: 'cut', label: 'Cortar' });
    }

    if (params.editFlags.canCopy || params.selectionText) {
      menuTemplate.push({ role: 'copy', label: 'Copiar' });
    }

    if (params.editFlags.canPaste) {
      menuTemplate.push({ role: 'paste', label: 'Pegar' });
    }

    if (menuTemplate.length === 0) {
      menuTemplate.push({ role: 'selectAll', label: 'Seleccionar todo' });
    }

    Menu.buildFromTemplate(menuTemplate).popup({ window: mainWindow });
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 760,
    backgroundColor: '#08111f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setMenuBarVisibility(true);
  attachContextMenu(mainWindow);
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('dialog:openMarkdownFile', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Abrir archivo Markdown',
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  const content = await fs.readFile(filePath, 'utf8');

  return toFilePayload(filePath, content);
});

ipcMain.handle('markdown:readFile', async (_, filePath) => {
  const content = await fs.readFile(filePath, 'utf8');
  return toFilePayload(filePath, content);
});

ipcMain.handle('markdown:saveFile', async (_, { filePath, content }) => {
  await fs.writeFile(filePath, content, 'utf8');
  return toFilePayload(filePath, content);
});

ipcMain.handle('markdown:saveAsFile', async (_, { suggestedName, content }) => {
  const result = await dialog.showSaveDialog({
    title: 'Guardar archivo Markdown',
    defaultPath: normalizeMarkdownName(suggestedName || 'nuevo-archivo.md'),
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  const filePath = normalizeMarkdownName(result.filePath);
  await fs.writeFile(filePath, content, 'utf8');

  return toFilePayload(filePath, content);
});

ipcMain.handle('markdown:createFile', async () => {
  const defaultContent = '# Nuevo documento\n\nEmpezá a escribir tu Markdown.\n';

  const result = await dialog.showSaveDialog({
    title: 'Crear archivo Markdown',
    defaultPath: 'nuevo-documento.md',
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  const filePath = normalizeMarkdownName(result.filePath);
  await fs.writeFile(filePath, defaultContent, { flag: 'w' });

  return toFilePayload(filePath, defaultContent);
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(buildApplicationMenu());
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
