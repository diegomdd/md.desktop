const INITIAL_CONTENT = '# md.desktop\n\nAbrí un archivo `.md` o creá uno nuevo para empezar.';

const state = {
  theme: localStorage.getItem('md.desktop.theme') || 'dark',
  activeFile: null,
  content: INITIAL_CONTENT,
  dirty: false
};

const elements = {
  body: document.body,
  openFile: document.getElementById('open-file'),
  newFile: document.getElementById('new-file'),
  saveFile: document.getElementById('save-file'),
  toggleTheme: document.getElementById('toggle-theme'),
  currentFile: document.getElementById('current-file'),
  filePath: document.getElementById('file-path'),
  status: document.getElementById('status'),
  editor: document.getElementById('editor'),
  preview: document.getElementById('preview'),
  wordCount: document.getElementById('word-count'),
  charCount: document.getElementById('char-count'),
  themeBadge: document.getElementById('theme-badge'),
  saveBadge: document.getElementById('save-badge')
};

marked.setOptions({ breaks: true, gfm: true });

function updateMetrics(content) {
  const trimmed = content.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  elements.wordCount.textContent = String(words);
  elements.charCount.textContent = String(content.length);
}

function renderPreview(markdown) {
  elements.preview.innerHTML = marked.parse(markdown || '');
  updateMetrics(markdown || '');
}

function setStatus(message, tone = 'neutral') {
  elements.status.textContent = message;
  elements.status.dataset.tone = tone;
}

function updateDirtyState(isDirty) {
  state.dirty = isDirty;
  elements.saveBadge.textContent = isDirty ? 'Cambios sin guardar' : 'Todo guardado';
  elements.saveBadge.classList.toggle('badge--warning', isDirty);
}

function applyTheme(theme) {
  state.theme = theme;
  elements.body.dataset.theme = theme;
  elements.toggleTheme.textContent = theme === 'dark' ? '🌙' : '☀️';
  elements.themeBadge.textContent = theme === 'dark' ? 'Modo oscuro' : 'Modo claro';
  localStorage.setItem('md.desktop.theme', theme);
}

function updateFileHeader() {
  if (!state.activeFile) {
    elements.currentFile.textContent = 'Sin archivo abierto';
    elements.filePath.textContent = 'Abrí un archivo .md o creá uno nuevo para empezar.';
    return;
  }

  elements.currentFile.textContent = state.activeFile.name;
  elements.filePath.textContent = state.activeFile.path;
}

function hydrateEditor(content) {
  state.content = content;
  elements.editor.value = content;
  renderPreview(content);
}

function openPayload(payload, successMessage) {
  state.activeFile = {
    name: payload.name,
    path: payload.path,
    directory: payload.directory
  };

  updateFileHeader();
  hydrateEditor(payload.content);
  updateDirtyState(false);
  setStatus(successMessage, 'success');
}

async function handleOpenFile() {
  try {
    const payload = await window.mdDesktop.openMarkdownFile();

    if (!payload) {
      setStatus('Apertura cancelada.', 'neutral');
      return;
    }

    openPayload(payload, `Abierto ${payload.name}`);
  } catch (error) {
    setStatus(`No se pudo abrir el archivo: ${error.message}`, 'danger');
  }
}

async function handleCreateFile() {
  try {
    const payload = await window.mdDesktop.createFile();

    if (!payload) {
      setStatus('Creación cancelada.', 'neutral');
      return;
    }

    openPayload(payload, `Nuevo archivo creado: ${payload.name}`);
  } catch (error) {
    setStatus(`No se pudo crear el archivo: ${error.message}`, 'danger');
  }
}

async function handleSave() {
  try {
    const content = elements.editor.value;

    if (state.activeFile?.path) {
      const payload = await window.mdDesktop.saveFile(state.activeFile.path, content);
      openPayload(payload, 'Archivo guardado.');
      return;
    }

    const payload = await window.mdDesktop.saveAsFile('nuevo-documento.md', content);

    if (!payload) {
      setStatus('Guardado cancelado.', 'neutral');
      return;
    }

    openPayload(payload, 'Archivo guardado.');
  } catch (error) {
    setStatus(`No se pudo guardar el archivo: ${error.message}`, 'danger');
  }
}

elements.openFile.addEventListener('click', handleOpenFile);
elements.newFile.addEventListener('click', handleCreateFile);
elements.saveFile.addEventListener('click', handleSave);
elements.toggleTheme.addEventListener('click', () => {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
});

elements.editor.addEventListener('input', (event) => {
  const content = event.target.value;
  state.content = content;
  renderPreview(content);
  updateDirtyState(true);
  setStatus('Editando en vivo.', 'neutral');
});

applyTheme(state.theme);
updateFileHeader();
hydrateEditor(INITIAL_CONTENT);
updateDirtyState(false);
setStatus('Listo para editar.', 'success');
