# Assemble single-file prototypes: inlines base.css and engine.js into each template.
import pathlib
src = pathlib.Path(__file__).parent
css = (src / 'base.css').read_text()
js = (src / 'engine.js').read_text()
for name in ['a-obsidian', 'b-luna', 'c-mars']:
    t = (src / f'{name}.html').read_text()
    out = t.replace('/*BASE_CSS*/', css).replace('/*ENGINE*/', js)
    (src.parent / f'{name}.html').write_text(out)
    print('built', name)
