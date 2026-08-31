import { useState, useEffect } from 'react';
import { Play, Square, Radio as RadioIcon, Search, Bookmark, Sliders, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { addHistoryEntry } from '@/lib/history';
import player from '@/lib/radioPlayer';
import RadioVisualizer from '@/components/radio/RadioVisualizer';
import RadioControls from '@/components/radio/RadioControls';
import TuningDial from '@/components/radio/TuningDial';
import StationSearch from '@/components/radio/StationSearch';
import StationPresets from '@/components/radio/StationPresets';
import ScannerBands from '@/components/radio/ScannerBands';
import { useLanguage } from '@/lib/LanguageContext.jsx';

const TAB_DEFS = [
  { id: 'dial',    labelKey: 'radioTabDial',    icon: Sliders  },
  { id: 'bands',   labelKey: 'radioTabBands',   icon: Shield   },
  { id: 'search',  labelKey: 'radioTabSearch',  icon: Search   },
  { id: 'presets', labelKey: 'radioTabPresets', icon: Bookmark },
];

// Stations indexed by approximate frequency for the dial/scan feature
const SCAN_STATIONS = [
  { name: 'BBC World Service',   url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service', country: 'UK',  freq: 88.1 },
  { name: 'Jazz FM',             url: 'https://stream.jazzfm.com/jazzfm/mp3',                    country: 'UK',  freq: 90.0 },
  { name: 'NPR News',            url: 'https://npr-ice.streamguys1.com/live.mp3',                  country: 'US',  freq: 91.5 },
  { name: 'SmoothJazz.com',      url: 'https://ic8.smoothjazz.com/smoothjazz-128.mp3',            country: 'US',  freq: 93.1 },
  { name: 'Soma FM Groove Salad',url: 'https://ice1.somafm.com/groovesalad-256-mp3',              country: 'US',  freq: 94.5 },
  { name: 'Classic FM',          url: 'https://media-ice.musicradio.com/ClassicFMMP3',            country: 'UK',  freq: 96.3 },
  { name: 'Soma FM Drone Zone',  url: 'https://ice1.somafm.com/dronezone-256-mp3',                country: 'US',  freq: 97.9 },
  { name: 'Radio Paradise',      url: 'https://stream.radioparadise.com/mp3-128',                 country: 'US',  freq: 99.5 },
  { name: 'KEXP',                url: 'https://live-mp3-128.kexp.org/',                            country: 'US',  freq: 101.1},
  { name: 'Soma FM Space Station',url:'https://ice1.somafm.com/spacestation-128-mp3',             country: 'US',  freq: 102.5},
  { name: 'Virgin Radio Hits',   url: 'https://icecast.unitedradio.it/Virgin.mp3',                country: 'IT',  freq: 104.0},
  { name: 'Lofi Hip-Hop Beats',  url: 'https://radio.streemlion.com:2500/stream',                 country: 'US',  freq: 105.5},
  { name: 'Ibiza Global Radio',  url: 'https://ibizaglobalradio.streaming-pro.com:7002/stream',   country: 'ES',  freq: 107.2},
];

// Extra free world radio stations spanning more countries and public broadcasters.
const EXTRA_STATIONS = [
  { name: 'BBC Radio 1',          url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one',          country: 'UK',  freq: 88.7 },
  { name: 'BBC Radio 4',          url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_fourfm',       country: 'UK',  freq: 89.4 },
  { name: 'BBC 6 Music',         url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_6music',             country: 'UK',  freq: 92.3 },
  { name: 'Deutschlandfunk',     url: 'http://stream.dradio.de/dlf_mids_128.mp3',                     country: 'DE',  freq: 95.1 },
  { name: 'FIP',                  url: 'http://icecast.radiofrance.fr/fip-midfi.mp3',                 country: 'FR',  freq: 98.2 },
  { name: 'WNYC FM',             url: 'https://stream.wnyc.org/wnyc-fm',                              country: 'US',  freq: 100.4},
  { name: 'Soma FM Secret Agent',url: 'https://ice1.somafm.com/secretagent-128-mp3',                 country: 'US',  freq: 103.3},
  { name: 'Soma FM Indie Pop',   url: 'https://ice1.somafm.com/indiepop-128-mp3',                    country: 'US',  freq: 106.6},
];

const ALL_STATIONS = [...SCAN_STATIONS, ...EXTRA_STATIONS];

export default function Radio() {
  const { t } = useLanguage();
  const [tab, setTab] = useState('dial');
  const [frequency, setFrequency] = useState(99.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStation, setCurrentStation] = useState(null);
  const [volume, setVolume] = useState(player.volume);
  const [muted, setMuted] = useState(player.muted);
  const [loading, setLoading] = useState(false);

  // Sync state with player singleton
  useEffect(() => {
    const unsub = player.subscribe(() => {
      setIsPlaying(player.isPlaying());
      setCurrentStation(player.currentStation);
      setVolume(player.volume);
      setMuted(player.muted);
    });
    // Restore state if player is already active
    setIsPlaying(player.isPlaying());
    setCurrentStation(player.currentStation);
    return unsub;
  }, []);

  const playStation = (station) => {
    setLoading(true);
    player.play(station);
    setCurrentStation(station);
    setIsPlaying(true);
    setLoading(false);
    addHistoryEntry({ tool: 'radio', input: station.freq ? `${station.freq} MHz` : undefined, isSearchAction: !station.freq, result: station.name, mode: 'station' });
    haptics.success();
  };

  const stopPlayback = () => {
    player.stop();
    setIsPlaying(false);
    setCurrentStation(null);
    haptics.click();
  };

  const handleFreqChange = (freq) => {
    setFrequency(freq);
  };

  const handleScan = (direction) => {
    haptics.click();
    const sorted = [...ALL_STATIONS].sort((a, b) => a.freq - b.freq);
    const current = sorted.findIndex(s => Math.abs(s.freq - frequency) < 0.6);
    let next;
    if (direction > 0) {
      next = sorted.find(s => s.freq > frequency + 0.4) || sorted[0];
    } else {
      const before = sorted.filter(s => s.freq < frequency - 0.4);
      next = before[before.length - 1] || sorted[sorted.length - 1];
    }
    if (next) {
      setFrequency(next.freq);
      playStation(next);
    }
  };

  // Find nearest scan station to current frequency
  const nearestStation = ALL_STATIONS.reduce((best, s) =>
    Math.abs(s.freq - frequency) < Math.abs(best.freq - frequency) ? s : best
  );
  const isNearStation = Math.abs(nearestStation.freq - frequency) < 0.6;

  return (
    <div className="flex flex-col h-screen p-3 max-w-md mx-auto w-full select-none">

      {/* Display Screen */}
      <div className="display-screen mb-3 flex-shrink-0">
        {/* Station info */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <RadioIcon
              className="w-4 h-4 shrink-0"
              style={{ color: isPlaying ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', filter: isPlaying ? 'drop-shadow(0 0 4px hsl(var(--primary)))' : 'none' }}
            />
            <div className="min-w-0">
              <p
                className="text-sm font-bold font-mono truncate"
                style={{ color: 'hsl(var(--foreground))', textShadow: isPlaying ? '0 0 8px hsl(var(--primary) / 0.4)' : 'none' }}
              >
                {currentStation?.name || (isNearStation ? nearestStation.name : t('radioNoSignal'))}
              </p>
              <p className="text-[10px] font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {currentStation?.country || (isNearStation ? nearestStation.country : '– – –')}
              </p>
            </div>
          </div>

          {/* Play/Stop */}
          <button
            onClick={isPlaying ? stopPlayback : () => isNearStation && playStation(nearestStation)}
            className="calc-btn w-9 h-9 flex items-center justify-center shrink-0"
            style={{
              background: isPlaying ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
              color: isPlaying ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
              border: isPlaying ? '1px solid hsl(var(--primary) / 0.6)' : '1px solid hsl(var(--border))',
              boxShadow: isPlaying ? '0 0 12px hsl(var(--primary) / 0.4)' : undefined,
            }}
          >
            {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Visualizer */}
        <RadioVisualizer isPlaying={isPlaying} height={64} />

        {/* Volume controls */}
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid hsl(var(--border) / 0.4)' }}>
          <RadioControls
            volume={volume}
            muted={muted}
            onVolumeChange={setVolume}
            onMuteToggle={() => setMuted(m => !m)}
          />
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar mb-2 shrink-0">
        {TAB_DEFS.map(tabDef => {
          const Icon = tabDef.icon;
          return (
            <button
              key={tabDef.id}
              onClick={() => { setTab(tabDef.id); haptics.tap(); }}
              className={cn('tab-item flex items-center justify-center gap-1.5 text-xs')}
              style={tab === tabDef.id ? { color: 'hsl(var(--foreground))', background: 'hsl(var(--card))', boxShadow: '2px 2px 6px rgba(0,0,0,0.4)' } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              {t(tabDef.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {tab === 'dial' && (
          <div className="flex flex-col items-center gap-4 h-full overflow-y-auto py-2">
            <TuningDial
              frequency={frequency}
              onChange={handleFreqChange}
              onScan={handleScan}
            />

            {/* Nearby stations on the dial */}
            <div className="w-full space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest px-1" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
                {t('radioNearby')}
              </p>
              {ALL_STATIONS
                .filter(s => Math.abs(s.freq - frequency) <= 4)
                .sort((a, b) => Math.abs(a.freq - frequency) - Math.abs(b.freq - frequency))
                .slice(0, 4)
                .map(s => {
                  const dist = Math.abs(s.freq - frequency);
                  const isActive = currentStation?.url === s.url;
                  return (
                    <button
                      key={s.url}
                      onClick={() => { setFrequency(s.freq); playStation(s); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all"
                      style={{
                        background: isActive ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--secondary) / 0.5)',
                        border: isActive ? '1px solid hsl(var(--primary) / 0.4)' : '1px solid hsl(var(--border) / 0.5)',
                        opacity: dist < 0.6 ? 1 : 0.6,
                      }}
                    >
                      <span className="text-xs font-mono font-bold w-12 shrink-0" style={{ color: 'hsl(var(--primary))' }}>
                        {s.freq.toFixed(1)}
                      </span>
                      <span className="flex-1 text-sm text-left truncate" style={{ color: 'hsl(var(--foreground))' }}>{s.name}</span>
                      {isActive && <Play className="w-3 h-3 shrink-0" style={{ color: 'hsl(var(--primary))' }} />}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {tab === 'bands' && (
          <div className="h-full overflow-hidden">
            <ScannerBands onPlay={playStation} currentStation={currentStation} />
          </div>
        )}

        {tab === 'search' && (
          <div className="h-full overflow-hidden">
            <StationSearch onPlay={playStation} currentStation={currentStation} />
          </div>
        )}

        {tab === 'presets' && (
          <div className="h-full overflow-hidden">
            <StationPresets
              currentStation={currentStation}
              isPlaying={isPlaying}
              onPlay={playStation}
            />
          </div>
        )}
      </div>
    </div>
  );
}