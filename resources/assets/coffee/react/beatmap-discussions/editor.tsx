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

import isHotkey from 'is-hotkey';
import * as laroute from 'laroute';
import * as _ from 'lodash';
import * as React from 'react';
import { SchemaProperties, Value } from 'slate';
import { Editor as SlateEditor } from 'slate';
import {
  Editor as SlateReactEditor,
  findDOMNode,
  RenderBlockProps,
  RenderInlineProps,
  RenderMarkProps,
} from 'slate-react';
import EditorDiscussionComponent from './editor-discussion-component';

let initialValue: string = '{"document":{"nodes":[{"object":"block","type":"paragraph","nodes":[{"object":"text","text":"This is a placeholder."}]}]}}';

const schema: SchemaProperties = {
  blocks: {
    embed: {
      // nodes: (object, match) => {
      //   console.log('validlidd', object, match);
      //   return true;
      // },
    },
    // {
    //   marks: [],
    //   nodes: [{
    //     marks: [],
    //     match: [{
    //       object: 'text',
    //       marks: [],
    //     }]
    //   }],
    // },
  },
  document: {
    marks: [
      {type: 'bold'},
      {type: 'italic'},
    ],
    nodes: [{
      match: [
        {type: 'embed'},
        {type: 'paragraph'},
      ],
    }],
  },
  inlines: {
    timestamp: {
      nodes: [{
        match: { object: 'text' },
      }],
    },
  },
};

export default class Editor extends React.Component<any, any> {
  editor = React.createRef<SlateReactEditor>();
  menu = React.createRef<HTMLDivElement>();
  menuBody = React.createRef<HTMLDivElement>();
  plugins = [];

  constructor(props: {}) {
    super(props);

    const savedValue = localStorage.getItem(`newDiscussion-${this.props.beatmapset.id}`);
    if (savedValue) {
      initialValue = savedValue;
    }

    this.state = {
      menuOffset: -1000,
      menuShown: false,
      value: Value.fromJSON(JSON.parse(initialValue)),
    };
  }

  buttan = (event: React.MouseEvent<HTMLElement>, type: string) => {
    event.preventDefault();

    if (!this.editor.current) {
      return;
    }

    this.editor.current
      .focus()
      .moveToStart()
      .insertBlock({
        type: 'embed',

        data: {
          beatmapId: this.props.currentBeatmap.id,
          type,
        },
      });
  }

  hideMenu = (e: React.MouseEvent<HTMLElement>) => {
    if (!this.menuBody.current) {
      return;
    }
    this.setState({menuShown: false});
  }

  // test = () => {
  //   let output = [];
  //   const whee = this.state.value.toJSON().document.nodes;
  //
  //   whee.forEach((node) => {
  //     switch (node.type) {
  //       case 'paragraph':
  //         const temp: string[] = [];
  //         node.nodes.forEach((child) => {
  //           let marks: string[] = [];
  //           child.marks.forEach((mark) => {
  //             switch (mark.type) {
  //               case 'bold':
  //                 marks.push('**');
  //                 break;
  //               case 'italic':
  //                 marks.push('*');
  //                 break;
  //             }
  //           });
  //           temp.push([marks.join(''), child.text, marks.reverse().join('')].join(''));
  //         });
  //         output.push(temp.join('') + '\n');
  //         break;
  //       case 'embed':
  //         output.push('[embed goes here]\n');
  //         break;
  //     }
  //   });
  //
  //   console.log(output.join(''));
  // }

  log = () => console.log(this.state.value.toJSON());

  onChange = ({ value }: { value: Value }) => {
    const content = JSON.stringify(value.toJSON());
    localStorage.setItem(`newDiscussion-${this.props.beatmapset.id}`, content);

    this.setState({value}, () => {
      if (!this.editor.current) {
        return;
      }

      if (!this.editor.current.value.selection.isFocused && !this.state.menuShown) {
        this.setState({menuOffset: -1000});
        return;
      }

      let menuOffset: number = 0;
      if (this.editor.current && this.editor.current.value.anchorBlock) {
        const node = findDOMNode(this.editor.current.value.anchorBlock.key) as HTMLElement;
        menuOffset = node.offsetTop + (node.offsetHeight / 2);
        this.setState({menuOffset});
      }
    });
  }

  onKeyDown = (event: KeyboardEvent, editor: SlateEditor, next: () => any) => {
    let mark;

    if (editor.value.anchorBlock.type === 'embed') {
      return next();
    }

    if (isHotkey('mod+b', event)) {
      mark = 'bold';
    } else if (isHotkey('mod+i', event)) {
      mark = 'italic';
    } else {
      return next();
    }

    event.preventDefault();
    editor.toggleMark(mark);
  }

