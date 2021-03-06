# Copyright (c) ppy Pty Ltd <contact@ppy.sh>. Licensed under the GNU Affero General Public License v3.0.
# See the LICENCE file in the repository root for full licence text.

import { BeatmapList } from './beatmap-list'
import { BigButton } from 'big-button'
import { Nominations } from './nominations'
import { Subscribe } from './subscribe'
import { UserFilter } from './user-filter'
import { BeatmapBasicStats } from 'beatmap-basic-stats'
import { BeatmapsetMapping } from 'beatmapset-mapping'
import HeaderV4 from 'header-v4'
import { PlaymodeTabs } from 'playmode-tabs'
import * as React from 'react'
import { a, div, h1, h2, p } from 'react-dom-factories'
import { getArtist, getTitle } from 'utils/beatmap-helper'
el = React.createElement

export class Header extends React.PureComponent
  componentDidMount: =>
    @updateChart()


  componentDidUpdate: =>
    @updateChart()


  componentWillUnmount: =>
    $(window).off '.beatmapDiscussionsOverview'


  render: =>
    el React.Fragment, null,
      el HeaderV4,
        theme: 'beatmapsets'
        titleAppend: el PlaymodeTabs,
          currentMode: @props.currentBeatmap.mode
          beatmaps: @props.beatmaps
          counts: @props.currentDiscussions.countsByPlaymode

      div
        className: 'osu-page'
        @headerTop()

      div
        className: 'osu-page osu-page--small'
        @headerBottom()


  headerBottom: =>
    bn = 'beatmap-discussions-header-bottom'

    div className: bn,
      div className: "#{bn}__content #{bn}__content--details",
        div className: "#{bn}__details #{bn}__details--full",
          el BeatmapsetMapping,
            beatmapset: @props.beatmapset
            user: @props.users[@props.beatmapset.user_id]

        div className: "#{bn}__details",
          el Subscribe, beatmapset: @props.beatmapset

        div className: "#{bn}__details",
          el BigButton,
            modifiers: ['full']
            text: osu.trans('beatmaps.discussions.beatmap_information')
            icon: 'fas fa-info'
            props:
              href: laroute.route('beatmapsets.show', beatmapset: @props.beatmapset.id)

      div className: "#{bn}__content #{bn}__content--nomination",
        el Nominations,
          beatmapset: @props.beatmapset
          currentDiscussions: @props.currentDiscussions
          currentUser: @props.currentUser
          discussions: @props.discussions
          events: @props.events
          users: @props.users


  headerTop: =>
    bn = 'beatmap-discussions-header-top'

    div
      className: bn

      div
        className: "#{bn}__content"
        style:
          backgroundImage: osu.urlPresence(@props.beatmapset.covers.cover)

        a
          className: "#{bn}__title-container"
          href: laroute.route('beatmapsets.show', beatmapset: @props.beatmapset.id)
          h1
            className: "#{bn}__title"
            getTitle(@props.beatmapset)
          h2
            className: "#{bn}__title #{bn}__title--artist"
            getArtist(@props.beatmapset)

        div
          className: "#{bn}__filters"

          div
            className: "#{bn}__filter-group"
            el BeatmapList,
              beatmapset: @props.beatmapset
              currentBeatmap: @props.currentBeatmap
              currentDiscussions: @props.currentDiscussions
              beatmaps: @props.beatmaps[@props.currentBeatmap.mode]

          div
            className: "#{bn}__filter-group #{bn}__filter-group--stats"
            el UserFilter,
              ownerId: @props.beatmapset.user_id
              selectedUser: if @props.selectedUserId? then @props.users[@props.selectedUserId] else null
              users: @props.discussionStarters

            div
              className: "#{bn}__stats"
              @stats()

        div className: 'u-relative',
          div ref: 'chartArea', className: "#{bn}__chart"

          div className: "#{bn}__beatmap-stats",
            el BeatmapBasicStats, beatmap: @props.currentBeatmap


  setFilter: (e) =>
    e.preventDefault()
    $.publish 'beatmapsetDiscussions:update', filter: e.currentTarget.dataset.type


  stats: =>
    bn = 'counter-box'

    for type in ['mine', 'mapperNotes', 'resolved', 'pending', 'praises', 'deleted', 'total']
      continue if type == 'deleted' && !@props.currentUser.is_admin

      topClasses = "#{bn} #{bn}--beatmap-discussions #{bn}--#{_.kebabCase(type)}"
      topClasses += ' js-active' if @props.mode != 'events' && @props.currentFilter == type

      total = 0
      for own _mode, discussions of @props.currentDiscussions.byFilter[type]
        total += _.size(discussions)

      a
        key: type
        href: BeatmapDiscussionHelper.url
          filter: type
          beatmapsetId: @props.beatmapset.id
          beatmapId: @props.currentBeatmap.id
          mode: @props.mode
        className: topClasses
        'data-type': type
        onClick: @setFilter

        div
          className: "#{bn}__content"
          div
            className: "#{bn}__title"
            osu.trans("beatmaps.discussions.stats.#{_.snakeCase(type)}")
          div
            className: "#{bn}__count"
            total

        div className: "#{bn}__line"


  updateChart: =>
    if !@_chart?
      area = @refs.chartArea
      length = @props.currentBeatmap.total_length * 1000

      @_chart = new BeatmapDiscussionsChart(area, length)

      $(window).on 'resize.beatmapDiscussionsOverview', @_chart.resize

    @_chart.loadData _.values(@props.currentDiscussions.byFilter[@props.currentFilter].timeline)
