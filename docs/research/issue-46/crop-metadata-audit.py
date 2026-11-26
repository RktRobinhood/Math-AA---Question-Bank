import collections,json,sys
from pathlib import Path
root=Path(sys.argv[1]); pairs=[(p,x) for p in sorted((root/'data').glob('crops*.json')) for x in json.loads(p.read_text()).values()]
s=collections.Counter(markscheme_region_metadata=0)
for p,q in pairs:
    parts=q.get('parts',[])
    s['unique_canonical_questions']+=1
    s['multipart']+=len(parts)>1
    s['multiple_paper_crops']+=len(q['paperImages'])>1
    s['multiple_markscheme_crops']+=len(q['markschemeImages'])>1
    s['nested_labels']+=any('(' in part['label'] for part in parts)
    s['any_anchor_missing']+=any(not isinstance(part.get('anchor'),dict) for part in parts)
    s['end_missing']+=q.get('end') is None
    s['parts_total']+=len(parts)
    a=[(part['anchor']['image'],part['anchor']['y']) for part in parts if isinstance(part.get('anchor'),dict)]
    s['anchor_sequence_not_strictly_increasing']+=any(x>=y for x,y in zip(a,a[1:]))
    s['span_crosses_image_boundary']+=any(x[0]!=y[0] for x,y in zip(a,a[1:]+([(q['end']['image'],q['end']['y'])] if q.get('end') else [])))
    if any(k.lower().startswith(('msanchor','markschema','markschemer','msregion')) and k!='markschemeImages' for k in q):s['markscheme_region_metadata']+=1
    if len(q['paperImages'])!=len(q['markschemeImages']):s['paper_vs_markscheme_image_count_different']+=1
print(json.dumps(s,indent=2))
