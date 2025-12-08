import projectsData from '../assets/data/projects.json';
import ARCH_DECOD_RAW from '../assets/media/projects/ARCHITECTURE_decod.md?raw';
import ARCH_DECOD_URL from '../assets/media/projects/ARCHITECTURE_decod.md?url';
import READ_DECOD_RAW from '../assets/media/projects/README_decod.md?raw';
import READ_DECOD_URL from '../assets/media/projects/README_decod.md?url';
import ARCH_PIXEL_RAW from '../assets/media/projects/ARCHITECTURE_pixeldei.md?raw';
import ARCH_PIXEL_URL from '../assets/media/projects/ARCHITECTURE_pixeldei.md?url';
import READ_PIXEL_RAW from '../assets/media/projects/README_pixeldei.md?raw';
import READ_PIXEL_URL from '../assets/media/projects/README_pixeldei.md?url';

const PROJECT_DOCUMENTS = {
  'proj-6': {
    architecture: {
      raw: ARCH_DECOD_RAW,
      url: ARCH_DECOD_URL,
      label: 'Architecture · Decod v2',
      filename: 'ARCHITECTURE_decod.md',
    },
    readme: {
      raw: READ_DECOD_RAW,
      url: READ_DECOD_URL,
      label: 'README · Decod v2',
      filename: 'README_decod.md',
    },
  },
  'proj-7': {
    architecture: {
      raw: ARCH_PIXEL_RAW,
      url: ARCH_PIXEL_URL,
      label: 'Architecture · Pixel-dèi',
      filename: 'ARCHITECTURE_pixeldei.md',
    },
    readme: {
      raw: READ_PIXEL_RAW,
      url: READ_PIXEL_URL,
      label: 'README · Pixel-dèi',
      filename: 'README_pixeldei.md',
    },
  },
};

const DOC_KEYWORDS = {
  architecture: [
    'architettura',
    'architecture',
    'design tecnico',
    'componenti interni',
    'diagramma',
    'pipeline tecnica',
    'struttura interna',
    'moduli interni',
  ],
  readme: [
    'readme',
    'setup',
    'installazione',
    'istruzioni',
    'come si usa',
    'come avviare',
    'run',
    'guida operativa',
  ],
  evaluation: [
    'valutazione',
    'valuta',
    'pregi',
    'difetti',
    'pro e contro',
    'assessment',
    'analisi tecnica',
    'review',
  ],
};

export function getProjectById(id) {
  return projectsData.find((p) => p.id === id);
}

export function matchProjectByText(text = '') {
  const lower = String(text || '').toLowerCase();
  const normalizedPrompt = lower.replace(/[^a-z0-9àèéìòù]/gi, ' ');
  const promptTokens = normalizedPrompt.split(/\s+/).filter((token) => token.length >= 4);
  const promptCombined = ` ${promptTokens.join(' ')} `;

  return (
    projectsData.find((project) => {
      const aliases = new Set();
      const pushAlias = (value) => {
        if (!value) return;
        const normalized = String(value).toLowerCase();
        aliases.add(normalized);
        normalized
          .replace(/[^a-z0-9àèéìòù]/gi, ' ')
          .split(/\s+/)
          .filter((token) => token.length >= 4)
          .forEach((token) => aliases.add(token));
      };

      pushAlias(project.id);
      pushAlias(project.name);
      pushAlias(project.subtitle);
      pushAlias(project.description);

      for (const alias of aliases) {
        const paddedAlias = ` ${alias} `;
        if (alias.length >= 4 && promptCombined.includes(paddedAlias)) return true;
      }
      return false;
    }) || null
  );
}

export function detectDocPreferenceFromPrompt(promptText = '') {
  const lower = String(promptText || '').toLowerCase();
  if (!lower.trim()) return [];
  const picks = new Set();
  if (DOC_KEYWORDS.architecture.some((keyword) => lower.includes(keyword))) picks.add('architecture');
  if (DOC_KEYWORDS.readme.some((keyword) => lower.includes(keyword))) picks.add('readme');
  if (DOC_KEYWORDS.evaluation.some((keyword) => lower.includes(keyword))) {
    picks.add('architecture');
    picks.add('readme');
  }
  return Array.from(picks);
}

export function buildDocumentMessages(projectId, projectName, docPreference = []) {
  const docs = PROJECT_DOCUMENTS[projectId];
  if (!docs || !docPreference?.length) return [];
  const order = ['architecture', 'readme'];
  const messages = [];
  order.forEach((type) => {
    if (!docPreference.includes(type)) return;
    const record = docs[type];
    if (!record?.raw) return;
    const snippet = record.raw.length > 2200 ? `${record.raw.slice(0, 2200)}\n[...]` : record.raw;
    messages.push({
      role: 'system',
      content: `Estratto dal documento ${record.label || type} del progetto ${projectName}:\n${snippet}`,
    });
  });
  return messages;
}

export function getDocumentDownloadInfo(projectId, docPreference = []) {
  const docs = PROJECT_DOCUMENTS[projectId];
  if (!docs) return null;
  const order = docPreference.length ? docPreference : Object.keys(docs);
  for (const type of order) {
    const record = docs[type];
    if (record?.url) {
      return {
        label: record.label || 'Scarica documento',
        url: record.url,
        filename: record.filename || 'documento.md',
      };
    }
  }
  return null;
}
