import React, { useState } from 'react'
import './App.css'
import Timeline from 'react-static-timeline'

export default function App() {
  const events = [
    {
      title: 'Employment1',
      summary: 'Did some cool stuff',
      start: { year: 2012, month: 8 },
      end: { year: 2013, month: 12 },
    },
    {
      title: 'Employment2',
      summary: 'Did some even cooler stuff',
      start: { year: 2014, month: 5 },
      end: { year: 2015, month: 12 }
    },
    {
      title: 'Contract Work',
      summary: 'Vivamus luctus, ipsum et pharetra auctor, diam quam lacinia odio, eu rutrum odio metus eget orci. Donec aliquam faucibus neque.',
      start: { year: 2013, month: 8 },
      end: { year: 2015, month: 4 }
    },
    {
      title: 'Graduate School',
      summary: 'Learned some super useful things',
      start: { year: 2012, month: 2 },
      end: { year: 2016, month: 8 }
    }
  ]

  const [hoveredId, setHoveredId] = useState(-1)

  const onEventDisplay = (i, leftPct, rightPct, color) => {
    setHoveredId(i)
  }

  return (
    <div className='App'>
      <div className='timeline-container'>
        <Timeline
          events={events}
          onEventDisplay={onEventDisplay}
          onMouseLeave={() => onEventDisplay(-1)}
          lineThickness={4}
          timelineColor={'white'}
          style={{ fontFamily: "sans-serif" }}
          popupWidth={300}
        />
      </div>
    </div>
  )
}

