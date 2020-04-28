/*
  todo: initial open animation (currently isnt mounted so theres no initial scale(0).
    make popup there by default. set default width to something.
    set max width to 100% of container. allow custom popups.
    determine API (props). allow specified levels per event?
    propogate style prop to outermost div of Timeline.
*/

import React, { useState, useEffect, useRef } from 'react'
import './Timeline.css'

export default function Timeline(props) {
  const { events } = props
  // seperate hoveredId and popupEventId. hoveredId for making the
  // hovering events more responsive. popupEventId for popup delay.
  const [hoveredId, setHoveredId] = useState(-1)
  const [popupEventId, setPopupEventId] = useState(-1)
  const [hoveredColor, setHoveredColor] = useState(null)
  const [firstYear, setFirstYear] = useState(null)
  const [lastYear, setLastYear] = useState(null)
  const [levels, setLevels] = useState([])
  const [containerHeight, setContainerHeight] = useState(0)
  const [open, setOpen] = useState(false)
  const [arrowPos, setArrowPos] = useState('50')
  const [popupPos, setPopupPos] = useState('50')
  const popupWidth = 400
  const ref = useRef(null);

  //                      Red       yellow       orange     blue        pink    purple
  const defaultColors = ['#f24f4f', '#ffff32', '#f79825', '#7cf4e6', '#ffa48e', 'bf00ff']
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
    let s1 = event1.startYear*12 + event1.startMonth
    let s2 = event2.startYear*12 + event2.startMonth
    let min = Math.min(s1,s2)
    s1-=min
    s2-=min
    let e1 = event1.endYear*12 + event1.endMonth - min
    let e2 = event2.endYear*12 + event2.endMonth - min
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

  let eventHover = (i, l, r, color) => {
    if (i === hoveredId) return
    let leftPct = l
    let rightPct = 100-r
    setHoveredId(i)
    setHoveredColor(color)
    if (popupEventId < 0) {
      setPopupEventId(0)
      props.eventHover(0, leftPct, rightPct, color)
    }
    if (open) setOpen(false)
    if(timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setPopupEventId(i)
      let midPoint = leftPct+(rightPct-leftPct)/2
      setArrowPos(midPoint)
      setOpen(true)
      props.eventHover(i, leftPct, rightPct, color)
    }, 150)
  }

  let mouseLeave = () => {
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

    // console.log(arrowPos)
  }, [ref.current, arrowPos]);
  useEffect(() => {
    let conflicts = {}
    let fy, ly
    events.forEach((event, i, a) => {
      if (event.startMonth === 1) event.startMonth = 0
      if (!fy || event.startYear <= fy) {
        fy = event.startYear
      }
      if (!ly || event.endYear >= ly) {
        ly = event.endYear
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
    console.log(conflicts)

    let order = Object.keys(conflicts).map(eventId => ({
      eventId: parseInt(eventId),
      numConflicts: conflicts[eventId].length
    })).sort((a,b) => a.numConflicts - b.numConflicts)

    let added = {}
    let levelsArray = [[]] // each level is array of eventIds
    let i = 0
    let count = 0
    while(order.length !== Object.keys(added).length) {
      count++
      if (count > 1000) {
        console.log('react-static-timeline component must not be working ;(')
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
    setContainerHeight(levelsArray.length*15 + 21)
  }, [])


  let numYears = lastYear - firstYear + 1
  let totalMonths = numYears * 12
  let eventLines = []

  for (let i=0; i < levels.length; i++) {
    levels[i].forEach(eventId => {
      let event = events[eventId]
      let startN = (event.startYear - firstYear) * 12 + event.startMonth
      let endN = (event.endYear - firstYear) * 12 + event.endMonth
      let leftPct = (startN / totalMonths) * 100
      let rightPct = ((totalMonths - endN) / totalMonths) * 100

      let clr = event.color || defaultColors[eventId % defaultColors.length]
      let { r, g, b } = hexToRgb(clr)
      eventLines.push(
        <div
          key={event.title}
          className='event'
          style={{
            zIndex: 10-i,
            top: 15*(levels.length-i-1),
            left: leftPct + '%',
            right: rightPct + '%',
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
    <div onMouseLeave={mouseLeave} ref={ref}>
      { popupEventId >= 0 && <div>
        <div
          className='speech-bubble'
          style={{
            left: popupPos+'%',
            transform: open ? 'translateX(-50%) scale(1)' : 'translateX(-50%) scale(0)',
            width: popupWidth+'px'
          }}
        >
          {props.customPopupContent ?
            props.customPopupContent() :
            (<div>
              <div className='line' style={{ backgroundColor: event.color }} />
              <h1>{event.title}</h1>
              <p className='summary'>{event.summary}</p>
            </div>)
          }
        </div>
        <div
          className='arrow'
          style={{
            marginLeft: arrowPos+'%',
            transform: open ? 'translateX(-50%) scale(1)' : 'translateX(-50%) scale(0)'
          }}
        />
      </div> }
      <div
        className='timeline'
        style={{ height: containerHeight }}
      >
        <div className='grid-lines'>
          {[...Array(numYears)].map((_, i) => (
            <div key={'seg' + i} className='major'>
              {[...Array(3)].map((_, j) => (
                <div key={'subSeg' + j} className='minor' />
              ))}
              <span className='year'>{firstYear + i}</span>
            </div>
          ))}
        </div>
        {eventLines}
      </div>
    </div>
  )
}
