"""Publish the saved TRIZ reference material to the standalone frontend.

Run from the workspace with: python frontend/scripts/sync-knowledge.py
Requires PyYAML (already a backend dependency). No analysis or user data is copied.
"""
import json
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
from triz.standard_diagrams import validate_specs, render_standard
specs = validate_specs(data['standards_76']['standards'])
diagrams = root / 'frontend/public/diagrams/standards'
diagrams.mkdir(parents=True,exist_ok=True)
for standard in data['standards_76']['standards']:
    (diagrams / (standard['code']+'.svg')).write_text(render_standard(standard,specs[standard['code']]),encoding='utf-8')
target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Published {len(data)} reference collections and {len(specs)} standard diagrams")
