// Bound mounted report content on small/touch screens. Source order is retained.
const PAGE_CHARS = 16000;
const PAGE_BLOCKS = 6;

export function sectionBlocks(section) {
  return section.blocks || [{type: 'html', html: section.html || ''},
    ...(section.figures || []).map(figure => ({type: 'figure', figure}))];
}

function size(block) {
  // Closed analysis records have no mounted body; keep each disclosure intact.
  if (block.type === 'details') return (block.title || '').length;
  return (block.type === 'figure' ? block.figure?.svg : block.html)?.length || 0;
}

export function isLongReport(sections) {
  let characters = 0, blocks = 0;
  for (const section of sections) for (const block of sectionBlocks(section)) {
    characters += size(block);
    blocks++;
  }
  return characters > 40000 || blocks > 20;
}

function splitTable(table) {
  // Keep spanning cells intact. Ordinary long trace tables can repeat headers.
  if (table.querySelector('[rowspan]:not([rowspan="1"])')) return [table.outerHTML];
  const rows = [...table.tBodies].flatMap(body => [...body.rows]);
  if (!rows.length) return [table.outerHTML];
  const result = [];
  let copy, body, chars;
  const start = () => {
    copy = table.cloneNode(false);
    for (const node of table.children) {
      if (['CAPTION', 'COLGROUP', 'THEAD'].includes(node.tagName)) copy.append(node.cloneNode(true));
    }
    body = document.createElement('tbody');
    copy.append(body);
    chars = copy.outerHTML.length;
  };
  start();
  for (const row of rows) {
    if (body.rows.length && chars + row.outerHTML.length > PAGE_CHARS) {
      result.push(copy.outerHTML);
      start();
    }
    body.append(row.cloneNode(true));
    chars += row.outerHTML.length;
  }
  if (table.tFoot) copy.append(table.tFoot.cloneNode(true));
  result.push(copy.outerHTML);
  return result;
}

function splitHtml(html) {
  if (html.length <= PAGE_CHARS) return [html];
  // Template contents are inert and are never mounted. Each displayed chunk
  // still passes through DOMPurify; raw HTML is never sent to the live DOM.
  const template = document.createElement('template');
  template.innerHTML = html;
  const pieces = [];
  for (const node of template.content.childNodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      pieces.push(...(node.tagName === 'TABLE' && node.outerHTML.length > PAGE_CHARS
        ? splitTable(node) : [node.outerHTML]));
    } else {
      const holder = document.createElement('div');
      holder.append(node.cloneNode(true));
      pieces.push(holder.innerHTML);
    }
  }
  const chunks = [];
  let chunk = '';
  for (const piece of pieces) {
    if (chunk && chunk.length + piece.length > PAGE_CHARS) {
      chunks.push(chunk);
      chunk = '';
    }
    chunk += piece;
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}

export function reportPages(sections) {
  const pages = [];
  for (const section of sections) {
    const expanded = sectionBlocks(section).flatMap(block => block.type === 'html'
      ? splitHtml(block.html || '').map(html => ({type: 'html', html})) : [block]);
    const parts = [];
    let blocks = [], characters = 0;
    for (const block of expanded) {
      if (blocks.length && (characters + size(block) > PAGE_CHARS || blocks.length >= PAGE_BLOCKS)) {
        parts.push(blocks);
        blocks = [];
        characters = 0;
      }
      blocks.push(block);
      characters += size(block);
    }
    if (blocks.length || !parts.length) parts.push(blocks);
    parts.forEach((blocks, i) => pages.push({...section, blocks, part: i + 1, parts: parts.length}));
  }
  return pages;
}
