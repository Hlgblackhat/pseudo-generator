import { Routes, Route, Navigate } from 'react-router-dom';
import Laboratory from './components/Laboratory';
import Documentation from './components/Documentation';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Laboratory />} />
      <Route path="/doc" element={<Documentation />}>
        <Route path=":docId" element={<Documentation />} />
        <Route index element={<Navigate to="README" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
