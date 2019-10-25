/**
 *    Copyright (c) ppy Pty Ltd <contact@ppy.sh>.
 *
 *    This file is part of osu!web. osu!web is distributed with the hope of
 *    attracting more community contributions to the core ecosystem of osu!.
 *
 *    osu!web is free software: you can redistribute it and/or modify
 *    it under the terms of the Affero GNU General Public License version 3
 *    as published by the Free Software Foundation.
 *
 *    osu!web is distributed WITHOUT ANY WARRANTY; without even the implied
 *    warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *    See the GNU Affero General Public License for more details.
 *
 *    You should have received a copy of the GNU Affero General Public License
 *    along with osu!web.  If not, see <http://www.gnu.org/licenses/>.
 */
import { Editor as SlateEditor, Node } from 'slate';

const EditorPluginTimestamp = () => ({
  normalizeNode: (node: Node, editor: SlateEditor, next: () => void) => {
    // if (node.type) {
    //   switch (node.type) {
    //     case 'timestamp':
    //       console.log('normalize', node);
    //       break;
    //   }
    // }
    return next();
  },

  onKeyDown: (event: KeyboardEvent, editor: SlateEditor, next: () => any) => {
    const TS_REGEX = /\b((\d{2,}):([0-5]\d)[:.](\d{3})( \((?:\d[,|])*\d\))?)/;
    console.log(editor, event.key, editor.value);

    let current = editor.value.focusBlock.text;

    // handle breaking timestamps when backspacing into them
    if (event.key === 'Backspace') {
      editor.moveFocusBackward(1);
      editor.unwrapInline('timestamp');
      current = current.slice(0, current.length - 1);
      // editor.moveFocusForward(1);
      // return next();
    }

    // isPrintableChar
    if (event.key.length === 1) {
      current += event.key;
    }

    console.log('focusBlock.text', current, editor.value.focusBlock.text);

    const matches = current.match(TS_REGEX);
    if (matches && matches.index !== undefined) {
      console.log('match', matches, event.key, editor.value.anchorInline ? editor.value.anchorInline.type : null);
      if (editor.value.anchorInline && editor.value.anchorInline.type === 'timestamp') {
        return next();
      }

      if (event.key.length === 1) {
        event.preventDefault();
        editor.insertText(event.key);
      }

      const cursorPos = editor.value.selection.anchor;
      // debugger
      console.log('offset', cursorPos);
      // editor.anchor

      editor.moveAnchorTo(matches.index);
      editor.moveFocusTo(matches.index + matches[0].length);
      editor.unwrapInline('timestamp'); // remove existing timestamps
      editor.wrapInline({type: 'timestamp', data: {lastWord: current}}); // set timestamp inline
      // editor.moveTo(cursorPos.path);
      editor.moveTo(cursorPos.offset + 1); // deselect it
    }

    return next();
    // event.preventDefault();
  }
});

export default EditorPluginTimestamp;
