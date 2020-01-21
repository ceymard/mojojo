'use strict'

const namer = require('color-namer')
const fs = require('fs')
const c = require('chroma-js')
const flat = require('flat')
const path = require('path')

// var base = y.load(fs.readFileSync('mojo.yml', 'utf-8'))

function unescape(val) {
  return (val||'').toString().replace(/_([\w\d]{3,8})/g, m => '#' + m.slice(1))
}

function dct(val, _) {
  _ = _ || ''
  if (typeof val === 'string' || !val || typeof val !== 'object' || val.constructor !== Object)
    return `${_}<string>${unescape(val)}</string>\n`

  var res = `${_}<dict>\n`
  for (var x in val) {
    res += `${_}  <key>${x}</key>\n`
    res += dct(val[x], _ + '  ')
  }
  res += `${_}</dict>\n`
  return res
}

class S {

  constructor() {
    this.settings = {}
    this.scopes = []
  }

  static from(color) {
    var res = new S()
    res.settings.foreground = color.hex()
    // res.settings.background = color.darken(0.5).hex()
    S.scopes.push(res)
    return res
  }

  bg(col) {
    this.settings.background = col.hex()
    return this
  }

  italic() {
    this.settings.fontStyle = 'italic'
    return this
  }

  bold() {
    this.settings.fontStyle = 'bold'
    return this
  }

  add() {
    this.scopes = this.scopes.concat(Array.prototype.slice.call(arguments))
  }

  render(indent) {
    return dct({
      settings: this.settings,
      name: '...',
      scope: this.scopes.join(', ')
    }, indent)
  }

  renderObj() {
    return {
      scope: this.scopes.join(', '),
      settings: this.settings
    }
  }
}

S.scopes = []

class C {
  constructor(col) {
    this.c = col
  }

  rotate(amount) {
    return new C(this.c.set('hcl.h', amount < 0 ? '' + amount : '+' + amount))
  }

  saturate(v = 1) {
    return new C(this.c.saturate(v))
  }

  desaturate(v = 1) {
    return new C(this.c.desaturate(v))
  }

  lum(amount) {
    return new C(this.c.set('hcl.l', amount))
  }

  chr(amount) {
    return new C(this.c.set('hcl.c', amount))
  }

  addchr(amount) {
    return new C(this.c.set('hcl.c', amount + this.c.get('hcl.c')))
  }

  addlum(amount) {
    return new C(this.c.set('hcl.l', amount + this.c.get('hcl.l')))
  }

  hex() {
    return this.c.hex()
  }
}


class Color {
  constructor(h, c, l) {
    this.h = h
    this.c = c
    this.l = l
  }

  get clone() {
    return new Color(this.h, this.c, this.l)
  }

  get chroma() {
    return c.hcl(this.h, this.c, this.l)
  }

  get hex() {
    return this.chroma.hex()
  }
}


/////////////////////////////////////////////////


function generate() {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, './package.json')))

  const themes = []
  for (var i = 0; i < 360; i += 30) {
    // themes.push(c(60, 40, i, 'lch'))
    themes.push(c(80, 60, i, 'lch'))
  }

  // const themes = [
  //   c(60, 40, 0, 'lch'),
  //   c(60, 40, 60, 'lch'),
  //   c(60, 40, 120, 'lch'),
  //   c(60, 40, 180, 'lch'),
  //   c(60, 40, 240, 'lch'),
  //   c(60, 40, 300, 'lch'),
  // ]

  for (var t of themes) {
    const theme = make_theme(t)
    fs.writeFileSync(path.join(__dirname, `./themes/${t.hex().replace('#', '')}.json`), theme, 'utf-8')
  }

  pkg.contributes.themes = themes.map(t => { return {
    label: `Mojojo ${namer(t.hex()).pantone[0].name.replace(/^(.)/, m => m.toUpperCase())}`,
    uiTheme: 'vs-dark',
    path: `./themes/${t.hex().replace('#', '')}.json`
  } })

  fs.writeFileSync(path.join(__dirname, './package.json'), JSON.stringify(pkg, null, 2), 'utf-8')

}

generate()

