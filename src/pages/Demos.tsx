import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Pause } from 'lucide-react';
import './Demos.css';

type DemoEntry = {
  file: string;
  slug?: string;
  title?: string;
};

type DemoConfig = {
  demos?: DemoEntry[];
};

type DemosProps = {
  isSidebarCollapsed?: boolean;
  onCollapseSidebar?: (collapsed: boolean) => void;
};

const DEMOS_CONFIG_PATH = '/demo_videos/demos.json';

const stripExtension = (fileName: string) => fileName.replace(/\.[^/.]+$/, '');

const formatTitle = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .trim();

const findDemo = (videoName: string, entries: DemoEntry[]): DemoEntry | null => {
  const target = videoName.toLowerCase();
  const targetWithMp4 = `${target}.mp4`;

  return (
    entries.find((entry) => {
      const slug = (entry.slug || stripExtension(entry.file)).toLowerCase();
      const fileName = entry.file.toLowerCase();
      return (
        slug === target ||
        stripExtension(fileName) === target ||
        fileName === target ||
        fileName === targetWithMp4
      );
    }) ?? null
  );
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const Demos: React.FC<DemosProps> = ({ isSidebarCollapsed, onCollapseSidebar }) => {
  const { videoName = '' } = useParams<{ videoName: string }>();
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState<DemoEntry | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (onCollapseSidebar && isSidebarCollapsed === false) {
      onCollapseSidebar(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadDemo = async () => {
      setLoading(true);
      setMessage(null);
      setDemo(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setVideoReady(false);
      setBuffering(true);

      try {
        const response = await fetch(DEMOS_CONFIG_PATH, { cache: 'no-cache' });
        if (!response.ok) throw new Error('Demo list unavailable');

        const data = (await response.json()) as DemoConfig;
        const demos = Array.isArray(data.demos) ? data.demos : [];
        const match = findDemo(videoName, demos);

        if (!isMounted) return;

        if (!match) {
          setMessage('No Demo Found');
        } else {
          setDemo(match);
        }
      } catch {
        if (isMounted) setMessage('Unable to load demo list.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDemo();
    return () => {
      isMounted = false;
    };
  }, [videoName]);

  const videoUrl = useMemo(() => (demo ? `/demo_videos/${demo.file}` : null), [demo]);
  const thumbnailUrl = useMemo(
    () => (demo ? `/demo_videos/${stripExtension(demo.file)}.png` : null),
    [demo]
  );

  useEffect(() => {
    if (!videoUrl) return;
    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'video';
    preload.href = videoUrl;
    document.head.appendChild(preload);
    return () => {
      if (preload.parentNode) preload.parentNode.removeChild(preload);
    };
  }, [videoUrl]);

  const togglePlayPause = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!videoReady) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        togglePlayPause();
      } else if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoReady]);

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const newTime = parseFloat(event.target.value);
    v.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const heading = useMemo(() => {
    if (demo?.title) return demo.title;
    if (videoName) return formatTitle(videoName);
    return 'Demo';
  }, [demo, videoName]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="demo-page">
      <div className="demo-container">
        <div className="demo-header-row">
          <div className="demo-header">
            <h1 className="demo-title">{heading}</h1>
            {loading && <p className="demo-subtitle">Loading demo...</p>}
            {!loading && !demo && !message && (
              <p className="demo-subtitle">No Demo Found</p>
            )}
          </div>
        </div>

        {message && (
          <div className="demo-message" role="alert">
            {message}
          </div>
        )}

        {!loading && demo && videoUrl && (
          <div className="demo-video-wrapper">
            <div
              ref={containerRef}
              className="demo-video-container"
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            >
              {!videoReady && (
                <div className="demo-video-skeleton" aria-hidden="true">
                  <div className="demo-skeleton-shimmer" />
                  <div className="demo-loading-spinner" />
                </div>
              )}

              {!hasStarted && thumbnailUrl && (
                <img
                  src={thumbnailUrl}
                  alt=""
                  className="demo-video-thumbnail"
                  aria-hidden="true"
                  onClick={togglePlayPause}
                />
              )}

              <video
                ref={videoRef}
                className="demo-video"
                preload="auto"
                poster={thumbnailUrl ?? undefined}
                playsInline
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onCanPlay={() => {
                  setVideoReady(true);
                  setBuffering(false);
                }}
                onWaiting={() => setBuffering(true)}
                onPlaying={() => setBuffering(false)}
                onPlay={() => {
                  setIsPlaying(true);
                  setHasStarted(true);
                }}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onClick={togglePlayPause}
              >
                <source src={videoUrl} type="video/mp4" />
              </video>

              {videoReady && buffering && (
                <div className="demo-loading-spinner demo-loading-spinner--overlay" />
              )}

              {(!hasStarted || (videoReady && !isPlaying)) && !buffering && (
                <button
                  type="button"
                  className="demo-video-center-btn"
                  onClick={togglePlayPause}
                  aria-label="Play video"
                >
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="#fff"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path d="M8 5.14v13.72a1 1 0 0 0 1.52.86l10.3-6.86a1 1 0 0 0 0-1.72L9.52 4.28A1 1 0 0 0 8 5.14z" />
                  </svg>
                </button>
              )}

              <div className={`demo-video-controls ${hovering && videoReady ? 'visible' : ''}`}>
                <input
                  type="range"
                  className="demo-video-scrubber"
                  min={0}
                  max={duration || 0}
                  step={0.01}
                  value={currentTime}
                  onChange={handleSeek}
                  aria-label="Seek"
                  style={{ ['--progress' as any]: `${progress}%` }}
                />
                <span className="demo-video-time">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Demos;
