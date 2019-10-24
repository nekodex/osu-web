function plugin() {
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
      reference: reference,
      children: [
        {type: 'text', value: embed},
      ],
      data: {
        discussion_id: embed,
      },
    });
  }

  const Parser = this.Parser
  const inlineTokenizers = Parser.prototype.inlineTokenizers
  const inlineMethods = Parser.prototype.inlineMethods

  // Inject inlineTokenizer
  inlineTokenizer.locator = locator;
  inlineTokenizers.embed = inlineTokenizer;
  inlineMethods.splice(0, 0, 'embed');
}

module.exports = plugin