function make_theme(color) {

  var BASE = new C(c(color))

  const BASE_DARKER = BASE.lum(25).chr(10)
  const BORDER = BASE.lum(20).chr(5)

  var FG = new C(c('#ffffff'))

  var BG = BASE.lum(5).chr(1)

  var OPPOSITE = BASE.rotate(-180)
  var TYPES = BASE.rotate(-80).lum(60).chr(40)
  var FUNCTIONS = BASE.rotate(80)
  var STRING = BASE.rotate(30).chr(40)
  var CONSTANT = BASE.rotate(120)

  var COMMENT = BASE.lum(40).chr(10)

  /////////////////////////////////////////////////////////////////////

  var colors = {
    foreground: FG,
    'widget.shadow': BG.lum(5),
    activityBar: {
      background: BASE_DARKER,
      foreground: FG,
      border: BORDER
    },
    activityBarBadge: {
      background: OPPOSITE,
      foreground: FG
    },
    sideBar: {
      background: BG,
      foreground: FG,
      border: BORDER
    },
    sideBarSectionHeader: {
      background: BASE_DARKER,
      foreground: FG
    },
    editorGroupHeader: {
      tabsBackground: BG
    },
    tab: {
      inactiveBackground: BG,
      inactiveForeground: FG.lum(40),
      activeBackground: BG,
      activeForeground: FG,
      border: BORDER
    },
    editor: {
      foreground: FG,
      background: BG,
      lineHighlightBackground: BASE.lum(1),
      selection: BASE.lum(15),
      selectionBorder: BASE.lum(23),
    },
    editorBracketMatch: {
      background: BASE.lum(20),
      border: BASE.lum(25)
    },
    statusBar: {
      background: BASE_DARKER,
      border: BORDER
    },

    // VSCode
    'editorIndentGuide.background': BG.lum(5)

    // tagsForeground:
  }


  /////////////////////////////////////////////////////////////////////

  // Comments
  S.from(COMMENT).italic().add(
    'comment',
    'punctuation.definition.comment',
    'string.quoted.docstring',
    'string.quoted.docstring punctuation.definition.string'
  )

  // Keywords
  S.from(BASE).add(
    'keyword',
    'storage.modifier',
    'storage.type'
  )

  S.from(FG).add(
    'variable',
    'string variable',
    'string punctuation.accessor',
    'string keyword'
  )


  S.from(BASE.addlum(10)).add(
    'meta.objectliteral punctuation.definition',
    'meta.objectliteral meta.object-literal.key',
    'meta.class variable.object.property'
  )

  // markdown
  S.from(BASE.addlum(10)).bold().add(
    'markup.bold'
  )

  // markdown
  S.from(BASE.addlum(10)).italic().add(
    'markup.italic'
  )

  S.from(TYPES).add(
    'meta.type.annotation',
    'entity.name.type',
    'meta.return.type',
    'meta.type.parameters',
    'entity.other.inherited-class',
    'support.type',
    'storage.type.postgres',

    // markdown
    'markup.list beginning.punctuation'
  )

  S.from(TYPES.addlum(10)).add(
    'meta.indexer.declaration variable.parameter',
    'meta.object.type punctuation.definition',
    'meta.type.annotation variable.object.property',
    'punctuation.definition.typeparameters',
    'meta.type.annotation keyword',
    'meta.type.annotation meta.brace',
    'meta.type.annotation punctuation',
    'meta.type.parameters punctuation',
    'meta.type.parameters meta.brace',

    // markdown
    'markup.quote'
  )

  const SQL = TYPES.rotate(-85)
  S.from(SQL).add(
    'source.ts source.pgsql keyword',
    'source.ts keyword.other.DML.sql',
    'source.ts keyword.other.create.sql',
    'source.ts keyword.other.order.sql',
  )

  S.from(SQL.addchr(-30)).add(
    'source.ts keyword.other.DDL.create.II.sql',
    'source.ts keyword.other.sql',
    'source.ts keyword.other.alias.sql',
    'source.ts support.function.expression.sql',
    'source.ts constant.other.database-name.sql',
  )

  S.from(SQL.addlum(15)).add(
    'source.ts constant.other.table-name.sql',
  )

  S.from(TYPES.addlum(-5)).add(
    'entity.name.type.class',
    'meta.decorator',
    'meta.decorator variable',
    'meta.decorator meta.function-call entity.name.function'
  )

  S.from(BASE).add(
    'support.function',
    // markdown
    'markup.heading'
  )

  S.from(BASE.addlum(5)).add(
    'meta.definition.variable',
    'meta.parameters punctuation',
    'meta.parameters punctuation.definition',
    'variable.parameter',
    // Markdown
    'markup.heading punctuation'
  )

  S.from(OPPOSITE).add(
    'entity.name.tag',
    'markup.inline punctuation',
    'markup.fenced_code punctuation'
  )

  S.from(FUNCTIONS).add(
    'meta.definition entity.name.function',
    'entity.name.function',
    'support.function'
  )


  S.from(OPPOSITE.addlum(5)).add(
    'entity.other.attribute-name',
    'meta.tag punctuation.section',
    'meta.tag punctuation.definition',
    'meta.tag keyword.operator.assignment',
    // markdown
    'markup.inline',
    'markup.fenced_code'
  )

  S.from(STRING).add(
    'meta.embedded string',
    'punctuation.definition.string',
    'string'
  )

  S.from(STRING.addlum(5)).add(
    'meta.link.inline.markdown',
    'meta.link.inline.markdown punctuation.definition.string',
    'meta.image.inline',
    'meta.image.inline punctuation.definition.string'
  )

  S.from(STRING.addlum(-5)).add(
    'string punctuation.definition.template-expression'
  )

  S.from(CONSTANT.addlum(5)).add(
    'constant',
    'variable.language'
  )


  function hexify(dct) {
    for (var x in dct) {
      if (typeof dct[x].hex === 'function') {
        dct[x] = dct[x].hex()
      } else if (dct[x].constructor === Object) {
        hexify(dct[x])
      }
    }
    return dct
  }

  var res = {
    type: 'dark',
    colors: flat.flatten(hexify(colors)),
    tokenColors: S.scopes.map(s => s.renderObj())
  }

  return JSON.stringify(res, null, 2)
}
