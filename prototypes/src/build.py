# Assemble single-file prototypes: inlines base.css and the engine into each template.
import pathlib
src = pathlib.Path(__file__).parent
css = (src / 'base.css').read_text()
js = (src / 'engine.js').read_text()
helpers = js.split('// ---------- Season config')[0]
family = helpers + (src / 'family.js').read_text()
for name, eng in [('a-obsidian', js), ('b-luna', js), ('c-mars', js), ('d-family', family)]:
    t = (src / f'{name}.html').read_text()
    (src.parent / f'{name}.html').write_text(t.replace('/*BASE_CSS*/', css).replace('/*ENGINE*/', eng))
    print('built', name)
