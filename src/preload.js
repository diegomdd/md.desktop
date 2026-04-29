const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mdDesktop', {
  openMarkdownFile: () => ipcRenderer.invoke('dialog:openMarkdownFile'),
  readFile: (filePath) => ipcRenderer.invoke('markdown:readFile', filePath),
  saveFile: (filePath, content) => ipcRenderer.invoke('markdown:saveFile', { filePath, content }),
  saveAsFile: (suggestedName, content) => ipcRenderer.invoke('markdown:saveAsFile', { suggestedName, content }),
  createFile: () => ipcRenderer.invoke('markdown:createFile')
});
