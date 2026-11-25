#!/usr/bin/env python3
"""Checks built singlefile HTML with the existing gzip budget. Read-only."""
import gzip, hashlib, pathlib, sys
root = pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'packages/mcp-ui/dist')
limit=120*1024
names=['search','profile','reputation','compare','categories']
failed=False
for name in names:
    p=root/(name+'.v1.html')
    if not p.is_file():
        print(f'MISSING {p}'); failed=True; continue
    raw=p.read_bytes(); size=len(gzip.compress(raw,compresslevel=9,mtime=0))
    ok=size<=limit; failed|=not ok
    print(f'{name} raw={len(raw)} gzip={size} margin={limit-size} sha256={hashlib.sha256(raw).hexdigest()} {"PASS" if ok else "FAIL"}')
# Node build remains canonical: zlib versions may differ slightly.
sys.exit(int(failed))
