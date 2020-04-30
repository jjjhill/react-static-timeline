/*
  todo:
    determine API (props).
      events
      isInteractive  (optional | default true)
      onEventDisplay  (optional)
      onMouseLeave  (optional)
      popupEnabled  (optional | default true)
      customPopupContent  (optional)
      eventGap  (optional | default 15)
      timelineColor  (optional)
      popupDelay  (optional)
      popupBackgroundColor  (optional)

      event: {
        title: '', (optional - to display on default popup)
        summary: '', (optional - to display on default popup)
        start: { year: 0, month: [0-12] },
        end: { year: 0, month: [0-12] },
        color: '#hex', (optional)
      }
    propogate style prop to outermost div of Timeline.
*/

import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import './Timeline.css'

Timeline.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      start: PropTypes.shape({
        year: PropTypes.number.isRequired,
        month: PropTypes.number.isRequired
      }).isRequired,
      end: PropTypes.shape({
        year: PropTypes.number.isRequired,
        month: PropTypes.number.isRequired
      }).isRequired,
      title: PropTypes.string,
      summary: PropTypes.string,
      color: PropTypes.string
    })
  ).isRequired,
  isInteractive: PropTypes.bool,
  onEventDisplay: PropTypes.func,
  onMouseLeave: PropTypes.func,
  eventGap: PropTypes.number,
  timelineColor: PropTypes.string,
  popupEnabled: PropTypes.bool,
  popupBackgroundColor: PropTypes.string,
  popupDelay: PropTypes.number,
  popupWidth: PropTypes.number,
  customPopupContent: PropTypes.func,
  lineThickness: PropTypes.number,
  style: PropTypes.object
}

Timeline.defaultProps = {
  isInteractive: true,
  popupEnabled: true,
  onEventDisplay: () => {},
  onMouseLeave: () => {},
  customPopupContent: null,
  eventGap: 15,
  timelineColor: 'black',
  popupBackgroundColor: 'rgba(22, 22, 22, 0.4)',
  popupDelay: 100,
  popupWidth: 400,
  lineThickness: 6,
  style: {}
}

