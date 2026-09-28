export function sectionBlocks(section) {
  return section.blocks || [{type: 'html', html: section.html || ''},
    ...(section.figures || []).map(figure => ({type: 'figure', figure}))];
}


export function reportPages(sections) {
  // Backend sections correspond to chapter headings (##). Keep tables,
  // diagrams and subsections of one chapter together, regardless of length.
  return sections.map(section => ({...section, blocks: sectionBlocks(section), part: 1, parts: 1}));
}
