import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import './Timeline.css'

Timeline.propTypes = {
  items: PropTypes.arrayOf(
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
  numSegments: PropTypes.number,
  isInteractive: PropTypes.bool,
  onItemDisplay: PropTypes.func,
  onMouseLeave: PropTypes.func,
  verticalGap: PropTypes.number,
  timelineColor: PropTypes.string,
  popupEnabled: PropTypes.bool,
  popupBackgroundColor: PropTypes.string,
  popupDelay: PropTypes.number,
  popupWidth: PropTypes.number,
  customPopupContent: PropTypes.element,
  lineThickness: PropTypes.number,
  style: PropTypes.object
}

Timeline.defaultProps = {
  numSegments: 3,
  isInteractive: true,
  popupEnabled: true,
  onItemDisplay: () => {},
  onMouseLeave: () => {},
  customPopupContent: null,
  verticalGap: 15,
  timelineColor: 'black',
  popupBackgroundColor: null,
  popupDelay: 100,
  popupWidth: 400,
  lineThickness: 6,
  style: {}
}

export default function Timeline(props) {
  const {
    items,
    numSegments,
    isInteractive,
    popupEnabled,
    customPopupContent,
    verticalGap,
    timelineColor,
    popupBackgroundColor,
    popupDelay,
    popupWidth,
    lineThickness
  } = props
  // seperated hoveredId and displayedItemId. hoveredId for making the
  // hovering items more responsive. displayedItemId for handling popup delay.
  const [hoveredId, setHoveredId] = useState(-1)
  const [displayedItemId, setDisplayedItemId] = useState(-1)
  const [firstYear, setFirstYear] = useState(null)
  const [lastYear, setLastYear] = useState(null)
  const [levels, setLevels] = useState([])
  const [containerHeight, setContainerHeight] = useState(0)
  const [open, setOpen] = useState(false)
  const [arrowPos, setArrowPos] = useState(50)
  const [popupPos, setPopupPos] = useState(50)
  const [itemElements, setItemElements] = useState({})
  const [touchedId, setTouchedId] = useState(-2)
  const ref = useRef(null)

  const defaultColors = [
    '#f24f4f',
    '#ffff32',
    '#f79825',
    '#7cf4e6',
    '#ffa48e', 
    'bf00ff'
  ]
  const timeoutRef = useRef() // to persist across re-renders

  const hexToRgb = hex => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null
  }

  const intervalOverlaps = (item1, item2) => {
    let s1 = item1.start.year*12 + item1.start.month
    let s2 = item2.start.year*12 + item2.start.month
    let min = Math.min(s1,s2)
    s1-=min
    s2-=min
    let e1 = item1.end.year*12 + item1.end.month - min
    let e2 = item2.end.year*12 + item2.end.month - min
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

  const validate = (item) => {
    if (item.start.month < 0 || item.start.month > 12) {
      console.error("month input to react-static-timeline needs to be between 0 and 12")
    }
  }

  const itemHover = (i, leftPct, rightPct, color) => {
    if (!isInteractive) return //no op
    const openPopup = () => {
      setDisplayedItemId(i)
      let midPoint
      if (!leftPct && !rightPct) {
        midPoint = 50
      }
      else {
        midPoint = (r+l) /2
      }
      setArrowPos(midPoint)
      setOpen(false)

      if(timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setOpen(true), 1)

      props.onItemDisplay(i, l, r, color)
    }
    if (i === hoveredId) return
    setHoveredId(i)
    let l = leftPct
    let r = 100-rightPct
    if (!popupEnabled || popupDelay === 0 || displayedItemId < 0) {
      openPopup()
      return
    }
    if (open) setOpen(false)
    if(timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(openPopup, popupDelay)
  }

  const mouseLeave = () => {
    if (!isInteractive) return //no op
    setHoveredId(-1)
    setOpen(false)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setDisplayedItemId(-1)
      props.onItemDisplay(-1)
    }, popupDelay)
    if (props.onMouseLeave) {
      props.onMouseLeave()
    }
  }

  const determineTouchedItem = (e) => {
    let el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY)
    setTouchedId(el.className.indexOf('item') >= 0 ? parseInt(el.id) : -1)
  }

  useEffect(() => {
    itemHover(touchedId)
  }, [touchedId])

  useEffect(() => {
    const timelineWidth = ref.current ? ref.current.offsetWidth : 0
    const arrowPx = arrowPos/100*timelineWidth
    const minPx = popupWidth/2
    const maxPx = timelineWidth - popupWidth/2
    if (arrowPx < minPx) {
      setPopupPos(minPx/timelineWidth*100)
    }
    else if (arrowPx > maxPx) {
      setPopupPos(maxPx/timelineWidth*100)
    }
    else {
      setPopupPos(arrowPos)
    }

  }, [ref.current, arrowPos])

  useEffect(() => {
    if (!Object.keys(itemElements).length) {
      const newItemElements = {}
      for (let i=0; i < levels.length; i++) {
        newItemElements[i] = document.querySelectorAll(`.item.level${i}`)
      }
      if (Object.keys(newItemElements).length) {
        setItemElements(newItemElements)
      }
      return
    }
    // setup event listeners for mobile
    ref.current.addEventListener('touchstart', determineTouchedItem)
    ref.current.addEventListener('touchmove', determineTouchedItem)
    // teardown event listeners for mobile
    return () => {
      ref.current.removeEventListener('touchstart', determineTouchedItem)
      ref.current.removeEventListener('touchmove', determineTouchedItem)
    }
  }, [ref.current, itemElements])

  useEffect(() => {
    const conflicts = {}
    let fy, ly
    items.forEach((item, i, a) => {
      validate(item)
      if (!fy || item.start.year <= fy) {
        fy = item.start.year
      }
      if (!ly || item.end.year >= ly) {
        ly = item.end.year
      }

      conflicts[i] = []
      for (let j=0; j < a.length; j++) {
        if (j===i) continue
        if (intervalOverlaps(item,a[j])) {
          conflicts[i].push(j)
        }
      }
    })

    setFirstYear(fy)
    setLastYear(ly)

    const order = Object.keys(conflicts).map(itemId => ({
      itemId: parseInt(itemId)
    })).sort((a,b) => {
      const itemA = items[a.itemId]
      const itemB = items[b.itemId]
      const spanA = (itemA.end.year*12+itemA.end.month) - (itemA.start.year*12+itemA.start.month)
      const spanB = (itemB.end.year*12+itemB.end.month) - (itemB.start.year*12+itemB.start.month)
      return spanA - spanB
    })

    const added = {}
    const levelsArray = [[]] // each level is array of itemIds
    let i = 0
    let loopCounter = 0

    while(order.length !== Object.keys(added).length) {
      loopCounter++
      // safeguard to prevent infinite loops, hanging webpage
      if (loopCounter > 5000) {
        console.error(`react-static-timeline component must not be working with these parameters.
          The other option is you have over 5000 items on the timeline, which is not supported.
          Please submit an issue to https://github.com/jjjhill/react-static-timeline`)
        break
      }
      if (levelsArray.length-1 < i) levelsArray.push([])
      let nextToAdd = null
      for (let j=0; j < order.length; j++) {
        if (added[order[j].itemId]) continue
        if (!levelsArray[i].length) {
          nextToAdd = order[j].itemId
          break
        }
        const currId = order[j].itemId
        if (!levelsArray[i].some(item => {
          return conflicts[item].indexOf(currId) > -1
        })) {
          nextToAdd = order[j].itemId
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
  }, [items])

  useEffect(() => {
    setContainerHeight(levels.length*verticalGap + 21)
  }, [levels, verticalGap])


  const numYears = lastYear - firstYear + 1
  const totalMonths = numYears * 12
  const itemNodes = []

  for (let i=0; i < levels.length; i++) {
    levels[i].forEach(itemId => {
      let item = items[itemId]
      let startN = (item.start.year - firstYear) * 12 + item.start.month
      let endN = (item.end.year - firstYear) * 12 + item.end.month
      let leftPct = (startN / totalMonths) * 100
      let rightPct = ((totalMonths - endN) / totalMonths) * 100

      let clr = item.color || defaultColors[itemId % defaultColors.length]
      let { r, g, b } = hexToRgb(clr)
      itemNodes.push(
        <div
          key={itemId}
          className={`item level${i}`}
          id={itemId}
          style={{
            zIndex: 10-i,
            top: verticalGap*(levels.length-i-1),
            left: leftPct + '%',
            right: rightPct + '%',
            borderTop: `solid ${lineThickness}px`,
            borderColor: `rgb(${r}, ${g}, ${b})`,
            backgroundColor:  hoveredId === itemId ? `rgba(${r},${g},${b},0.2)` : 'transparent'
          }}
          onMouseEnter={(e) => {
            itemHover(itemId, leftPct, rightPct, clr)
          }}
        />
      )
    })
  }

  let r=0,g=0,b=0
  const item = displayedItemId >= 0 ? items[displayedItemId] : { color: '#000000'}
  if (!popupBackgroundColor) {
    const currColor = item.color || defaultColors[displayedItemId % defaultColors.length]
    const popupColor = currColor
    let rgb = hexToRgb(popupColor)
    r = rgb.r
    g = rgb.g
    b = rgb.b
  }

  return (
    <div onMouseLeave={mouseLeave} ref={ref} style={{ ...props.style }}>
      { popupEnabled && displayedItemId >= 0 &&
        <div
          className='speech-bubble'
          style={{
            transition: `transform ${popupDelay}ms ease`,
            transform: open ? 'scale(1)' : 'scale(0)'
          }}
        >
          <div
            className='speech-bubble-content'
            style={{
              left: popupPos+'%',
              backgroundColor: popupBackgroundColor || `rgba(${r},${g},${b},0.1)`,
              width: popupWidth+'px'
            }}
          >
            {customPopupContent ?
              customPopupContent :
              (<div>
                <div className='line' style={{ backgroundColor: item.color || defaultColors[displayedItemId % defaultColors.length] }} />
                <h1>{item.title}</h1>
                <p className='summary'>{item.summary}</p>
              </div>)
            }
          </div>
          <div
            className='arrow'
            style={{
              marginLeft: arrowPos+'%',
              borderTopColor: popupBackgroundColor || `rgba(${r},${g},${b},0.1)`,
            }}
          />
        </div>
      }
      <div
        className='timeline'
        style={{ height: containerHeight }}
      >
        <div className='grid-lines' style={{ borderColor: timelineColor }}>
          {[...Array(numYears)].map((_, i) => (
            <div key={'seg' + i} className='major' style={{ borderColor: timelineColor }}>
              {[...Array(numSegments)].map((_, j) => (
                <div key={'subSeg' + j} className='minor' style={{ borderColor: timelineColor }} />
              ))}
              <span
                className='year'
                style={{ color: timelineColor }}
              >
                {firstYear + i}
              </span>
            </div>
          ))}
        </div>
        {itemNodes}
      </div>
    </div>
  )
}
