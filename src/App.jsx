import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import VerificationPage from './Components/VerificationPage';
import VideoSignature from './Components/videoSignature';
import EndPage from './Components/EndPage';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Entry point: localhost:5173/?token=...&userId=... */}
        <Route path="/" element={<VerificationPage />} />
        

        <Route path="/videosignature" element={<VideoSignature />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />

        <Route path="/completed" element={<EndPage />} />
      </Routes>
    </Router>
  );
}