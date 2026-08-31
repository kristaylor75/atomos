import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Variable, LineChart, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import GraphCanvas from '@/components/GraphCanvas.jsx';
import Graph3DCanvas from '@/components/Graph3DCanvas.jsx';
import GraphSettings from '@/components/GraphSettings.jsx';
import SendTo from '@/components/SendTo.jsx';
import { addHistoryEntry } from '@/lib/history';
import { getSkin } from '@/lib/skins';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Per-skin color palettes for function plots
const SKIN_PALETTES = {
  'default':        ['hsl(217 91% 60%)', 'hsl(0 72% 58%)',  'hsl(38 92% 58%)',  'hsl(173 58% 45%)', 'hsl(280 65% 65%)', 'hsl(340 75% 58%)'],
  'pip-boy':        ['#39ff5a', '#7fff00', '#00e5cc', '#b8ff3a', '#5fff9a', '#ccff44'],
  'ham-radio':      ['#ffb300', '#ff6f00', '#ffd54f', '#ff8f00', '#ffe082', '#ef6c00'],
  'graphing-calc':  ['#1a1a1a', '#cc0000', '#004499', '#006600', '#660066', '#885500'],
  'audio-rack':     ['#64ff64', '#00ffcc', '#88ff00', '#00e5ff', '#ccff66', '#33ff99'],
  'retro-scifi':    ['#00e5ff', '#e040fb', '#69f0ae', '#ff6e40', '#40c4ff', '#ea80fc'],
};

function getSkinColors() {
  const skin = getSkin();
  return SKIN_PALETTES[skin] || SKIN_PALETTES['default'];
}

