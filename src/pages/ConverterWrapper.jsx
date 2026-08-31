import { useEffect, useState } from 'react';
import Converter from '@/pages/Converter.jsx';

export default function ConverterWrapper() {
  const [params, setParams] = useState({});

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setParams({
      initialCategory: p.get('category') || undefined,
      initialValue: p.get('value') || undefined,
      initialFrom: p.get('from') || undefined,
      initialTo: p.get('to') || undefined,
    });
  }, []);

  return <Converter {...params} />;
}