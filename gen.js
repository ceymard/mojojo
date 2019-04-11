'use strict'

const fs = require('fs')
const y = require('js-yaml')
const c = require('chroma-js')
const flat = require('flat')

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

var NAME = 'My Mojo'

var FG = new C(c('#eeeeee'))
var _ = c.hcl(240, 90, 60)

// Base color

// blueish
// var BASE = c('#68c4ff').saturate(0.2).lighten(0.15)
var BASE_LUM = 60
var BASE = new C(c(270, 80, 80, 'hcl')).rotate(parseInt(process.argv[2] || 0))


// var FN = c('#80defa')
// var FN = c('#80cbc4')

var OPPOSITE = BASE.rotate(-180)
var TYPES = BASE.rotate(-90).addchr(30)
var STRING = BASE.rotate(90)
var CONSTANT = BASE.rotate(135)

var COMMENT = BASE.lum(40).desaturate(2)
var BG = BASE.lum(5).desaturate(3)


/////////////////////////////////////////////////////////////////////

const BORDER = BG.addlum(-30)

var colors = {
  foreground: FG,
  'widget.shadow': BG.lum(5),
  activityBar: {
    background: BG,
    foreground: FG.lum(BASE_LUM),
    border: BORDER
  },
  activityBarBadge: {
    background: BASE.lum(50),
    foreground: BASE.lum(40)
  },
  sideBar: {
    background: BG,
    foreground: FG,
    border: BORDER
  },
  sideBarSectionHeader: {
    background: BASE.lum(5),
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
    background: BASE.lum(40)
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
  'string variable',
  'string punctuation.accessor',
  'string keyword'
)


S.from(BASE.addlum(-5).addchr(-5)).add(
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

S.from(TYPES.addlum(-5).addchr(-5)).add(
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

S.from(TYPES).add(
  'entity.name.type.class'
)

S.from(BASE).add(
  // 'support.function',
  // markdown
  'markup.heading'
)

S.from(BASE.addlum(-5).addchr(-5)).add(
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

S.from(BASE.rotate(-45).addchr(20)).add(
  'meta.definition entity.name.function',
  'entity.name.function',
  'support.function',
  'meta.function-call.tsx support.function.dom.tsx'
)


S.from(OPPOSITE.addlum(-5).addchr(-5)).add(
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

S.from(STRING.addlum(-5).addchr(-5)).add(
  'string punctuation.definition.template-expression'
)

S.from(CONSTANT).add(
  'constant',
  'variable.language'
)


// var res = `<?xml version="1.0" encoding="UTF-8"?>
// <!DOCTYPE plist
//   PUBLIC '-//Apple//DTD PLIST 1.0//EN'
//   'http://www.apple.com/DTDs/PropertyList-1.0.dtd'>
// <plist version="1.0">
//   <dict>
//     <key>name</key>
//     <string>${NAME}</string>
//     <key>comment</key>
//     <string></string>
//     <key>settings</key>
//     <array>
// ${dct({settings: settings}, '      ')}
// ${S.scopes.map(s => s.render('       ')).join('\n')}
//     </array>
//   </dict>
// </plist>
// `

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

// console.log(res)
console.log(JSON.stringify(res, null, 2))
// fs.writeFileSync('mojo.tmTheme', res, {encoding: 'utf-8'})