export default function Graphing({ initialExpr }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState('2d');
  const [skinColors, setSkinColors] = useState(getSkinColors);
  const [functions, setFunctions] = useState(() => {
    const colors = getSkinColors();
    const expr = initialExpr || '';
    return [{ id: 1, expr, color: colors[0], visible: true, error: '', mode3d: 'z' }];
  });
  const [variables, setVariables] = useState([{ id: 1, name: '', value: '' }]);
  const [varsOpen, setVarsOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null); // { x, y, label }
  const [functionsCollapsed, setFunctionsCollapsed] = useState(false);
  const [nextId, setNextId] = useState(2);
  const nextColor = useRef(1);
  const funcInputRefs = useRef({});

  // Graph settings
  const [gridVisible, setGridVisible] = useState(true);
  const [axisNumbersVisible, setAxisNumbersVisible] = useState(true);
  const [minorGridlinesVisible, setMinorGridlinesVisible] = useState(true);
  const [showArrows, setShowArrows] = useState(true);
  const [lockViewport, setLockViewport] = useState(false);
  const [angleMode, setAngleMode] = useState('degrees');
  const [xAxisLabel, setXAxisLabel] = useState('x');
  const [yAxisLabel, setYAxisLabel] = useState('y');

  // React to skin changes — update skinColors AND remap existing function colors
  useEffect(() => {
    const onSkinChange = () => {
      const newColors = getSkinColors();
      setSkinColors(newColors);
      setFunctions(prev => prev.map((fn, i) => ({ ...fn, color: newColors[i % newColors.length] })));
    };
    window.addEventListener('skinchange', onSkinChange);
    return () => window.removeEventListener('skinchange', onSkinChange);
  }, []);

  // Keep initialExpr in sync if navigated to
  useEffect(() => {
    if (initialExpr) {
      setFunctions(prev => {
        const copy = [...prev];
        copy[0] = { ...copy[0], expr: initialExpr };
        return copy;
      });
    }
  }, [initialExpr]);

  const parsedVars = variables.reduce((acc, v) => {
    if (v.name.trim() && v.value.trim() && !isNaN(parseFloat(v.value))) {
      acc[v.name.trim()] = parseFloat(v.value);
    }
    return acc;
  }, {});

  const addFunction = () => {
    const color = skinColors[nextColor.current % skinColors.length];
    nextColor.current++;
    const newId = nextId;
    setFunctions(prev => [...prev, { id: newId, expr: '', color, visible: true, error: '', mode3d: 'z' }]);
    setNextId(n => n + 1);
    // Focus the new input after state updates
    setTimeout(() => {
      if (funcInputRefs.current[newId]) {
        funcInputRefs.current[newId].focus();
      }
    }, 0);
  };

  const removeFunction = (id) => {
    setFunctions(prev => prev.filter(f => f.id !== id));
  };

  const updateExpr = (id, val) => {
    setFunctions(prev => prev.map(f => f.id === id ? { ...f, expr: val, error: '' } : f));
  };

  const updateMode3d = (id, val) => {
    setFunctions(prev => prev.map(f => f.id === id ? { ...f, mode3d: val, error: '' } : f));
  };

  const handleFunctionKeydown = (e, id) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFunction();
    } else if (e.key === 'Backspace') {
      const fn = functions.find(f => f.id === id);
      if (fn && fn.expr === '') {
        e.preventDefault();
        if (functions.length > 1) {
          removeFunction(id);
          const idx = functions.findIndex(f => f.id === id);
          if (idx > 0) {
            setTimeout(() => {
              const prevFn = functions[idx - 1];
              if (funcInputRefs.current[prevFn.id]) {
                funcInputRefs.current[prevFn.id].focus();
              }
            }, 0);
          }
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = functions.findIndex(f => f.id === id);
      if (idx > 0) {
        const prevFn = functions[idx - 1];
        if (funcInputRefs.current[prevFn.id]) {
          funcInputRefs.current[prevFn.id].focus();
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = functions.findIndex(f => f.id === id);
      if (idx < functions.length - 1) {
        const nextFn = functions[idx + 1];
        if (funcInputRefs.current[nextFn.id]) {
          funcInputRefs.current[nextFn.id].focus();
        }
      }
    }
  };

  const toggleVisible = (id) => {
    setFunctions(prev => prev.map(f => f.id === id ? { ...f, visible: !f.visible } : f));
  };

  const setFnError = (id, error) => {
    setFunctions(prev => prev.map(f => f.id === id ? { ...f, error } : f));
  };

  const handlePointFound = (point) => {
    setSelectedPoint(point);
    if (point) {
      const result = point.z !== undefined ? `(${point.x}, ${point.y}, ${point.z})` : `(${point.x}, ${point.y})`;
      addHistoryEntry({ tool: 'graphing', input: point.label, result });
    }
  };

  const varInputRefs = useRef({});

  const addVariable = () => {
    const newId = Date.now();
    setVariables(prev => [...prev, { id: newId, name: '', value: '' }]);
    // Focus the new variable name input after state updates
    setTimeout(() => {
      if (varInputRefs.current[`${newId}_name`]) {
        varInputRefs.current[`${newId}_name`].focus();
      }
    }, 0);
  };
  const removeVariable = (id) => setVariables(prev => prev.filter(v => v.id !== id));
  const updateVar = (id, field, val) => setVariables(prev => prev.map(v => v.id === id ? { ...v, [field]: val } : v));

  const handleVariableKeydown = (e, id, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addVariable();
    } else if (e.key === 'Backspace') {
      const v = variables.find(var_item => var_item.id === id);
      if (v && v.name === '' && v.value === '' && variables.length > 1) {
        e.preventDefault();
        removeVariable(id);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = variables.findIndex(var_item => var_item.id === id);
      if (idx < variables.length - 1) {
        const nextVar = variables[idx + 1];
        const nextField = field === 'name' ? 'name' : 'value';
        if (varInputRefs.current[`${nextVar.id}_${nextField}`]) {
          varInputRefs.current[`${nextVar.id}_${nextField}`].focus();
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = variables.findIndex(var_item => var_item.id === id);
      if (idx > 0) {
        const prevVar = variables[idx - 1];
        const prevField = field === 'name' ? 'name' : 'value';
        if (varInputRefs.current[`${prevVar.id}_${prevField}`]) {
          varInputRefs.current[`${prevVar.id}_${prevField}`].focus();
        }
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen select-none" style={{ paddingBottom: 'max(4.5rem, calc(4.5rem + env(safe-area-inset-bottom)))' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2 flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-foreground">{t('graphTitle') || 'Graphing Calculator'}</h1>
        <div className="tab-bar" style={{ width: 'auto' }}>
          <button
            onClick={() => { setMode('2d'); }}
            className={cn('tab-item flex items-center gap-1.5 px-3', mode === '2d' && 'active')}
          >
            <LineChart className="w-3.5 h-3.5" /> 2D
          </button>
          <button
            onClick={() => { setMode('3d'); setSelectedPoint(null); }}
            className={cn('tab-item flex items-center gap-1.5 px-3', mode === '3d' && 'active')}
          >
            <Box className="w-3.5 h-3.5" /> 3D
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-2 px-3 pb-1 min-h-0">
        {/* Left panel: functions + variables */}
        <div className="flex flex-col gap-2 lg:w-72 shrink-0 overflow-visible lg:overflow-y-auto lg:max-h-full">

          {/* Functions list */}
          <div className="panel overflow-hidden">
            <Collapsible open={!functionsCollapsed} onOpenChange={open => setFunctionsCollapsed(!open)}>
              <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {t('graphFunctions') || 'Functions'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
                    {functions.length}
                  </span>
                </div>
                {functionsCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
              </CollapsibleTrigger>

              <CollapsibleContent className="px-3 pb-3 flex flex-col gap-2 border-t border-border/50">
                <button
                  onClick={addFunction}
                  className="mt-2 w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-lg"
                  style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.3)' }}
                  title={t('graphAddFn') || 'Add function'}
                >
                  <Plus className="w-3 h-3" /> {t('graphAddFn') || 'Add'}
                </button>

                {functions.map((fn, i) => (
                  <div key={fn.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {/* Color swatch / visibility toggle */}
                      <button
                        onClick={() => toggleVisible(fn.id)}
                        className="w-4 h-4 rounded-full flex-shrink-0 transition-all"
                        style={{
                          background: fn.visible ? fn.color : 'hsl(var(--muted))',
                          border: `2px solid ${fn.color}`,
                          opacity: fn.visible ? 1 : 0.4,
                        }}
                        title={fn.visible ? (t('graphHide') || 'Hide') : (t('graphShow') || 'Show')}
                      />
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {mode === '3d' ? (
                          <select
                            value={fn.mode3d || 'z'}
                            onChange={e => updateMode3d(fn.id, e.target.value)}
                            className="text-xs font-mono neu-input py-1 px-1"
                            style={{ color: 'hsl(var(--muted-foreground))', width: '58px', fontSize: '0.75rem' }}
                          >
                            <option value="z">z=</option>
                            <option value="y">y=</option>
                            <option value="x">x=</option>
                            <option value="none">{t('graph3dNone') || 'none'}</option>
                          </select>
                        ) : (
                          <span className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>f(x)=</span>
                        )}
                      </div>
                      <input
                        ref={el => { if (el) funcInputRefs.current[fn.id] = el; }}
                        type="text"
                        value={fn.expr}
                        onChange={e => updateExpr(fn.id, e.target.value)}
                        onKeyDown={e => handleFunctionKeydown(e, fn.id)}
                        placeholder={mode === '3d' ? ((fn.mode3d || 'z') === 'none' ? 'y = x^2 + z^2' : (fn.mode3d === 'y' ? 'x^2 + z^2' : fn.mode3d === 'x' ? 'sin(y*z)' : 'sin(x)*cos(y)')) : 'x^2 + k'}
                        className="flex-1 min-w-0 neu-input text-sm font-mono py-1.5 px-2"
                        style={{ fontSize: '0.8rem' }}
                      />
                      {functions.length > 1 && (
                        <button
                          onClick={() => removeFunction(fn.id)}
                          className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                          style={{ color: 'hsl(var(--muted-foreground))', background: 'transparent' }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'hsl(var(--destructive))'; e.currentTarget.style.background = 'hsl(var(--destructive) / 0.1)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {fn.error && (
                      <p className="text-[10px] px-1" style={{ color: 'hsl(var(--destructive))' }}>{fn.error}</p>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Variables */}
          <div className="panel overflow-hidden">
            <Collapsible open={varsOpen} onOpenChange={setVarsOpen}>
              <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Variable className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {t('graphVariables') || 'Variables'}
                  </span>
                  {Object.keys(parsedVars).length > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
                      {Object.keys(parsedVars).length}
                    </span>
                  )}
                </div>
                {varsOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              </CollapsibleTrigger>

              <CollapsibleContent className="px-3 pb-3 flex flex-col gap-2 border-t border-border/50">
                <p className="text-[10px] pt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {t('graphVarsHint') || 'Define constants used in your functions (e.g. k = 9.81)'}
                </p>
                {variables.map(v => (
                  <div key={v.id} className="flex items-center gap-1.5">
                    <input
                      ref={el => { if (el) varInputRefs.current[`${v.id}_name`] = el; }}
                      type="text"
                      value={v.name}
                      onChange={e => updateVar(v.id, 'name', e.target.value)}
                      onKeyDown={e => handleVariableKeydown(e, v.id, 'name')}
                      placeholder="k"
                      className="neu-input text-sm font-mono py-1 px-2"
                      style={{ width: '56px', fontSize: '0.8rem' }}
                    />
                    <span className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>=</span>
                    <input
                      ref={el => { if (el) varInputRefs.current[`${v.id}_value`] = el; }}
                      type="text"
                      value={v.value}
                      onChange={e => updateVar(v.id, 'value', e.target.value)}
                      onKeyDown={e => handleVariableKeydown(e, v.id, 'value')}
                      placeholder="9.81"
                      className="neu-input text-sm font-mono py-1 px-2 flex-1"
                      style={{ fontSize: '0.8rem' }}
                    />
                    <button
                      onClick={() => removeVariable(v.id)}
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'hsl(var(--destructive))'}
                      onMouseLeave={e => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addVariable}
                  className="flex items-center gap-1.5 text-xs py-1"
                  style={{ color: 'hsl(var(--primary))' }}
                >
                  <Plus className="w-3 h-3" /> {t('graphAddVar') || 'Add variable'}
                </button>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Selected point info */}
          {selectedPoint && (
            <div className="panel p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {t('graphPoint') || 'Selected Point'}
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{selectedPoint.label}</p>
                  <p className="text-sm font-semibold font-mono mt-0.5" style={{ color: 'hsl(217 80% 70%)' }}>
                    {selectedPoint.z !== undefined ? `(${selectedPoint.x}, ${selectedPoint.y}, ${selectedPoint.z})` : `(${selectedPoint.x}, ${selectedPoint.y})`}
                  </p>
                </div>
                <SendTo value={selectedPoint.x} exclude="graphing" allowedTools={['calculator']} />
              </div>
            </div>
          )}
        </div>

        {/* Graph canvas */}
        <div className="flex-1 min-h-0 min-w-0 panel overflow-hidden relative" style={{ minHeight: '280px' }}>
          {mode === '2d' && (
            <div className="absolute top-2 right-2 flex items-center gap-1 z-50">
              <GraphSettings
                gridVisible={gridVisible}
                onGridVisibleChange={setGridVisible}
                axisNumbersVisible={axisNumbersVisible}
                onAxisNumbersVisibleChange={setAxisNumbersVisible}
                minorGridlinesVisible={minorGridlinesVisible}
                onMinorGridlinesVisibleChange={setMinorGridlinesVisible}
                showArrows={showArrows}
                onShowArrowsChange={setShowArrows}
                lockViewport={lockViewport}
                onLockViewportChange={setLockViewport}
                angleMode={angleMode}
                onAngleModeChange={setAngleMode}
                xAxisLabel={xAxisLabel}
                onXAxisLabelChange={setXAxisLabel}
                yAxisLabel={yAxisLabel}
                onYAxisLabelChange={setYAxisLabel}
              />
            </div>
          )}
          {mode === '2d' ? (
            <GraphCanvas
              functions={functions}
              variables={parsedVars}
              onError={setFnError}
              onPointSelected={handlePointFound}
              gridVisible={gridVisible}
              axisNumbersVisible={axisNumbersVisible}
              minorGridlinesVisible={minorGridlinesVisible}
              showArrows={showArrows}
              lockViewport={lockViewport}
              xAxisLabel={xAxisLabel}
              yAxisLabel={yAxisLabel}
            />
          ) : (
            <Graph3DCanvas
              functions={functions}
              variables={parsedVars}
              onError={setFnError}
              onPointSelected={handlePointFound}
            />
          )}
        </div>
      </div>
    </div>
  );
}