import { Routes, Route, Navigate } from 'react-router-dom';
import Laboratory from './components/Laboratory';
import Documentation from './components/Documentation';
import Home from './components/Home';
import VariablesLab from './components/VariablesLab';
import StatisticalLab from './components/StatisticalLab';

// Suite advanced PRNG - v1.1.0
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/laboratory" element={<Laboratory />} />
      <Route path="/variables" element={<VariablesLab />} />
      <Route path="/stats" element={<StatisticalLab />} />
      <Route path="/doc" element={<Documentation />}>
        <Route path=":docId" element={<Documentation />} />
        <Route index element={<Navigate to="README" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
