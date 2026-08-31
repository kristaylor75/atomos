import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { getSkin } from '@/lib/skins';
import { haptics } from '@/lib/haptics';
import {
  Layers, FileText, Zap, History,
  Calculator, ArrowLeftRight, Clock, Triangle, LineChart,
  Wand2, RefreshCw, Radio, Cloud, Activity, GripVertical,
  MessageCircle, Mail, MessageSquare, Phone, Users, Map, Home,
  Gamepad2, Crown, Bomb, Waves, Grid2x2, Skull } from
'lucide-react';
import WeatherWidget from '@/components/WeatherWidget';
import QuickConversionsPanel from '@/components/QuickConversionsPanel';
import SystemStatusWidget from '@/components/home/SystemStatusWidget';
import MiniConverterWidget from '@/components/home/MiniConverterWidget';
import TodayNotesWidget from '@/components/home/TodayNotesWidget';
import CommunicationWidget from '@/components/home/CommunicationWidget';
import HomeWidgetCustomizer from '@/components/home/HomeWidgetCustomizer';
import UsageAnalyticsWidget from '@/components/home/UsageAnalyticsWidget';
import MiniCalculatorWidget from '@/components/home/MiniCalculatorWidget';
import MiniDateTimeWidget from '@/components/home/MiniDateTimeWidget';
import MiniGeometryWidget from '@/components/home/MiniGeometryWidget';
import MiniGraphWidget from '@/components/home/MiniGraphWidget';
import MiniNotesWidget from '@/components/home/MiniNotesWidget';
import MiniGeneratorWidget from '@/components/home/MiniGeneratorWidget';
import MiniTextConverterWidget from '@/components/home/MiniTextConverterWidget';
import MiniRadioWidget from '@/components/home/MiniRadioWidget';
import MiniHistoryWidget from '@/components/home/MiniHistoryWidget';
import { AVAILABLE_WIDGETS, getHomeWidgets, setHomeWidgets } from '@/lib/homeWidgets';

const WIDGET_COMPONENTS = {
  status: SystemStatusWidget, weather: WeatherWidget, converter: MiniConverterWidget, todayNotes: TodayNotesWidget, communications: CommunicationWidget,
  calculator: MiniCalculatorWidget, datetime: MiniDateTimeWidget, geometry: MiniGeometryWidget, graphing: MiniGraphWidget,
  notes: MiniNotesWidget, generator: MiniGeneratorWidget, textConverter: MiniTextConverterWidget, radio: MiniRadioWidget, history: MiniHistoryWidget,
  analytics: UsageAnalyticsWidget,
};

// Same category/tool map as the radial HubMenu, kept here so the home screen
// reads as a Pip-Boy "main menu" independent of the overlay.
const CATEGORIES = [
{
  id: 'calculations', labelKey: 'navCatCalculations', icon: Layers,
  tools: [
  { to: '/calculator', icon: Calculator, labelKey: 'navCalculator' },
  { to: '/converter', icon: ArrowLeftRight, labelKey: 'navConverter' },
  { to: '/datetime', icon: Clock, labelKey: 'navDateTime' },
  { to: '/geometry', icon: Triangle, labelKey: 'navGeometry' },
  { to: '/graphing', icon: LineChart, labelKey: 'navGraphing' }]

},
{
  id: 'text', labelKey: 'navCatText', icon: FileText,
  tools: [
  { to: '/notes', icon: FileText, labelKey: 'navNotes' },
  { to: '/generator', icon: Wand2, labelKey: 'navGenerator' },
  { to: '/text-converter', icon: RefreshCw, labelKey: 'navTextConverter' }]

},
{
  id: 'communications', labelKey: 'navCatCommunications', icon: MessageCircle,
  tools: [
  { to: '/email-inbox', icon: Mail, labelKey: 'navEmail' },
  { to: '/messages', icon: MessageSquare, labelKey: 'navSms' },
  { to: '/calls', icon: Phone, labelKey: 'navCalls' },
  { to: '/contacts', icon: Users, labelKey: 'navContacts' }]

},
{
  id: 'utilities', labelKey: 'navCatUtilities', icon: Zap,
  tools: [
  { to: '/radio', icon: Radio, labelKey: 'navRadio' },
  { to: '/weather', icon: Cloud, labelKey: 'navWeather' },
  { to: '/system-status', icon: Activity, labelKey: 'navSystemStatus' },
  { to: '/map', icon: Map, labelKey: 'navMap' }]

},
{
  id: 'games', labelKey: 'navCatGames', icon: Gamepad2,
  tools: [
  { to: '/games/chess', icon: Crown, labelKey: 'chessTitle' },
  { to: '/games/minesweeper', icon: Bomb, labelKey: 'minesTitle' },
  { to: '/games/snake', icon: Waves, labelKey: 'snakeTitle' },
  { to: '/games/blocks', icon: Grid2x2, labelKey: 'tetrisTitle' },
  { to: '/games/dungeon', icon: Skull, labelKey: 'doomTitle' }]

},
{
  id: 'history', labelKey: 'navCatHistory', icon: History,
  tools: [
  { to: '/history', icon: History, labelKey: 'navHistory' }]

}];


