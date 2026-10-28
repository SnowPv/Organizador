#!/usr/bin/env python3
"""Revisión rápida antes de publicar: sintaxis de la app y del script, y nombres de estilo (CSS) repetidos.
Uso: python3 tools/revisar.py   (sale con error si encuentra algo)"""
import re, subprocess, sys, tempfile, os
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(raiz, 'index.html'), encoding='utf-8').read()
mal = 0
# 1) Sintaxis del JavaScript de la app y del script (Apps Script es JavaScript V8)
js = re.search(r'<script>(.*)</script>', html, re.S).group(1)
for nombre, codigo in [('index.html', js), ('Extras.gs', open(os.path.join(raiz, 'apps-script/Extras.gs'), encoding='utf-8').read())]:
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(codigo)
    r = subprocess.run(['node', '--check', f.name], capture_output=True, text=True); os.unlink(f.name)
    if r.returncode: mal += 1; print('✗ Sintaxis en', nombre, '\n', r.stderr[:800])
    else: print('✓ Sintaxis', nombre)
# 2) Un mismo nombre de clase definido como regla suelta en dos lugares lejanos del CSS = probable choque
#    (así pasó con .kb: el tablero del Pipeline y la ayuda de atajos).
css = re.search(r'<style>(.*?)</style>', html, re.S).group(1)
lineas = css.split('\n'); vistos = {}
for i, l in enumerate(lineas):
    if l.startswith('@media') or l.startswith('  '): continue
    for m in re.finditer(r'(?:^|\})\.([a-zA-Z][\w-]*)\{', l):
        vistos.setdefault(m.group(1), []).append(i + 1)
choques = {k: v for k, v in vistos.items() if len(v) > 1 and v[-1] - v[0] > 150}
for k, v in sorted(choques.items()): print('⚠ .%s definido en líneas de CSS %s' % (k, v))
print('✓ Sin choques de CSS' if not choques else '⚠ %d nombres de CSS repetidos (revisar si son la misma pieza)' % len(choques))
sys.exit(1 if mal else 0)
