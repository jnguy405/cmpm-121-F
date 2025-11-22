import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { SimplePhysics } from './components/SimplePhysics'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [showPhysics, setShowPhysics] = useState(false)

  return (
    <>
      {showPhysics ? (
        <div style={{ position: 'relative' }}>
          <SimplePhysics />
          <button 
            onClick={() => setShowPhysics(false)}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              zIndex: 1000,
              padding: '10px',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ← Back to React Demo
          </button>
        </div>
      ) : (
        <>
          <div>
            <a href="https://vite.dev" target="_blank">
              <img src={viteLogo} className="logo" alt="Vite logo" />
            </a>
            <a href="https://react.dev" target="_blank">
              <img src={reactLogo} className="logo react" alt="React logo" />
            </a>
          </div>
          <h1>Vite + React + Three.js + Ammo.js</h1>
          <div className="card">
            <button onClick={() => setCount((count) => count + 1)}>
              count is {count}
            </button>
            <button onClick={() => setShowPhysics(true)} style={{ marginLeft: '10px' }}>
              Show Physics Demo
            </button>
            <p>
              Edit <code>src/App.tsx</code> and save to test HMR
            </p>
          </div>
          <p className="read-the-docs">
            Click on the Vite and React logos to learn more
          </p>
        </>
      )}
    </>
  )
}

export default App