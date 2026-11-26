#!/usr/bin/env python3
"""Static inventory from tracked paths; no runtime/auth claims."""
import subprocess, csv, sys
from pathlib import Path
root=Path(subprocess.check_output(['git','rev-parse','--show-toplevel'],text=True).strip())
paths=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0')
writer=csv.writer(sys.stdout); writer.writerow(['kind','path','route','status'])
for path in sorted(paths):
    if not path.startswith('AB0-1-front/'): continue
    if any(path.startswith('AB0-1-front/app/'+x+'/') for x in ['dashboard','company-dashboard','review-dashboard','select-company']):
        if path.endswith('/page.tsx'): writer.writerow(['page',path,path.removeprefix('AB0-1-front/app').removesuffix('/page.tsx'),'PATH_OBSERVED'])
        elif path.endswith(('.tsx','.ts')): writer.writerow(['candidate',path,'','REVIEW_REQUIRED'])
