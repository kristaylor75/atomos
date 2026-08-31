import { useEffect, useState } from 'react';
import Calculator from '@/pages/Calculator.jsx';

export default function CalculatorWrapper() {
  const [initialValue, setInitialValue] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const calc = params.get('calc');
    if (calc) setInitialValue(calc);
  }, []);

  return <Calculator initialValue={initialValue} />;
}