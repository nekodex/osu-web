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

import * as React from 'react';
import { Transforms } from 'slate';
import { RenderElementProps } from 'slate-react';
import { ReactEditor } from 'slate-react';
import EditorBeatmapSelector from './editor-beatmap-selector';
import EditorIssueTypeSelector from './editor-issue-type-selector';
import { SlateContext } from './slate-context';

interface Props extends RenderElementProps {
  beatmaps: Beatmap[];
  beatmapset: Beatmapset;
  currentBeatmap: Beatmap;
  currentDiscussions: BeatmapDiscussion[];
}

export default class EditorDiscussionComponent extends React.Component<Props> {
  static contextType = SlateContext;

  remove = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    const path = ReactEditor.findPath(this.context, this.props.element);
    Transforms.delete(this.context, { at: path });
  }

  render(): React.ReactNode {
    return (
      <div className='beatmap-discussion beatmap-discussion--preview' {...this.props.attributes}>
        <div className='beatmap-discussion__discussion'>
          <div className='beatmap-discussion-post beatmap-discussion-post--reply'>
            <div className='beatmap-discussion-post__content'>
              <EditorBeatmapSelector {...this.props}/>
              <div className='beatmap-discussion-post__user-container' style={{userSelect: 'none'}} contentEditable={false}>
                <div className='beatmap-discussion-timestamp__icons-container' style={{marginRight: '10px'}}>
                  <EditorIssueTypeSelector {...this.props}/>
                  <div className='beatmap-discussion-timestamp__text'>00:00.184</div>
                </div>
                <div className='beatmap-discussion-post__user-stripe'/>
              </div>
              <div className='beatmap-discussion-post__message-container'>
                <div className='beatmapset-discussion-message'>{this.props.children}</div>
                <div className='beatmap-discussion-post__actions' style={{userSelect: 'none'}} contentEditable={false}>
                  <div className='beatmap-discussion-post__actions-group'>
                    <a
                      className='beatmap-discussion-post__action beatmap-discussion-post__action--button'
                      href='#'
                      onClick={this.remove}
                    >
                      delete
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}