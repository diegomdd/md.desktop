const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mdDesktop', {
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  readFile: (filePath) => ipcRenderer.invoke('markdown:readFile', filePath),
  saveFile: (filePath, content) => ipcRenderer.invoke('markdown:saveFile', { filePath, content }),
  createFile: (folderPath, fileName) => ipcRenderer.invoke('markdown:createFile', { folderPath, fileName })
});
