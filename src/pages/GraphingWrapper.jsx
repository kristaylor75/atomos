import { useState, useEffect } from 'react';
import Graphing from './Graphing';

export default function GraphingWrapper() {
  const [initialExpr, setInitialExpr] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const expr = params.get('expr');
    if (expr) setInitialExpr(decodeURIComponent(expr));
  }, []);

  return <Graphing initialExpr={initialExpr} />;
}