export default function PipBoyHome() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tabIdx, setTabIdx] = useState(0);
  const [toolIdx, setToolIdx] = useState(0);
  const [enabledWidgets, setEnabledWidgets] = useState(() => getHomeWidgets());
  const isPipBoy = getSkin() === 'pip-boy';

  useEffect(() => {
    const refresh = () => setEnabledWidgets(getHomeWidgets());
    window.addEventListener('homewidgetschange', refresh);
    return () => window.removeEventListener('homewidgetschange', refresh);
  }, []);

  const onWidgetDragEnd = useCallback((result) => {
    if (!result.destination) return;
    const items = Array.from(enabledWidgets);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setEnabledWidgets(items);
    setHomeWidgets(items);
  }, [enabledWidgets]);

  const categories = CATEGORIES.map((c) => ({ ...c, label: t(c.labelKey), tools: c.tools.map((tk) => ({ ...tk, label: t(tk.labelKey) })) }));

  const selectTab = useCallback((i) => {
    haptics.tap();
    setTabIdx(i);
    setToolIdx(0);
  }, []);

  const goTool = useCallback((to) => {
    haptics.click();
    navigate(to);
  }, [navigate]);

  // Keyboard: 1–6 tabs, ←/→ cycle tabs, ↑/↓ cycle tools, Enter open
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (/^[1-6]$/.test(e.key)) {e.preventDefault();selectTab(parseInt(e.key, 10) - 1);return;}
      if (e.key === 'ArrowRight') {e.preventDefault();selectTab((tabIdx + 1) % categories.length);return;}
      if (e.key === 'ArrowLeft') {e.preventDefault();selectTab((tabIdx - 1 + categories.length) % categories.length);return;}
      const tlen = categories[tabIdx].tools.length;
      if (e.key === 'ArrowDown') {e.preventDefault();setToolIdx((p) => (p + 1) % tlen);return;}
      if (e.key === 'ArrowUp') {e.preventDefault();setToolIdx((p) => (p - 1 + tlen) % tlen);return;}
      if (e.key === 'Enter') {e.preventDefault();goTool(categories[tabIdx].tools[toolIdx].to);return;}
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tabIdx, toolIdx, categories, selectTab, goTool]);

  const cat = categories[tabIdx];

  return (
    <div className="max-w-3xl mx-auto px-4 py-5">
      {/* ── Terminal banner ── */}
      <div className="panel px-4 py-3 mb-3 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'hsl(var(--primary) / 0.15)', border: '1px solid hsl(var(--primary) / 0.4)', boxShadow: '0 0 14px hsl(var(--primary) / 0.25)' }}
        >
          <Home className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
        </div>
        <h1 className="font-mono text-lg font-bold uppercase tracking-widest text-foreground">{t('navHome')}</h1>
      </div>



      

      {/* ── Customizable, drag-and-drop widgets ── */}
      <HomeWidgetCustomizer />
      <DragDropContext onDragEnd={onWidgetDragEnd}>
        <Droppable droppableId="home-widgets">
          {(provided) =>
          <div ref={provided.innerRef} {...provided.droppableProps}>
              {enabledWidgets.map((id, index) => {
              const entry = AVAILABLE_WIDGETS.find((w) => w.id === id);
              if (!entry) return null;
              const Widget = WIDGET_COMPONENTS[id];
              return (
                <Draggable key={id} draggableId={id} index={index}>
                    {(dragProvided, snapshot) =>
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    style={{ ...dragProvided.draggableProps.style, opacity: snapshot.isDragging ? 0.85 : 1 }}
                    className="relative">
                    
                        <div
                      {...dragProvided.dragHandleProps}
                      className="absolute left-1 top-3 z-10 cursor-grab active:cursor-grabbing p-1 opacity-40 hover:opacity-80">
                      
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="pl-5">
                          {Widget && <Widget />}
                        </div>
                      </div>
                  }
                  </Draggable>);

            })}
              {provided.placeholder}
            </div>
          }
        </Droppable>
      </DragDropContext>

      {/* ── Quick conversion shortcuts ── */}
      <QuickConversionsPanel />

      {/* ── Category tabs ── */}
      <div className="panel p-2 mb-3">
        <div className="flex flex-wrap gap-1">
          {categories.map((c, i) => {
            const Icon = c.icon;
            const active = i === tabIdx;
            return (
              <button
                key={c.id}
                onClick={() => selectTab(i)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all"
                style={{
                  background: active ? 'hsl(var(--primary))' : 'transparent',
                  color: active ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                  boxShadow: active ? '0 0 12px hsl(var(--primary) / 0.5)' : 'none',
                  border: active ? '1px solid hsl(var(--primary))' : '1px solid transparent'
                }}>
                
                <Icon className="w-3.5 h-3.5" />
                <span>{c.label}</span>
                <span className="opacity-60 ml-0.5">{i + 1}</span>
              </button>);

          })}
        </div>
      </div>

      {/* ── Tool list ── */}
      <div className="panel overflow-hidden">
        <div className="px-4 py-2 flex items-center justify-between" style={{ background: 'hsl(var(--muted))', borderBottom: '1px solid hsl(var(--border))' }}>
          <span className="font-mono text-[11px] uppercase tracking-widest opacity-80">{cat.label}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">{t('pipHomeSelect')}</span>
        </div>
        <ul className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
          {cat.tools.map((tool, i) => {
            const Icon = tool.icon;
            const active = i === toolIdx;
            return (
              <li key={tool.to}>
                <button
                  onClick={() => goTool(tool.to)}
                  onMouseEnter={() => setToolIdx(i)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                  style={{
                    background: active ? 'hsl(var(--primary) / 0.18)' : 'transparent',
                    boxShadow: active ? 'inset 3px 0 0 hsl(var(--primary))' : 'none'
                  }}>
                  
                  <span className="font-mono text-xs opacity-60 w-5">{`[${i + 1}]`}</span>
                  <Icon className="w-4 h-4 shrink-0" style={{ color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }} />
                  <span className="flex-1 text-sm font-semibold tracking-wide">{tool.label}</span>
                  <span className="font-mono text-xs opacity-50">{'>'}</span>
                </button>
              </li>);

          })}
        </ul>
      </div>

      {/* ── Footer hints ── */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 justify-center font-mono text-[10px] uppercase tracking-widest opacity-50">
        <span>1–6 {t('pipHomeTabs')}</span>
        <span>← → {t('pipHomeCycleTabs')}</span>
        <span>↑ ↓ {t('pipHomeCycleTools')}</span>
        <span>Enter {t('pipHomeOpen')}</span>
      </div>
    </div>);

}