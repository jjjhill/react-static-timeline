# react-static-timeline

>An interactive customizable timeline for React

## Intro

A creative way to display your personal timeline on your webpage.

![](https://raw.githubusercontent.com/jjjhill/react-static-timeline/master/demo/timeline_demo.gif)

## Install

```bash
npm install --save react-static-timeline
```

## Usage

```js
import React from 'react'
import Timeline from 'react-static-timeline'

const events = [
  {
    title: 'Employment1',
    summary: 'Did some cool stuff',
    start: { year: 2012, month: 0 },
    end: { year: 2013, month: 4 }
  },
  {
    title: 'Employment2',
    summary: 'Did some even cooler stuff',
    start: { year: 2013, month: 5 },
    end: { year: 2015, month: 12 }
  },
  {
    title: 'Graduate School',
    summary: 'Learned some super useful things',
    start: { year: 2012, month: 2 },
    end: { year: 2016, month: 8 }
  }
]

export default function App() {

  return (
    <div>
      <Timeline events={events} />
    </div>
  )
}
```

The `Timeline` component will fill the width of its container, and its height stretches to contain both the timeline and the popup bubble
> Note: use `month: 0` to represent the beginning of January and `month: 12` to represent the end of December.

## API

### Timeline

- `props.events` - array<object> | required | array of event objects in the following format to be displayed on the timeline: 
  ```js
  {
    title: string, // optional
    summary: string, // optional
    start: { year: number, month: number }, // required
    end: { year: number, month: number } // required
  }
  ```
- `props.isInteractive` - boolean | optional | (default `true`) | determines if the timeline is hoverable. If false, there will be no highlighting of events or popup.
- `props.onEventDisplay` - function | optional | callback function which is executed when the popup is displayed with the event.  The function is called as follows:
  ```js
    props.onEventDisplay(eventId, leftPct, rightPct, color)
  ```
  where eventId is the index of the selected event in the provided `events` array. leftPct is the distance from the left side of the the Timeline's container to the left side of the event line, as a percentage of the container's width. rightPct is the distance from the left side of the the Timeline's container to the right side of the event line, as a percentage of the container's width. Color is the color of the event line that was hovered. leftPct and rightPct is explained visually here:
  ![](https://raw.githubusercontent.com/jjjhill/react-static-timeline/master/demo/pct_explanation.png)

- `props.onMouseLeave` - function | optional | callback function which is executed when the users cursor leaves the Timeline element.
- `props.popupEnabled` - boolean | optional | (default `true`) | When true, the popup will show when the user hovers over events.
- `props.customPopupContent` - function | optional | A function that returns a JSX element (or HTML element) to be displayed in the popup instead of the default content. The popup bubble style will remain the same. To make a completely custom popup, see the section "Completely custom popup" below.
- `props.eventGap` - number | optional | (default `15`) | The vertical gap (in px) between each 'level' of events on the timeline.
- `props.timelineColor` - string | optional | (default `'black'`) | The color of the timeline ruler and years displayed below it. The string value can be any CSS color value including hex, rgb, rgba, etc.
- `props.popupBackgroundColor` - string | optional | (default `'rgba(22, 22, 22, 0.4)'`) | The color of the popup background. The string value can be any CSS color value including hex, rgb, rgba, etc.
- `props.popupDelay` - number | optional | (default `100`) | The transition delay (in ms) for the popups to change.
- `props.popupWidth` - number | optional | (default `400`) | The width of the popup (in px)
- `props.lineThickness` - number | optional | (default `5`) | The thickness of the colored lines representing the events on the timeline.
- `props.style` - object | optional | Any JSX styling that you wish to apply to the outermost div of the Timeline component. Examples include: { fontFamily: "sans-serif", width: '50%' }

## Custom popup content

Using the customPopupContent prop, you can change what shows up inside the popup. An example is as follows:

```js
const [hoveredId, setHoveredId] = useState(-1)
const onEventDisplay = (eventId, leftPct, rightPct, color) => {
  setHoveredId(eventId)
}
const content = () => {
  const event = events[hoveredId]
  return (
    <div>
      <h1>{ event.title }</h1>
      <p className='summary'>{ event.summary }</p>
      <p className='technologies'>{ event.technologiesUsed }</p>
    </div>
  ) //                                      ^^^
    //      I would just add an extra property to the event objects
}

return (
  <div>
    <Timeline events={events} customPopupContent={content} />
  </div>
)
```

## Completely custom popup

If you don't want to use the default popup altogether, set props.popupEnabled to false. Then, using the props.onEventDisplay callback, you can whatever you want. The function provides the leftPct and rightPct which you can use to position something within the container, directly above/below the event that was hovered.

Example here:

```js
import React, { useState } from 'react'
import Timeline from 'react-static-timeline'

import babybel from '../assets/babybel.png'
import starbucks from '../assets/starbucks.png'

export default function App() {
  const events = [
    { start:{year:2010, month:0}, end:{year:2010, month: 6}, logo: babybel},
    { start:{year:2011, month:0}, end:{year:2011, month:12}, logo: starbucks}
  ]
  const [hoveredId, setHoveredId] = useState(-1)
  const [midpoint, setMidpoint] = useState(50)
  const displayLogo = (eventId, leftPct, rightPct, color) => {
    setHoveredId(eventId)
    setMidpoint((leftPct+rightPct)/2)
  }

  const event = events[hoveredId]
  return (
    <div style={{ position: 'relative', width: '600px', height: '200px' }}>
      { hoveredId >= 0 &&
      <img
        src={event.logo}
        style={{
          position: 'absolute',
          top: '50px',
          left: `${midpoint}%`,
          transform: 'translateX(-50%)',
          height: '50px',
          width: '50px'
        }}
      />}
      <Timeline
        events={events}
        onEventDisplay={displayLogo}
        popupEnabled={false}
      />
    </div>
  )
}
```