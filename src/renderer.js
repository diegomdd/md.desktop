const state = {
  folderPath: '',
  files: [],
  activeFile: null
};

const elements = {
  openFolder: document.getElementById('open-folder'),
  newFile: document.getElementById('new-file'),
  saveFile: document.getElementById('save-file'),
  fileList: document.getElementById('file-list'),
  folderPath: document.getElementById('folder-path'),
  currentFile: document.getElementById('current-file'),
  status: document.getElementById('status'),
  editor: document.getElementById('editor'),
  preview: document.getElementById('preview')
};

function renderPreview(markdown) {
  elements.preview.innerHTML = window.marked.parse(markdown || '');
}

function setStatus(message, isSuccess = false) {
  elements.status.textContent = message;
  elements.status.style.color = isSuccess ? '#22c55e' : '#94a3b8';
}

function renderFileList() {
  elements.fileList.innerHTML = '';

  state.files.forEach((file) => {
    const item = document.createElement('li');
    const button = document.createElement('button');

    button.textContent = file.relativePath;
    button.className = state.activeFile?.path === file.path ? 'is-active' : '';
    button.addEventListener('click', () => openFile(file));

    item.appendChild(button);
    elements.fileList.appendChild(item);
  });
}

async function openFile(file) {
  const content = await window.mdDesktop.readFile(file.path);
  state.activeFile = file;
  elements.currentFile.textContent = file.relativePath;
  elements.editor.value = content;
  renderPreview(content);
  setStatus(`Editando ${file.name}`);
  renderFileList();
}

async function handlePickFolder() {
  const result = await window.mdDesktop.pickFolder();

  if (!result) {
    setStatus('Selección cancelada.');
    return;
  }

  state.folderPath = result.folderPath;
  state.files = result.files;
  state.activeFile = null;

  elements.folderPath.textContent = result.folderPath;
  elements.currentFile.textContent = 'Seleccioná un archivo';
  elements.editor.value = '';
  renderPreview('');
  renderFileList();
  setStatus(`Carpeta abierta con ${result.files.length} archivo(s) Markdown.`, true);
}

async function handleSave() {
  if (!state.activeFile) {
    setStatus('Primero abrí un archivo.');
    return;
  }

  await window.mdDesktop.saveFile(state.activeFile.path, elements.editor.value);
  renderPreview(elements.editor.value);
  setStatus('Archivo guardado.', true);
}

async function handleCreateFile() {
  if (!state.folderPath) {
    setStatus('Primero abrí una carpeta.');
    return;
  }

  const fileName = window.prompt('Nombre del archivo Markdown');

  if (!fileName) {
    setStatus('Creación cancelada.');
    return;
  }

  try {
    const file = await window.mdDesktop.createFile(state.folderPath, fileName.trim());
    state.files = [...state.files, file].sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    renderFileList();
    await openFile(file);
    setStatus('Archivo creado.', true);
  } catch (error) {
    setStatus(`No se pudo crear el archivo: ${error.message}`);
  }
}

elements.openFolder.addEventListener('click', handlePickFolder);
elements.saveFile.addEventListener('click', handleSave);
elements.newFile.addEventListener('click', handleCreateFile);
elements.editor.addEventListener('input', (event) => {
  renderPreview(event.target.value);
});

renderPreview('## md.desktop\n\nAbrí una carpeta para empezar.');
