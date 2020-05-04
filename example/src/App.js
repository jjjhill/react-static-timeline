import React, { useState } from 'react'
import './App.css'
import Timeline from 'react-static-timeline'

export default function App() {
  const timelineItems = [
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
      end: { year: 2016, month: 8 },
      technologiesUsed: 'yeet'
    }
  ]

  const [hoveredId, setHoveredId] = useState(-1)

  const onItemDisplay = (i, leftPct, rightPct, color) => {
    setHoveredId(i)
  }

  const item = hoveredId >= 0 ? timelineItems[hoveredId] : {}
  const content = (
    <div>
      <h1>{ item.title }</h1>
      <p className='summary'>{ item.summary }</p>
      <p className='technologies'>{ item.technologiesUsed }</p>
    </div>
  )

  return (
    <div className='App'>
      <div className='timeline-container'>
        <Timeline
          items={timelineItems}
          onItemDisplay={onItemDisplay}
          onMouseLeave={() => onItemDisplay(-1)}
          lineThickness={4}
          timelineColor={'white'}
          style={{ fontFamily: "sans-serif" }}
          popupWidth={300}
        />
      </div>
    </div>
  )
}

