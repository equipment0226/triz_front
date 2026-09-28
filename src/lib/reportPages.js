export function sectionBlocks(section) {
  return section.blocks || [{type: 'html', html: section.html || ''},
    ...(section.figures || []).map(figure => ({type: 'figure', figure}))];
}

export function reportNavigationTitle(title = '') {
  // Navigation supplies its own sequence, including unnumbered summaries and
  // appendices. Leave source headings and meaningful numbers (3D, 3.5 mm) intact.
  return String(title).trim().replace(
    /^(?:(?:제\s*)?\d+\s*장(?:\s*[:.)\-–—])?\s+|\d+(?:\.\d+)*[.)](?!\d)\s*|\(\d+\)\s*)(?=\S)/u,
    '',
  );
}


export function reportPages(sections) {
  // Backend sections correspond to chapter headings (##). Keep tables,
  // diagrams and subsections of one chapter together, regardless of length.
  return sections.map(section => ({...section, blocks: sectionBlocks(section), part: 1, parts: 1}));
}
