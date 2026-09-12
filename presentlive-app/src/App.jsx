import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Homepage from "./Homepage";
import ResultsPage from "./ResultsPage";
import SlideEditor from "./SlideEditor";
import SlideViewer from "./SlideViewer";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/slide-editor" element={<SlideEditor />} />
        <Route path="/slide-viewer" element={<SlideViewer />} />
        <Route path="/results-page" element={<ResultsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
