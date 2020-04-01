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

// import isHotkey from 'is-hotkey';
// import * as laroute from 'laroute';
import * as _ from 'lodash';
import * as React from 'react';
// import { createEditor, Editor as SlateEditor, Element as SlateElement, Node as SlateNode, NodeEntry, Range, Text, Transforms } from 'slate';
// import { withHistory } from 'slate-history';
// import { Editable, ReactEditor, RenderElementProps, RenderLeafProps, Slate, withReact } from 'slate-react';
import Draft, { AtomicBlockUtils, ContentBlock, Editor as DraftEditor, EditorState, RichUtils} from 'draft-js';
// import { BeatmapDiscussionReview, DocumentIssueEmbed } from '../interfaces/beatmap-discussion-review';
import EditorDiscussionComponent from './editor-discussion-component';
import { parseFromMarkdown } from './review-document';
import DraftEditorCommand = Draft.Model.Constants.DraftEditorCommand;
// import { SlateContext } from './slate-context';
import { stateToMarkdown } from 'draft-js-export-markdown';

const placeholder: string = '[{"children": [{"text": "placeholder"}], "type": "paragraph"}]';
let initialValue: string = placeholder;

// interface TimestampRange extends Range {
//   timestamp: string;
// }

interface Props {
  beatmaps: Beatmap[];
  beatmapset: Beatmapset;
  currentBeatmap: Beatmap;
  currentDiscussions: BeatmapDiscussion[];
  discussion?: BeatmapDiscussion;
  discussions: BeatmapDiscussion[];
  document?: string;
  editing?: boolean;
  editMode?: boolean;
  initialValue: string;
}

export default class Editor extends React.Component<Props, any> {
  editor = React.createRef<HTMLDivElement>();
  menu = React.createRef<HTMLDivElement>();
  menuBody = React.createRef<HTMLDivElement>();
  // slateEditor: ReactEditor;

  constructor(props: Props) {
    super(props);

    // this.slateEditor = this.withNormalization(withHistory(withReact(createEditor())));

    if (props.editMode) {
      this.state = {
        editorState: EditorState.createEmpty(),
        menuOffset: -1000,
        menuShown: false,
        value: [],
      };

      return;
    }

    const savedValue = localStorage.getItem(`newDiscussion-${this.props.beatmapset.id}`);
    if (savedValue) {
      initialValue = savedValue;
    }

    try {
      initialValue = JSON.parse(initialValue);
    } catch (error) {
      console.log('invalid json in localstorage, resetting');
      initialValue = JSON.parse(placeholder);
    }

    this.state = {
      editorState: EditorState.createEmpty(),
      menuOffset: -1000,
      menuShown: false,
      value: initialValue,
    };
  }

  // componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<any>, snapshot?: any): void {
  //   const editing = this.props.editing ?? false;
  //   if (editing !== (prevProps.editing ?? false)) {
  //     this.toggleEditMode(editing);
  //   }
  // }

  // decorate = (entry: NodeEntry) => {
  //   const node = entry[0];
  //   const path = entry[1];
  //   const ranges: TimestampRange[] = [];
  //
  //   if (!Text.isText(node)) {
  //     return ranges;
  //   }
  //
  //   const TS_REGEX = /\b((\d{2,}):([0-5]\d)[:.](\d{3})( \((?:\d[,|])*\d\))?)/;
  //   const regex = RegExp(TS_REGEX, 'g');
  //   let match;
  //
  //   // tslint:disable-next-line:no-conditional-assignment
  //   while ((match = regex.exec(node.text)) !== null) {
  //     if (match && match.index !== undefined) {
  //       ranges.push({
  //         anchor: {path, offset: match.index},
  //         focus: {path, offset: match.index + match[0].length},
  //         timestamp: match[0],
  //       });
  //     }
  //   }
  //
  //   return ranges;
  // }

  hideMenu = () => {
    if (!this.menuBody.current) {
      return;
    }

    this.setState({menuShown: false});
  }