  post = () => {
    const data = this.state.value.toJSON();

    $.ajax(laroute.route('beatmap-discussion-posts.review'),
      {
        data: {
          beatmapset_id: this.props.beatmapset.id,
          document: JSON.stringify(data),
        },
        method: 'POST',
      });
  }

  toggleMark = (type: string) => {
    if (!this.editor.current) {
      return;
    }

    this.editor.current.toggleMark(type);
  }

  toggleItalic = () => {
    this.toggleMark('italic');
  }

  toggleBold = () => {
    this.toggleMark('bold');
  }

  render(): React.ReactNode {
    const cssClasses = 'beatmap-discussion-new-float';
    const bn = 'beatmap-discussion-newer';

    return (
      <div className={cssClasses}>
        <div className='beatmap-discussion-new-float__floatable beatmap-discussion-new-float__floatable--pinned'>
          <div className='beatmap-discussion-new-float__content'>
            <div className='osu-page osu-page--small'>
              <div className={bn}>
                <div className='page-title'>{osu.trans('beatmaps.discussions.new.title')}</div>
                <div className={`${bn}__content`}>
                  <SlateReactEditor
                    value={this.state.value}
                    onChange={this.onChange}
                    onKeyDown={this.onKeyDown}
                    plugins={this.plugins}
                    renderBlock={this.renderBlock}
                    renderInline={this.renderInline}
                    renderMark={this.renderMark}
                    ref={this.editor}
                    schema={schema}
                  />
                  <div className='forum-post-edit__buttons-bar'>
                    <div className='forum-post-edit__buttons forum-post-edit__buttons--toolbar'>
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
                    </div>
                    <div className='forum-post-edit__buttons forum-post-edit__buttons--actions'>
                        <div className='forum-post-edit__button'>
                            <button className='btn-osu-big btn-osu-big--forum-primary' type='submit' onClick={this.log}>log</button>
                          <button className='btn-osu-big btn-osu-big--forum-primary' type='submit' onClick={this.post}>post</button>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`${bn}__menu`}
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
                      className={`${bn}__menu-content`}
                      ref={this.menuBody}
                      style={{
                        display: this.state.menuShown ? 'block' : 'none',
                      }}
                    >
                      <button type='button' className='btn-circle btn-circle--bbcode' onClick={(event) => this.buttan(event, 'suggestion')}>
                        <span className='beatmap-discussion-message-type beatmap-discussion-message-type--suggestion'><i className='far fa-circle'/></span>
                      </button>
                      <button type='button' className='btn-circle btn-circle--bbcode' onClick={(event) => this.buttan(event, 'problem')}>
                        <span className='beatmap-discussion-message-type beatmap-discussion-message-type--problem'><i className='fas fa-exclamation-circle'/></span>
                      </button>
                      <button type='button' className='btn-circle btn-circle--bbcode' onClick={(event) => this.buttan(event, 'praise')}>
                        <span className='beatmap-discussion-message-type beatmap-discussion-message-type--praise'><i className='fas fa-heart'/></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderBlock = (props: RenderBlockProps, editor: SlateEditor, next: () => any) => {
    switch (props.node.type) {
      case 'embed':
        return (
          <EditorDiscussionComponent
            beatmapset={this.props.beatmapset}
            currentBeatmap={this.props.currentBeatmap}
            currentDiscussions={this.props.currentDiscussions}
            beatmaps={_.flatten(_.values(this.props.beatmaps))}
            {...props}
          />
        );
      default:
        return next();
    }
  }

  renderInline = (props: RenderInlineProps, editor: SlateEditor, next: () => any) => {
    const { node, attributes, children } = props;
    switch (node.type) {
      case 'timestamp': {
        return (
          <span className='beatmapset-discussion-message' {...attributes}>
            <a href={`osu:\/\/edit\/${node.data.get('lastWord')}`} className='beatmapset-discussion-message__timestamp'>
              {children}
            </a>
          </span>
        );
      }
      default:
        return next();
    }
  }

  renderMark = (props: RenderMarkProps, editor: SlateEditor, next: () => any) => {
    const { children, mark, attributes } = props;

    switch (mark.type) {
      case 'bold':
        return <strong {...attributes}>{children}</strong>;
      case 'italic':
        return <em {...attributes}>{children}</em>;
      default:
        return next();
    }
  }

  showMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (!this.menuBody.current) {
      return;
    }
    this.setState({menuShown: true});
  }
}
