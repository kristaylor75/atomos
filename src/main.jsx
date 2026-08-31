import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { forceDefaultSkin } from '@/lib/skins'

// Always start on the default appearance, regardless of any previously saved skin.
forceDefaultSkin();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)