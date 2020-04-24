// Copyright (c) ppy Pty Ltd <contact@ppy.sh>. Licensed under the GNU Affero General Public License v3.0.
// See the LICENCE file in the repository root for full licence text.

import * as React from 'react';
import { Path, Transforms } from 'slate';
import { RenderElementProps } from 'slate-react';
import { ReactEditor } from 'slate-react';
import EditorBeatmapSelector from './editor-beatmap-selector';
import EditorIssueTypeSelector from './editor-issue-type-selector';
import { SlateContext } from './slate-context';

interface Props extends RenderElementProps {
  // attributes taken from RenderElementProps, but extended with contentEditable
  attributes: {
    contentEditable?: boolean;
    'data-slate-inline'?: true;
    'data-slate-node': 'element';
    'data-slate-void'?: true;
    dir?: 'rtl';
    ref: any;
  };
  beatmaps: Beatmap[];
  beatmapset: Beatmapset;
  currentBeatmap: Beatmap;
  currentDiscussions: BeatmapDiscussion[];
  discussionId?: number;
  editMode?: boolean;
}

export default class EditorDiscussionComponent extends React.Component<Props> {
  static contextType = SlateContext;

  componentDidMount = () => {
    // reset timestamp to null on clone
    Transforms.setNodes(this.context, {timestamp: null}, {at: this.path()});
  }

  componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<{}>, snapshot?: any): void {
    const path = this.path();

    if (this.props.element.beatmapId !== 'all') {
      const content = this.props.element.children[0].text;
      const TIMESTAMP_REGEX = /((\d{2,}):([0-5]\d)[:.](\d{3}))(\s\((?:\d[,|])*\d\))?/;
      const matches = content.match(TIMESTAMP_REGEX);
      let timestamp = null;

      if (matches !== null) {
        timestamp = matches[1];
      }

      Transforms.setNodes(this.context, {timestamp}, {at: path});
    } else {
      Transforms.setNodes(this.context, {timestamp: null}, {at: path});
    }
  }

  delete = () => {
    Transforms.delete(this.context, { at: this.path() });
  }

  path = (): Path => ReactEditor.findPath(this.context, this.props.element);

  readOnly = () => {
    return this.props.editMode && this.props.element.discussionId;
  }

  render(): React.ReactNode {
    const bn = 'beatmap-discussion-review-post-embed-preview';
    const attribs = this.props.attributes;
    const canEdit = !this.readOnly();

    const deleteButton =
      (
        <button
          className={`${bn}__delete`}
          onClick={this.delete}
          contentEditable={false}
          title={osu.trans(`beatmaps.discussions.review.embed.${canEdit ? 'delete' : 'unlink'}`)}
        >
          <i className={`fas fa-${canEdit ? 'trash-alt' : 'link'}`} />
        </button>
      );

    const extraClasses = [];
    if (!canEdit) {
      attribs.contentEditable = false;
      extraClasses.push('read-only');
    }

    return (
      <div className='beatmap-discussion beatmap-discussion--preview' {...attribs}>
        <div className='beatmap-discussion__discussion'>
          <div className={osu.classWithModifiers(bn, extraClasses)}>
            <div className={`${bn}__content`}>
              <div
                className={`${bn}__selectors`}
                contentEditable={false} // workaround for slatejs 'Cannot resolve a Slate point from DOM point' nonsense
              >
                <EditorBeatmapSelector {...this.props} disabled={!canEdit}/>
                <EditorIssueTypeSelector {...this.props} disabled={!canEdit}/>
                <div
                  className={`${bn}__timestamp`}
                  contentEditable={false} // workaround for slatejs 'Cannot resolve a Slate point from DOM point' nonsense
                >
                  {this.props.element.timestamp || osu.trans('beatmap_discussions.timestamp_display.general')}
                </div>
                <div
                  contentEditable={false} // workaround for slatejs 'Cannot resolve a Slate point from DOM point' nonsense
                  className={`${bn}__stripe`}
                />
              </div>
              <div className={`${bn}__message-container`}>
                <div className='beatmapset-discussion-message'>{this.props.children}</div>
              </div>
              {this.props.editMode && canEdit &&
                <div
                  className={`${bn}__unsaved-indicator`}
                  contentEditable={false} // workaround for slatejs 'Cannot resolve a Slate point from DOM point' nonsense
                  title={osu.trans('beatmaps.review.embed.unsaved')}
                >
                  <i className='fas fa-pencil-alt'/>
                </div>
              }
            </div>
          </div>
        </div>
        {deleteButton}
      </div>
    );
  }
}