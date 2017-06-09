'use strict'

const fs = require('fs')
const y = require('js-yaml')
const c = require('color')
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
    res.settings.background = color.darken(0.5).hex()
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

/////////////////////////////////////////////////

var NAME = 'My Mojo'

var FG = c('#eeeeee')

// Base color

// blueish
// var BASE = c('#68c4ff').saturate(0.2).lighten(0.15)
var BASE = c('#81d4fa').rotate(parseInt(process.argv[2] || 0))

// var FN = c('#80defa')
// var FN = c('#80cbc4')

var OPPOSITE = BASE.rotate(180)
var TYPES = BASE.rotate(-60)
var BASE = BASE.rotate(20)
var STRING = BASE.rotate(230).desaturate(0.4)
var CONSTANT = BASE.rotate(80)

var COMMENT = BASE.darken(0.5).desaturate(0.7)
var BG = BASE.darken(0.9).desaturate(0.9)


/////////////////////////////////////////////////////////////////////

const BORDER = BG.lighten(0.5)

var colors = {
  foreground: FG,
  'widget.shadow': BG.lighten(0.6),
  activityBar: {
    background: BG,
    foreground: FG.darken(0.5),
    border: BORDER
  },
  activityBarBadge: {
    background: BASE.darken(0.2),
    foreground: BASE.darken(0.6)
  },
  sideBar: {
    background: BG,
    foreground: FG,
    border: BORDER
  },
  sideBarSectionHeader: {
    background: BG.lighten(0.5),
    foreground: FG
  },
  editorGroupHeader: {
    tabsBackground: BG
  },
  tab: {
    inactiveBackground: BG,
    inactiveForeground: FG.darken(0.5),
    activeBackground: BG.lighten(1),
    activeForeground: FG,
    border: BORDER
  },
  editor: {
    foreground: FG,
    background: BG,
    lineHighlightBackground: BASE.darken(0.85),
    selection: BASE.darken(0.6),
    selectionBorder: BASE.darken(0.8),
  },
  editorBracketMatch: {
    background: BASE.darken(0.5),
    border: BASE.darken(0.55)
  },
  statusBar: {
    background: BASE.darken(0.6)
  },

  // VSCode
  'editorIndentGuide.background': BG.lighten(0.4)

  // tagsForeground:
}


/////////////////////////////////////////////////////////////////////

S.from(COMMENT).italic().add(
  'comment',
  'punctuation.definition.comment',
  'string.quoted.docstring',
  'string.quoted.docstring punctuation.definition.string'
)

S.from(BASE).add(
  'keyword.control',
  'keyword.operator.expression',
  'keyword.operator.new',
  'keyword.other',
  'storage.type',
  'keyword.operator.logical.python',
  'storage.modifier'
)

S.from(FG).add(
  'string variable',
  'string punctuation.accessor',
  'string keyword'
)


S.from(BASE.lighten(0.15)).add(
  'meta.objectliteral punctuation.definition',
  'meta.objectliteral meta.object-literal.key',
  'meta.class variable.object.property'
)

// markdown
S.from(BASE.lighten(0.15)).bold().add(
  'markup.bold'
)

// markdown
S.from(BASE.lighten(0.15)).italic().add(
  'markup.italic'
)

S.from(TYPES).add(
  'meta.type.annotation',
  'entity.name.type',
  'meta.return.type',
  'meta.type.parameters',
  'entity.other.inherited-class',
  'support.type',

  // markdown
  'markup.list beginning.punctuation'
)

S.from(TYPES.lighten(0.2)).add(
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

S.from(TYPES.darken(0.2)).add(
  'entity.name.type.class'
)

S.from(BASE).add(
  'meta.definition entity.name.function',
  'entity.name.function',
  'support.function',
  // markdown
  'markup.heading'
)

S.from(BASE.lighten(0.15)).add(
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


S.from(OPPOSITE.lighten(0.1)).add(
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

S.from(STRING.lighten(0.2)).add(
  'meta.link.inline.markdown',
  'meta.link.inline.markdown punctuation.definition.string',
  'meta.image.inline',
  'meta.image.inline punctuation.definition.string'
)

S.from(STRING.darken(0.3).saturate(0.3)).add(
  'string punctuation.definition.template-expression'
)

S.from(CONSTANT.lighten(0.15)).add(
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
