import { Routes, Route } from 'react-router';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Hello, World!</div>} />
    </Routes>
  );
}

export default App;
