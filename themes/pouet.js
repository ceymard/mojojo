
const fs = require('fs')
const y = require('js-yaml')

var base = y.load(fs.readFileSync('mojo.yml', 'utf-8'))

// console.log(base)

function unescape(val) {
  return (val||'').toString().replace(/_([\w\d]{3,8})/g, m => '#' + m.slice(1))
}

function dct(val, _) {
  _ = _ || ''
  if (typeof val === 'string' || !val || typeof val !== 'object')
    return `${_}<string>${unescape(val)}</string>\n`

  var res = `${_}<dict>\n`
  for (var x in val) {
    res += `${_}  <key>${x}</key>\n`
    res += dct(val[x], _ + '  ')
  }
  res += `${_}</dict>\n`
  return res
}

var scopes = []
for (var scope in base.scopes) {
  var vals = scope.split(' ')
  var settings = {}
  var spec = {settings: settings}

  while (['italic', 'underline', 'bold'].indexOf(vals[0]) !== -1) {
    settings.fontStyle = vals[0]
    vals = vals.slice(1)
  }

  settings.foreground = unescape(vals[0])
  if (vals[1])
    settings.background = unescape(vals[1])
  else
    settings.background = unescape(vals[0] + 'a0')

  spec.scope = base.scopes[scope].join(', ')
  spec.name = '...'

  scopes.push(spec)
}

var res = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist
  PUBLIC '-//Apple//DTD PLIST 1.0//EN'
  'http://www.apple.com/DTDs/PropertyList-1.0.dtd'>
<plist version="1.0">
  <dict>
    <key>name</key>
    <string>${base.name}</string>
    <key>comment</key>
    <string>${base.comment || ''}</string>
    <key>settings</key>
    <array>
${dct({settings: base.settings}, '      ')}
${scopes.map(s => dct(s, '      ')).join('\n')}
    </array>
  </dict>
</plist>
`

console.log(res)
fs.writeFileSync('mojo.tmTheme', res, {encoding: 'utf-8'})
