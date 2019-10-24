const visit = require('unist-util-visit')

function plugin (options) {
  const opts = options || {}
  const expandFirst = opts.expandFirst

  function locator (value, fromIndex) {
    return value.indexOf('%[', fromIndex)
  }

  function inlineTokenizer (eat, value, silent) {
    const regex = new RegExp(/%\[[^\]]*]\(#(\d+)\)\n*/)
    const keep = regex.exec(value)

    if (silent) return silent
    if (!keep || keep.index !== 0) return

    const [matched, embed, reference] = keep

    return eat(matched)({
      type: 'embed',
      embed: embed,
      reference: reference,
      children: [
        {type: 'text', value: embed},
      ],
      data: {
        hName: 'embed',
        hProperties: {
          title: reference,
        },
      },
    });
  }

  function transformer (tree) {
    // const abbrs = {}
    // const emptyParagraphsToRemove = new Map()
    // //
    // // console.log('transform');
    // //
    // visit(tree, 'paragraph', find(abbrs, emptyParagraphsToRemove))
    // emptyParagraphsToRemove.forEach((indices, key) => {
    //   indices.reverse()
    //   indices.forEach((index) => {
    //     key.children.splice(index, 1)
    //   })
    // })
    //
    // visit(tree, replace(abbrs))
    return tree;
  }

  function find(abbrs, emptyParagraphsToRemove) {
    return function one (node, index, parent) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i]
        if (child.type !== 'embed') continue
        // Store abbr node for later use
        // abbrs[child.abbr] = child
        node.children.splice(i, 1)
        i -= 1
      }
      // Keep track of empty paragraphs to remove
      if (node.children.length === 0) {
        const indices = emptyParagraphsToRemove.get(parent) || []
        indices.push(index)
        emptyParagraphsToRemove.set(parent, indices)
      }
    }
  }

  function replace (abbrs) {
    console.log('replace');
    // function escapeRegExp (str) {
    //   return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&') // eslint-disable-line no-useless-escape
    // }

    // const pattern = Object.keys(abbrs).map(escapeRegExp).join('|')
    // const regex = new RegExp(`(\\b|\\W)(${pattern})(\\b|\\W)`)
    const expanded = {}

    function one (node, index, parent) {
      // if (Object.keys(abbrs).length === 0) return
      console.log(node)
      if (!node.children) return

      for (let c = 0; c < node.children.length; c++) {
        const child = node.children[c]
        console.log('-->', 'child', child)
        // if (node.type === 'embed' || child.type !== 'text') continue
        // if (!regex.test(child.value)) continue
        //
        // // Transform node
        // const newTexts = child.value.split(regex)
      }

      // If a text node is present in child nodes, check if an abbreviation is present
      // for (let c = 0; c < node.children.length; c++) {
      //   const child = node.children[c]
      //   if (node.type === 'embed' || child.type !== 'text') continue
      //   // if (!regex.test(child.value)) continue
      //   //
      //   // // Transform node
      //   // const newTexts = child.value.split(regex)
      //
      //   // Remove old text node
      //   node.children.splice(c, 1)
      //
      //   // Replace abbreviations
      //   for (let i = 0; i < newTexts.length; i++) {
      //     const content = newTexts[i]
      //     if (abbrs.hasOwnProperty(content)) {
      //       const abbr = abbrs[content]
      //       if (expandFirst && !expanded[content]) {
      //         node.children.splice(c + i, 0, {
      //           type: 'text',
      //           value: `${abbr.reference} (${abbr.abbr})`,
      //         })
      //         expanded[content] = true
      //       } else {
      //         node.children.splice(c + i, 0, abbr)
      //       }
      //     } else {
      //       node.children.splice(c + i, 0, {
      //         type: 'text',
      //         value: content,
      //       })
      //     }
      //   }
      // }
    }
    return one
  }

  inlineTokenizer.locator = locator

  const Parser = this.Parser

  // Inject inlineTokenizer
  const inlineTokenizers = Parser.prototype.inlineTokenizers
  const inlineMethods = Parser.prototype.inlineMethods
  inlineTokenizers.embed = inlineTokenizer
  inlineMethods.splice(0, 0, 'embed')

  const Compiler = this.Compiler
  if (Compiler) {
    const visitors = Compiler.prototype.visitors
    if (!visitors) return
    console.log('hasVisitors')

    const abbrMap = {}
    visitors.embed = (node) => {
      if (!abbrMap[node.embed]) {
        abbrMap[node.embed] = `*[${node.embed}]: ${node.reference}`
     }
      return `${node.embed}`
    }

    const originalRootCompiler = visitors.root
    visitors.root = function (node) {
      return `${originalRootCompiler.apply(this, arguments)}\n${Object.values(abbrMap).join('\n')}`
    }
  }
  return transformer
}

module.exports = plugin