  insertEmbed = (event: React.MouseEvent<HTMLElement>) => {
    const type = event.currentTarget.dataset.dtype;
    const beatmapId = this.props.currentBeatmap ? this.props.currentBeatmap.id : this.props.beatmaps[this.props.beatmapset.beatmaps[0].id];

    console.log('insertEmbed')

    const contentState = this.state.editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(
      'EMBED',
      'MUTABLE',
      {
        beatmapId,
        discussionType: type,
      },
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.set(
      this.state.editorState,
      {currentContent: contentStateWithEntity},
    );

    this.setState({
      editorState: AtomicBlockUtils.insertAtomicBlock(newEditorState, entityKey, ' '),
    });

    // Transforms.setNodes(this.slateEditor, {
    //   beatmapId,
    //   discussionType: type,
    //   type: 'embed',
    // });
  }

  log = () => console.dir(this.state.editorState);
  onChange = (editorState: EditorState) => this.setState({editorState});
  setEditor = (editor) => this.editor = editor;
  // onChange = (value: SlateNode[]) => {
  //   if (!this.props.editMode) {
  //     const content = JSON.stringify(value);
  //     localStorage.setItem(`newDiscussion-${this.props.beatmapset.id}`, content);
  //   }
  //
  //   this.setState({value}, () => {
  //     if (!ReactEditor.isFocused(this.slateEditor) && !this.state.menuShown) {
  //       this.setState({menuOffset: -1000});
  //
  //       return;
  //     }
  //
  //     const selection = window.getSelection();
  //     let menuOffset: number = -1000;
  //     if (selection && selection.anchorNode !== null) {
  //       const selectionTop = window.getSelection()?.getRangeAt(0).getBoundingClientRect().top ?? -1000;
  //       const editorTop = this.editor.current?.getBoundingClientRect().top ?? 0;
  //       menuOffset = selectionTop - editorTop - 5;
  //     } else {
  //       console.log('[explosion caught]', 'selection', selection, 'rangeCount', selection?.rangeCount);
  //     }
  //
  //     this.setState({menuOffset});
  //   });
  // }
  //
  // onKeyDown = (event: KeyboardEvent) => {
  //   if (isHotkey('mod+b', event)) {
  //     event.preventDefault();
  //     this.toggleMark('bold');
  //   } else if (isHotkey('mod+i', event)) {
  //     event.preventDefault();
  //     this.toggleMark('italic');
  //   }
  // }

  // post = () => {
  //   $.ajax(laroute.route('beatmapsets.discussion.review', {beatmapset: this.props.beatmapset.id}),
  //     {
  //       data: {
  //         document: this.serialize(),
  //       },
  //       method: 'POST',
  //     }).then(() => {
  //       this.resetInput();
  //   });
  // }
  // handleKeyCommand = (command: DraftEditorCommand, editorState: EditorState) => {
  //   const newState = RichUtils.handleKeyCommand(editorState, command);
  //
  //   if (newState) {
  //     this.onChange(newState);
  //
  //     return 'handled';
  //   }
  //
  //   return 'not-handled';
  // };

  render(): React.ReactNode {
    const editorClass = 'beatmap-discussion-editor';
    const modifiers = this.props.editMode ? ['edit-mode'] : undefined;

    return (
      <div ref={this.editor} className={osu.classWithModifiers(editorClass, modifiers)}>
        <div className={`${editorClass}__content`}>
          {/*<SlateContext.Provider*/}
          <div
            // value={this.slateEditor}
          >
            <div
              // {/*editor={this.slateEditor}*/}
              // {/*value={this.state.value}*/}
              // {/*onChange={this.onChange}*/}
            >
              <DraftEditor
                ref={this.setEditor}
                editorState={this.state.editorState}
                onChange={this.onChange}
                blockRendererFn={this.renderBlock}
                // handleKeyCommand={this.handleKeyCommand}
                // decorate={this.decorate}
                // onKeyDown={this.onKeyDown}
                // renderElement={this.renderElement}
                // renderLeaf={this.renderLeaf}
              />
              <div className={`${editorClass}__button-bar`}>
                <div className='post-box-toolbar'>
                    <button
                        className='btn-circle btn-circle--bbcode'
                        title='Bold'
                        type='button'
                        onClick={this.toggleBold}
                    >
                        <span className='btn-circle__content'>
                            <i className='fas fa-bold'/>
                        </span>
                    </button>
                    <button
                        className='btn-circle btn-circle--bbcode'
                        title='Italic'
                        type='button'
                        onClick={this.toggleItalic}
                    >
                        <span className='btn-circle__content'>
                            <i className='fas fa-italic'/>
                        </span>
                    </button>
                </div>
                <div className={`${editorClass}__button-bar-button`}>
                  <button type='button' className='btn-circle btn-circle--bbcode' data-dtype='suggestion' onClick={this.insertEmbed}>
                    <span className='beatmap-discussion-message-type beatmap-discussion-message-type--suggestion'><i className='far fa-circle'/></span>
                  </button>
                  <button type='button' className='btn-circle btn-circle--bbcode' data-dtype='problem' onClick={this.insertEmbed}>
                    <span className='beatmap-discussion-message-type beatmap-discussion-message-type--problem'><i className='fas fa-exclamation-circle'/></span>
                  </button>
                  <button type='button' className='btn-circle btn-circle--bbcode' data-dtype='praise' onClick={this.insertEmbed}>
                    <span className='beatmap-discussion-message-type beatmap-discussion-message-type--praise'><i className='fas fa-heart'/></span>
                  </button>
                  <button className='btn-osu-big btn-osu-big--forum-primary' type='submit' onClick={this.resetInput}>reset</button>
                  <button className='btn-osu-big btn-osu-big--forum-primary' type='submit' onClick={this.test}>test</button>
                  <button className='btn-osu-big btn-osu-big--forum-primary' type='submit' onClick={this.log}>log</button>
                  <button className='btn-osu-big btn-osu-big--forum-primary' type='submit' onClick={this.post}>post</button>
                </div>
              </div>
              <div
                className={`${editorClass}__menu`}
                ref={this.menu}
                style={{
                  left: '-13px',
                  position: 'absolute',
                  top: `${this.state.menuOffset}px`,
                }}
                onMouseEnter={this.showMenu}
                onMouseLeave={this.hideMenu}
              >
                <div className='forum-post-edit__button'><i className='fa fas fa-plus-circle' /></div>
                <div
                  className={`${editorClass}__menu-content`}
                  ref={this.menuBody}
                  style={{
                    display: this.state.menuShown ? 'block' : 'none',
                  }}
                >
                  <button type='button' className='btn-circle btn-circle--bbcode' data-dtype='suggestion' onClick={this.insertEmbed}>
                    <span className='beatmap-discussion-message-type beatmap-discussion-message-type--suggestion'><i className='far fa-circle'/></span>
                  </button>
                  <button type='button' className='btn-circle btn-circle--bbcode' data-dtype='problem' onClick={this.insertEmbed}>
                    <span className='beatmap-discussion-message-type beatmap-discussion-message-type--problem'><i className='fas fa-exclamation-circle'/></span>
                  </button>
                  <button type='button' className='btn-circle btn-circle--bbcode' data-dtype='praise' onClick={this.insertEmbed}>
                    <span className='beatmap-discussion-message-type beatmap-discussion-message-type--praise'><i className='fas fa-heart'/></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderBlock = (contentBlock: ContentBlock) => {
    if (contentBlock.getType() === 'atomic') {
      return {
        component: EditorDiscussionComponent,
        editable: true,
        props: {
          beatmapset: this.props.beatmapset,
          currentBeatmap: this.props.currentBeatmap,
          currentDiscussions: this.props.currentDiscussions,
          editMode: this.props.editMode,
          beatmaps: _.flatten(_.values(this.props.beatmaps)),
        },
      };
        // <EditorDiscussionComponent
        //   beatmapset={this.props.beatmapset}
        //   currentBeatmap={this.props.currentBeatmap}
        //   currentDiscussions={this.props.currentDiscussions}
        //   editMode={this.props.editMode}
        //   beatmaps={_.flatten(_.values(this.props.beatmaps))}
        // />
      );
    }
  };

  /*
  // renderElement = (props: RenderElementProps) => {
  //   switch (props.element.type) {
  //     case 'embed':
  //       return (
  //         <EditorDiscussionComponent
  //           beatmapset={this.props.beatmapset}
  //           currentBeatmap={this.props.currentBeatmap}
  //           currentDiscussions={this.props.currentDiscussions}
  //           editMode={this.props.editMode}
  //           beatmaps={_.flatten(_.values(this.props.beatmaps))}
  //           {...props}
  //         />
  //       );
  //     case 'link':
  //       return <a href={props.element.url} rel='nofollow'>{props.children}</a>;
  //     default:
  //       return <div {...props.attributes}>{props.children}</div>;
  //   }
  // }
  //
  // renderLeaf = (props: RenderLeafProps) => {
  //   let children = props.children;
  //   if (props.leaf.bold) {
  //     children = <strong>{children}</strong>;
  //   }
  //
  //   if (props.leaf.italic) {
  //     children = <em>{children}</em>;
  //   }
  //
  //   if (props.leaf.timestamp) {
  //     // TODO: fix this nested stuff
  //     return <span className={'beatmapset-discussion-message'} {...props.attributes}><span className={'beatmapset-discussion-message__timestamp'}>{children}</span></span>;
  //   }
  //
  //   return (
  //     <span {...props.attributes}>{children}</span>
  //   );
  // }
*/
  resetInput = (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
    }

    this.setState({
      value: JSON.parse(placeholder),
    });
  };

  serialize = (): string => {
    // const review: BeatmapDiscussionReview = [];
    //
    // this.state.value.forEach((node: SlateNode) => {
    //   switch (node.type) {
    //     case 'paragraph':
    //       const childOutput: string[] = [];
    //       const currentMarks = {
    //         bold: false,
    //         italic: false,
    //       };
    //
    //       node.children.forEach((child: SlateNode) => {
    //         if (child.text !== '') {
    //           if (currentMarks.bold !== (child.bold ?? false)) {
    //             currentMarks.bold = child.bold;
    //             childOutput.push('**');
    //           }
    //
    //           if (currentMarks.italic !== (child.italic ?? false)) {
    //             currentMarks.italic = child.italic;
    //             childOutput.push('*');
    //           }
    //         }
    //
    //         childOutput.push(child.text.replace('*', '\\*'));
    //       });
    //
    //       // ensure closing of open tags
    //       if (currentMarks.bold) {
    //         childOutput.push('**');
    //       }
    //       if (currentMarks.italic) {
    //         childOutput.push('*');
    //       }
    //
    //       review.push({
    //         text: childOutput.join(''),
    //         type: 'paragraph',
    //       });
    //
    //       currentMarks.bold = currentMarks.italic = false;
    //       break;
    //
    //     case 'embed':
    //       const doc: DocumentIssueEmbed = {
    //         beatmap_id: node.beatmapId,
    //         discussion_type: node.discussionType,
    //         text: node.children[0].text,
    //         timestamp: node.timestamp ? BeatmapDiscussionHelper.parseTimestamp(node.timestamp) : null,
    //         type: 'embed',
    //       };
    //
    //       if (node.discussionId) {
    //         doc.discussion_id = node.discussionId;
    //       }
    //
    //       review.push(doc);
    //       break;
    //   }
    // });
    //
    // return JSON.stringify(review);
    return stateToMarkdown(this.state.editorState.getCurrentContent());
  };

  showMenu = () => {
    if (!this.menuBody.current) {
      return;
    }
    this.setState({menuShown: true});
  };

  test = () => console.dir(this.serialize());

  toggleBold = () => {
    this.toggleMark('bold');
  }

  toggleEditMode = (enabled: boolean) => {
    if (!this.props.document || !this.props.discussions || _.isEmpty(this.props.discussions)) {
      return;
    }

    if (enabled) {
      this.setState({
        value: parseFromMarkdown(this.props.document, this.props.discussions),
      });
    }
  }

  toggleItalic = () => {
    this.toggleMark('italic');
  }

  toggleMark = (format: string) => {
    let newState: EditorState = this.state.editorState;

    switch (format) {
      case 'bold':
        newState = RichUtils.toggleInlineStyle(this.state.editorState, 'BOLD');
        break;
      case 'italic':
        newState = RichUtils.toggleInlineStyle(this.state.editorState, 'ITALIC');
        break;
    }

    this.onChange(newState);
  }

  // withNormalization = (editor: ReactEditor) => {
  //   const { normalizeNode } = editor;
  //
  //   editor.normalizeNode = (entry) => {
  //     const [node, path] = entry;
  //
  //     if (SlateElement.isElement(node) && node.type === 'embed') {
  //       for (const [child, childPath] of SlateNode.children(editor, path)) {
  //         // ensure embeds only have a single child
  //         if (SlateElement.isElement(child) && !editor.isInline(child)) {
  //           Transforms.unwrapNodes(editor, { at: childPath });
  //
  //           return;
  //         }
  //
  //         // clear formatting from content within embeds
  //         if (child.bold || child.italic) {
  //           Transforms.unsetNodes(
  //             editor,
  //             ['bold', 'italic'],
  //             { at: childPath },
  //           );
  //
  //           return;
  //         }
  //
  //         // clear invalid beatmapId references (for pasted embed content)
  //         if (node.beatmapId && !this.props.beatmaps[node.beatmapId]) {
  //           Transforms.setNodes(editor, {beatmapId: null}, {at: path});
  //         }
  //       }
  //     }
  //
  //     // ensure the last node is always a paragraph, (otherwise it becomes impossible to insert a normal paragraph after an embed)
  //     if (editor.children.length > 0) {
  //       const lastNode = editor.children[editor.children.length - 1];
  //       if (lastNode.type === 'embed') {
  //         const paragraph = {type: 'paragraph', children: [{text: ''}]};
  //         Transforms.insertNodes(editor, paragraph, {at: SlateEditor.end(editor, [])});
  //
  //         return;
  //       }
  //     }
  //
  //     return normalizeNode(entry);
  //   };
  //
  //   return editor;
  // }
}