export default function Timeline(props) {
  const {
    events,
    isInteractive,
    popupEnabled,
    customPopupContent,
    eventGap,
    timelineColor,
    popupBackgroundColor,
    popupDelay,
    popupWidth,
    lineThickness
  } = props
  // seperated hoveredId and popupEventId. hoveredId for making the
  // hovering events more responsive. popupEventId for popup delay.
  const [hoveredId, setHoveredId] = useState(-1)
  const [popupEventId, setPopupEventId] = useState(-1)
  const [hoveredColor, setHoveredColor] = useState(null)
  const [firstYear, setFirstYear] = useState(null)
  const [lastYear, setLastYear] = useState(null)
  const [levels, setLevels] = useState([])
  const [containerHeight, setContainerHeight] = useState(0)
  const [open, setOpen] = useState(false)
  const [arrowPos, setArrowPos] = useState(50)
  const [popupPos, setPopupPos] = useState(50)
  const ref = useRef(null)

  const defaultColors = [
    '#f24f4f',
    '#ffff32',
    '#f79825',
    '#7cf4e6',
    '#ffa48e', 
    'bf00ff'
  ]
  let timeoutRef = useRef() // to persist across re-renders

  let hexToRgb = hex => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null
  }

  let intervalOverlaps = (event1, event2) => {
    let s1 = event1.start.year*12 + event1.start.month
    let s2 = event2.start.year*12 + event2.start.month
    let min = Math.min(s1,s2)
    s1-=min
    s2-=min
    let e1 = event1.end.year*12 + event1.end.month - min
    let e2 = event2.end.year*12 + event2.end.month - min
    // ensure s1 is <= s2 to make the boolean logic cleaner
    if (s2 < s1) {
      let tempS = s1
      let tempE = e1
      s1 = s2
      e1 = e2
      s2 = tempS
      e2 = tempE
    }
    return s2 >= s1 && s2 < e1
  }

  let eventHover = (i, leftPct, rightPct, color) => {
    if (!isInteractive) return //no op
    const openPopup = () => {
      setPopupEventId(i)
      let midPoint = (r+l)/2
      setArrowPos(midPoint)
      setOpen(true)
      props.onEventDisplay(i, l, r, color)
    }

    if (i === hoveredId) return
    let l = leftPct
    let r = 100-rightPct
    setHoveredId(i)
    setHoveredColor(color)
    if (!popupEnabled || popupDelay === 0) {
      openPopup()
      return
    }
    if (popupEventId < 0) {
      // eventId needs to be >=0 in order to show popup animation
      setPopupEventId(0)
      props.onEventDisplay(0, l, r, color)
    }
    if (open) setOpen(false)
    if(timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(openPopup, popupDelay)
  }

  let mouseLeave = () => {
    if (!isInteractive) return //no op
    setPopupEventId(-1)
    eventHover(-1)
    if (props.onMouseLeave) props.onMouseLeave()
  }

  useEffect(() => {
    let timelineWidth = ref.current ? ref.current.offsetWidth : 0
    let arrowPx = arrowPos/100*timelineWidth
    let minPx = popupWidth/2
    let maxPx = timelineWidth - popupWidth/2
    if (arrowPx < minPx) {
      setPopupPos(minPx/timelineWidth*100)
    }
    else if (arrowPx > maxPx) {
      setPopupPos(maxPx/timelineWidth*100)
    }
    else {
      setPopupPos(arrowPos)
    }
  }, [ref.current, arrowPos]);

  useEffect(() => {
    let conflicts = {}
    let fy, ly
    events.forEach((event, i, a) => {
      if (!fy || event.start.year <= fy) {
        fy = event.start.year
      }
      if (!ly || event.end.year >= ly) {
        ly = event.end.year
      }

      conflicts[i] = []
      for (let j=0; j < a.length; j++) {
        if (j===i) continue
        if (intervalOverlaps(event,a[j])) {
          conflicts[i].push(j)
        }
      }
    })

    setFirstYear(fy)
    setLastYear(ly)

    let order = Object.keys(conflicts).map(eventId => ({
      eventId: parseInt(eventId)
    })).sort((a,b) => {
      let eventA = events[a.eventId]
      let eventB = events[b.eventId]
      let spanA = (eventA.end.year*12+eventA.end.month) - (eventA.start.year*12+eventA.start.month)
      let spanB = (eventB.end.year*12+eventB.end.month) - (eventB.start.year*12+eventB.start.month)
      return spanA - spanB
    })

    let added = {}
    let levelsArray = [[]] // each level is array of eventIds
    let i = 0
    let loopCounter = 0

    while(order.length !== Object.keys(added).length) {
      loopCounter++
      if (loopCounter > 5000) {
        console.error(`react-static-timeline component must not be working with these parameters.
          The other option is you have over 5000 events on the timeline, which is not supported.
          Please submit an issue to https://github.com/jjjhill/react-static-timeline`)
        break
      }
      if (levelsArray.length-1 < i) levelsArray.push([])
      let nextToAdd = null
      for (let j=0; j < order.length; j++) {
        if (added[order[j].eventId]) continue
        if (!levelsArray[i].length) {
          nextToAdd = order[j].eventId
          break
        }
        let currId = order[j].eventId
        if (!levelsArray[i].some(event => {
          return conflicts[event].indexOf(currId) > -1
        })) {
          nextToAdd = order[j].eventId
          break
        }
      }
      if (nextToAdd !== null) {
        levelsArray[i].push(nextToAdd)
        added[nextToAdd] = true
        continue
      }
      i++
    }
    setLevels(levelsArray)
    setContainerHeight(levelsArray.length*eventGap + 21)
  }, [eventGap])


  let numYears = lastYear - firstYear + 1
  let totalMonths = numYears * 12
  let eventLines = []

  for (let i=0; i < levels.length; i++) {
    levels[i].forEach(eventId => {
      let event = events[eventId]
      let startN = (event.start.year - firstYear) * 12 + event.start.month
      let endN = (event.end.year - firstYear) * 12 + event.end.month
      let leftPct = (startN / totalMonths) * 100
      let rightPct = ((totalMonths - endN) / totalMonths) * 100

      let clr = event.color || defaultColors[eventId % defaultColors.length]
      let { r, g, b } = hexToRgb(clr)
      eventLines.push(
        <div
          key={eventId}
          className='event'
          style={{
            zIndex: 10-i,
            top: eventGap*(levels.length-i-1),
            left: leftPct + '%',
            right: rightPct + '%',
            borderTop: `solid ${lineThickness}px`,
            borderColor: `rgb(${r}, ${g}, ${b})`,
            backgroundColor:  hoveredId === eventId ? `rgba(${r},${g},${b},0.2)` : 'transparent'
          }}
          onMouseEnter={() => eventHover(eventId, leftPct, rightPct, clr)}
        />
      )
    })
  }

  let event = events[popupEventId]
  return (
    <div onMouseLeave={mouseLeave} ref={ref} style={{ fontFamily: 'sans-serif', ...props.style}}>
      { popupEnabled && popupEventId >= 0 && <div>
        <div
          className='speech-bubble'
          style={{
            left: popupPos+'%',
            backgroundColor: popupBackgroundColor,
            transform: open ? 'translateX(-50%) scale(1)' : 'translateX(-50%) scale(0)',
            width: popupWidth+'px',
            transition: `transform ${popupDelay}ms ease`
          }}
        >
          {customPopupContent ?
            customPopupContent() :
            (<div>
              <div className='line' style={{ backgroundColor: event.color || defaultColors[popupEventId % defaultColors.length] }} />
              <h1>{event.title}</h1>
              <p className='summary'>{event.summary}</p>
            </div>)
          }
        </div>
        <div
          className='arrow'
          style={{
            marginLeft: arrowPos+'%',
            transform: open ? 'translateX(-50%) scale(1)' : 'translateX(-50%) scale(0)',
            transition: `transform ${popupDelay}ms ease`
          }}
        />
      </div> }
      <div
        className='timeline'
        style={{ height: containerHeight }}
      >
        <div className='grid-lines' style={{ borderColor: timelineColor }}>
          {[...Array(numYears)].map((_, i) => (
            <div key={'seg' + i} className='major' style={{ borderColor: timelineColor }}>
              {[...Array(3)].map((_, j) => (
                <div key={'subSeg' + j} className='minor' style={{ borderColor: timelineColor }} />
              ))}
              <span
                className='year'
                style={{ color: timelineColor }}
              >{firstYear + i}</span>
            </div>
          ))}
        </div>
        {eventLines}
      </div>
    </div>
  )
}
