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

import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

type DiscussionType = 'hype' | 'mapperNote' | 'praise' | 'problem' | 'suggestion';
const selectableTypes: DiscussionType[] = ['praise', 'problem', 'suggestion'];

export default class EditorIssueTypeSelector extends React.Component<any, any> {
  portal: HTMLDivElement;
  private readonly topRef: React.RefObject<HTMLDivElement>;

  constructor(props: {}) {
    super(props);

    this.portal = document.createElement('div');
    document.body.appendChild(this.portal);
    this.topRef = React.createRef<HTMLDivElement>();

    this.state = {
      visible: false,
    };
  }

  componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any): void {
    this.syncBlackout();

    if (!this.topRef.current) {
      return;
    }

    const position = $(this.topRef.current).offset();
    if (!position) {
      return;
    }

    const { top, left } = position;
    this.portal.style.position = 'absolute';
    this.portal.style.top = `${Math.floor(top + this.topRef.current.offsetHeight)}px`;
    this.portal.style.left = `${Math.floor(left)}px`;
  }

  render(): React.ReactNode {
    const type: DiscussionType = this.props.node.data.get('type');
    const icons = {
      hype: 'fas fa-bullhorn',
      mapperNote: 'far fa-sticky-note',
      praise: 'fas fa-heart',
      problem: 'fas fa-exclamation-circle',
      suggestion: 'far fa-circle',
    };

    return (
      <React.Fragment>
        <a href='#' className='beatmap-discussion-timestamp__icons' onClick={this.toggleMenu} contentEditable={false} {...this.props.attributes} ref={this.topRef}>
          <div className='beatmap-discussion-timestamp__icon'>
            <span className={`beatmap-discussion-message-type beatmap-discussion-message-type--${type}`}><i className={icons[type]} /></span>
          </div>
        </a>
        {this.state.visible && this.renderList()}
      </React.Fragment>
    );
  }

  renderList = () => {
    return ReactDOM.createPortal(
      (
        <div className='beatmap-discussion-newer__dropdown-menu' contentEditable={false}>
          {selectableTypes.map((type: DiscussionType) => this.renderListItem(type))}
        </div>
      ), this.portal);
  }

  renderListItem = (type: DiscussionType) => {
    const menuItemClasses = 'beatmap-discussion-newer__dropdown-menu-item';
    const icons = {
      hype: 'fas fa-bullhorn',
      mapperNote: 'far fa-sticky-note',
      praise: 'fas fa-heart',
      problem: 'fas fa-exclamation-circle',
      suggestion: 'far fa-circle',
    };

    return (
      <a
        href='#'
        className={menuItemClasses}
        key={type}
        data-type={type}
        onClick={this.select}
      >
        <div
          style={{
            paddingLeft: '5px',
          }}
        >
          <span className={`beatmap-discussion-message-type beatmap-discussion-message-type--${type}`} style={{paddingRight: '5px'}}><i className={icons[type]} /></span>
          {type}
        </div>
      </a>
    );
  }

  select = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();

    const target = event.currentTarget as HTMLElement;

    if (!target) {
      return;
    }

    const type = target.dataset.type;
    this.setState({visible: false}, () => {
      const {editor, node} = this.props;
      const data = node.data.merge({ type });
      editor.setNodeByKey(node.key, {data});
    });
  }

  syncBlackout = () => {
    // Blackout.toggle(this.state.visible, 0.5);
  }

  toggleMenu = (event: Event) => {
    event.preventDefault();
    this.setState({
      visible: !this.state.visible,
    });
  }
}
