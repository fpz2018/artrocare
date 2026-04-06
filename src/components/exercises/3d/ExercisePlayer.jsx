import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Player } from '@remotion/player';
import { Play, Pause, RotateCcw, Gauge, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n';
import ExerciseComposition from './ExerciseComposition';
import ExerciseOverlay from './ExerciseOverlay';

const SPEEDS = [0.5, 1, 1.5];

/**
 * ExercisePlayer — Remotion Player wrapper with custom controls.
 * Supports: play/pause, reset, speed control, step-by-step mode.
 */
export default function ExercisePlayer({ exerciseData, className = '' }) {
  const { t } = useI18n();
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedIndex, setSpeedIndex] = useState(1); // default 1x
  const [currentFrame, setCurrentFrame] = useState(0);

  const fps = exerciseData.fps || 30;
  const duration = exerciseData.duration || 4;
  const totalFrames = fps * duration;
  const normalizedTime = (currentFrame % totalFrames) / totalFrames;

  // Sync play state with player
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onFrameUpdate = (e) => setCurrentFrame(e.detail.frame);

    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);
    player.addEventListener('frameupdate', onFrameUpdate);

    return () => {
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
      player.removeEventListener('frameupdate', onFrameUpdate);
    };
  }, []);

  const handlePlayPause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [isPlaying]);

  const handleReset = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(0);
    player.play();
  }, []);

  const handleSpeedCycle = useCallback(() => {
    setSpeedIndex(prev => {
      const next = (prev + 1) % SPEEDS.length;
      // Remotion Player doesn't have a direct speed API, we handle it via playbackRate
      return next;
    });
  }, []);

  // Step-by-step: advance or go back by a fraction of the cycle
  const stepSize = Math.round(totalFrames / 8); // 8 steps per cycle

  const handleStepForward = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    player.pause();
    const next = Math.min(currentFrame + stepSize, totalFrames - 1);
    player.seekTo(next);
  }, [currentFrame, stepSize, totalFrames]);

  const handleStepBack = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    player.pause();
    const prev = Math.max(currentFrame - stepSize, 0);
    player.seekTo(prev);
  }, [currentFrame, stepSize]);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 3D Scene container with overlay */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-lg overflow-hidden bg-white">
        <Player
          ref={playerRef}
          component={ExerciseComposition}
          inputProps={{ exerciseData }}
          durationInFrames={totalFrames}
          compositionWidth={800}
          compositionHeight={600}
          fps={fps}
          loop
          autoPlay
          playbackRate={SPEEDS[speedIndex]}
          style={{ width: '100%', height: '100%' }}
          controls={false}
          showVolumeControls={false}
        />

        {/* HTML overlay on top of the Player */}
        <ExerciseOverlay
          exerciseData={exerciseData}
          normalizedTime={normalizedTime}
        />
      </div>

      {/* Custom controls bar */}
      <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
        {/* Step back */}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={handleStepBack}
          title={t('ex_ctrl_step_back')}
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        {/* Play / Pause */}
        <Button
          variant="default"
          size="icon"
          className="h-10 w-10"
          onClick={handlePlayPause}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        {/* Step forward */}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={handleStepForward}
          title={t('ex_ctrl_step_forward')}
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        {/* Reset */}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={handleReset}
          title={t('ex_ctrl_reset')}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        {/* Speed */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1 px-3"
          onClick={handleSpeedCycle}
        >
          <Gauge className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{SPEEDS[speedIndex]}x</span>
        </Button>

        {/* Progress indicator */}
        <Badge variant="secondary" className="text-xs ml-1">
          {Math.round(normalizedTime * 100)}%
        </Badge>
      </div>
    </div>
  );
}
