"""Publish the saved TRIZ reference material to the standalone frontend.

Run from the workspace with: python frontend/scripts/sync-knowledge.py
Requires PyYAML (already a backend dependency). No analysis or user data is copied.
"""
import hashlib
import json
import re
import xml.etree.ElementTree as ET
import sys
from pathlib import Path

import yaml

root = Path(__file__).resolve().parents[2]
source = root / "pilot/triz/knowledge"
target = root / "frontend/src/data/knowledge.json"
names = ["principles_40", "standards_76", "separation", "effects", "trends",
         "params_39", "params_biz_31", "matrix_39x39"]
data = {name: json.loads((source / f"{name}.json").read_text(encoding="utf-8")) for name in names}
data["ariz_85c"] = yaml.safe_load((source / "ariz_85c.yaml").read_text(encoding="utf-8"))
sys.path.insert(0,str(root / 'pilot'))
from triz.standard_diagrams import (
    validate_specs, render_standard, supplemental_details, render_standard_detail,
)
from triz.separation_diagrams import diagram as separation_diagram, overview as separation_overview
specs = validate_specs(data['standards_76']['standards'])
assets, detail_metadata = {}, {}
for standard in data['standards_76']['standards']:
    code = standard['code']
    assets[f'diagrams/standards/{code}.svg'] = render_standard(standard,specs[code])
    details = supplemental_details(standard)
    detail_metadata[code] = details
    for detail in details:
        key = detail['key']
        assert re.fullmatch(r'[a-z0-9.-]+',key), 'Invalid diagram detail key'
        assets[f'diagrams/standards/{code}--{key}.svg'] = render_standard_detail(standard,key)
for kind in data['separation']:
    assets[f'knowledge/separation/{kind.lower()}.svg'] = separation_diagram(kind)
assets['knowledge/separation/overview.svg'] = separation_overview()
assets['knowledge/separation/legacy_condition.svg'] = separation_diagram('CONDITION',legacy=True)
data['standard_diagram_details'] = detail_metadata

# Validate every document before replacing any published asset. Report and
# introduction use these same deterministic renderers, without model calls.
for path, svg in assets.items():
    parsed = ET.fromstring(svg)
    assert parsed.tag == '{http://www.w3.org/2000/svg}svg' and parsed.get('viewBox'), path
for path, svg in assets.items():
    destination = root/'frontend/public'/path
    destination.parent.mkdir(parents=True,exist_ok=True)
    destination.write_text(svg,encoding='utf-8')
target.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
manifest = {
    'standards_version':data['standards_76']['version'],
    'separation_version':data['separation']['SPACE']['catalog_version'],
    'parent_standards':len(specs),
    'standard_details':sum(map(len,detail_metadata.values())),
    'separation_diagrams':9,
    'assets':{path:hashlib.sha256(svg.encode('utf-8')).hexdigest() for path,svg in assets.items()},
}
(root/'frontend/public/knowledge/diagram-manifest.json').write_text(
    json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f"Published {len(specs)} standards, {manifest['standard_details']} detailed diagrams and 9 separation diagrams")
