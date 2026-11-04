'use client'

import { useEffect, useRef, useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { formatRupiah } from '@/utils/format';
import { subscribeToCreatorDonations, subscribeToCreatorEvent } from '@/lib/pusher';
import { ALERT_FONT_FAMILIES } from '@/utils/alertFonts';
import { getAmountStyle } from '@/utils/alertStyles';
import AlertParticles from '@/components/atoms/AlertParticles';

// Constants
const NOTIFICATION_DURATION = 8000; // 8 seconds
const RECENT_NOTIFICATION_THRESHOLD = 5000; // 5 seconds (increased for reliability)
const DEFAULT_ALERT_STYLE = {
  backgroundColor: 'transparent',
  borderColor: '#2563EB',
  textColor: '#0F2A5F',
  amountColor: '#2563EB',
  backgroundImage: '',
  backgroundImageOpacity: 0.62,
  fontFamily: 'modern',
  amountStyle: 'solid',
  particleStyle: 'confetti',
  messagePrefix: '',
  messageSuffix: '',
  decorations: [],
};

const CUSTOM_ALERT_STYLE = {
  ...DEFAULT_ALERT_STYLE,
  backgroundColor: '#0B1F3A',
  textColor: '#FFFFFF',
  amountColor: '#60A5FA',
};

const getAmountFontSize = (amountLabel) => {
  const digitCount = String(amountLabel || '').replace(/\D/g, '').length;

  if (digitCount >= 10) return 'clamp(2rem, 5.5vw, 3rem)';
  if (digitCount >= 8) return 'clamp(2.25rem, 6vw, 3.5rem)';
  if (digitCount >= 7) return 'clamp(2.5rem, 6.5vw, 4rem)';
  return '';
};

const getSafeBackgroundImage = (value) => {
  if (!value || typeof value !== 'string') return '';

  try {
    const url = new URL(value, window.location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
};

const resolveAlertStyle = (notificationConfig = {}) => {
  if (notificationConfig.alertMode !== 'custom') return DEFAULT_ALERT_STYLE;

  return { ...CUSTOM_ALERT_STYLE, ...(notificationConfig.alertStyle || {}) };
};

const numberToIndonesianWords = (value) => {
  const number = Math.floor(Number(value) || 0);
  const words = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

  if (number < 0) return `minus ${numberToIndonesianWords(Math.abs(number))}`;
  if (number < 12) return words[number];
  if (number < 20) return `${numberToIndonesianWords(number - 10)} belas`;
  if (number < 100) return `${numberToIndonesianWords(Math.floor(number / 10))} puluh ${numberToIndonesianWords(number % 10)}`.trim();
  if (number < 200) return `seratus ${numberToIndonesianWords(number - 100)}`.trim();
  if (number < 1000) return `${numberToIndonesianWords(Math.floor(number / 100))} ratus ${numberToIndonesianWords(number % 100)}`.trim();
  if (number < 2000) return `seribu ${numberToIndonesianWords(number - 1000)}`.trim();
  if (number < 1000000) return `${numberToIndonesianWords(Math.floor(number / 1000))} ribu ${numberToIndonesianWords(number % 1000)}`.trim();
  if (number < 1000000000) return `${numberToIndonesianWords(Math.floor(number / 1000000))} juta ${numberToIndonesianWords(number % 1000000)}`.trim();
  return String(number);
};

export default function NotificationsOverlay() {
  const params = useParams();
  const username = params?.username;
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [alertStyle, setAlertStyle] = useState(DEFAULT_ALERT_STYLE);
  
  // Refs for state management without re-renders
  const isShowingRef = useRef(false);
  const queueRef = useRef([]);
  const receivedDonationIdsRef = useRef(new Set());
  
  // Refs for timers and DOM elements
  const audioRef = useRef(null);
  const speechRef = useRef(null);
  const pendingAudioRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const notificationRef = useRef(null);
  const alertCardRef = useRef(null);
  const progressBarRef = useRef(null);
  const messageRef = useRef(null);
  const amountRef = useRef(null);
  const detailRef = useRef(null);
  const timeRef = useRef(null);
  const progressAnimationFrameRef = useRef(null);
  const progressStartTimeRef = useRef(null);

  useEffect(() => {
    let active = true;

    const loadAlertStyle = async () => {
      try {
        const response = await axios.get(`/api/overlay-config/notifications?username=${encodeURIComponent(username)}`);
        if (active) {
          setAlertStyle(resolveAlertStyle(response.data || {}));
        }
      } catch (error) {
        console.error('Gagal memuat tampilan alert:', error);
      }
    };

    if (username) loadAlertStyle();

    return () => {
      active = false;
    };
  }, [username]);

  const playAudioFile = useCallback(async (audioUrl, onEnded, onError) => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.src = audioUrl;
    audioRef.current.onended = onEnded || null;
    audioRef.current.onerror = onError || null;
    audioRef.current.currentTime = 0;
    audioRef.current.volume = 1;
    audioRef.current.load();
    await audioRef.current.play();
  }, []);

  // Play notification sound (memoized to prevent recreation)
  const playNotificationSound = useCallback(async (audioUrl, speechText, onEnded, onError) => {
    const playDefaultSound = async () => {
      await playAudioFile('/taco-bell-bong-sfx.mp3');
    };

    const speakWithBrowser = () => {
      if (!speechText || !('speechSynthesis' in window)) return false;

      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(speechText);
        const voices = window.speechSynthesis.getVoices();
        const indonesianVoice = voices.find((voice) => voice.lang?.toLowerCase().startsWith('id'));

        utterance.lang = 'id-ID';
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.voice = indonesianVoice || null;
        utterance.onend = onEnded;
        utterance.onerror = () => {
          speechRef.current = null;
          playDefaultSound().catch(() => {});
          onError?.();
        };

        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        return true;
      } catch (error) {
        console.warn('Browser speech failed:', error.message);
        return false;
      }
    };

    if (audioUrl && audioRef.current) {
      try {
        await playAudioFile(audioUrl, onEnded, () => {
          if (!speakWithBrowser()) {
            playDefaultSound().catch(() => {});
            onError?.();
          }
        });
        pendingAudioRef.current = null;
        setAudioBlocked(false);
        return;
      } catch (error) {
        console.warn('Local speech audio failed:', error.message);

        if (error.name === 'NotAllowedError') {
          pendingAudioRef.current = { audioUrl, onEnded, onError };
          setAudioBlocked(true);
          return;
        }

        if (speakWithBrowser()) return;
        onError?.();
      }
    }

    if (speakWithBrowser()) return;
    if (speechText) {
      onError?.();
    }

    try {
      await playDefaultSound();
    } catch (error) {
      console.warn('Audio notification failed:', error.message);

      if (error.name === 'NotAllowedError') {
        pendingAudioRef.current = { audioUrl: '/taco-bell-bong-sfx.mp3' };
        setAudioBlocked(true);
      }
    }
  }, [playAudioFile]);

  const activateAudio = useCallback(async () => {
    const pendingAudio = pendingAudioRef.current;

    try {
      await playAudioFile(
        pendingAudio?.audioUrl || '/taco-bell-bong-sfx.mp3',
        pendingAudio?.onEnded,
        pendingAudio?.onError,
      );
      pendingAudioRef.current = null;
      setAudioBlocked(false);
    } catch (error) {
      console.warn('Audio activation failed:', error.message);
      setAudioBlocked(true);
    }
  }, [playAudioFile]);

  // Cleanup function for timers and animations
  const cleanupTimers = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    if (progressAnimationFrameRef.current) {
      cancelAnimationFrame(progressAnimationFrameRef.current);
      progressAnimationFrameRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      speechRef.current = null;
    }
  }, []);

  // Animate progress bar with optimized requestAnimationFrame
  const startProgressBar = useCallback(() => {
    if (progressAnimationFrameRef.current) {
      cancelAnimationFrame(progressAnimationFrameRef.current);
    }
    
    // Reset progress bar
    if (progressBarRef.current) {
      progressBarRef.current.style.width = '0%';
    }
    
    progressStartTimeRef.current = performance.now();
    
    // Optimized animation loop
    const animate = (currentTime) => {
      // Early exit if ref is null
      if (!progressBarRef.current) {
        progressAnimationFrameRef.current = null;
        return;
      }
      
      const elapsed = currentTime - progressStartTimeRef.current;
      const progress = Math.min((elapsed / NOTIFICATION_DURATION) * 100, 100);
      
      progressBarRef.current.style.width = `${progress}%`;
      
      // Continue only if not complete
      if (progress < 100) {
        progressAnimationFrameRef.current = requestAnimationFrame(animate);
      } else {
        progressAnimationFrameRef.current = null;
      }
    };
    
    progressAnimationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // Display notification (extracted for reuse)
  const displayNotification = useCallback((notificationData, onAudioEnded, onAudioError) => {
    if (!notificationRef.current) return;
    
    // Update all DOM elements
    notificationRef.current.style.display = 'flex';

    if (alertCardRef.current) {
      alertCardRef.current.classList.remove('johen-alert-enter');
      void alertCardRef.current.offsetWidth;
      alertCardRef.current.classList.add('johen-alert-enter');
    }
    
    if (messageRef.current) {
      messageRef.current.textContent = notificationData.donorName || notificationData.message;
    }

    if (amountRef.current) {
      const amountLabel = notificationData.amountLabel || '';
      amountRef.current.textContent = amountLabel;
      amountRef.current.style.display = amountLabel ? 'block' : 'none';
      amountRef.current.style.fontSize = getAmountFontSize(amountLabel);
    }
    
    if (detailRef.current) {
      const message = typeof notificationData.detail === 'string' ? notificationData.detail.trim() : '';
      detailRef.current.textContent = message
        ? `${alertStyle.messagePrefix || ''}${message}${alertStyle.messageSuffix || ''}`
        : 'Tanpa pesan';
      detailRef.current.style.display = 'block';
    }

    if (timeRef.current) {
      timeRef.current.textContent = notificationData.time;
    }
    
    startProgressBar();
    playNotificationSound(notificationData.audioUrl, notificationData.speechText, onAudioEnded, onAudioError);
  }, [startProgressBar, playNotificationSound, alertStyle.messagePrefix, alertStyle.messageSuffix]);

  // Process queue - using ref pattern to avoid circular dependency
  const processQueue = useCallback(() => {
    if (isShowingRef.current || queueRef.current.length === 0) return;
    
    const [current, ...rest] = queueRef.current;
    queueRef.current = rest;
    isShowingRef.current = true;
    let finished = false;

    const finishNotification = () => {
      if (finished) return;
      finished = true;
      cleanupTimers();

      if (audioRef.current) {
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
      }
      pendingAudioRef.current = null;
      setAudioBlocked(false);

      if (notificationRef.current) {
        notificationRef.current.style.display = 'none';
      }
      isShowingRef.current = false;

      setTimeout(() => {
        if (!isShowingRef.current && queueRef.current.length > 0) {
          processQueue();
        }
      }, 100);
    };

    const hasSpeech = Boolean(current.audioUrl || current.speechText);

    hideTimeoutRef.current = setTimeout(
      finishNotification,
      hasSpeech ? 300000 : NOTIFICATION_DURATION
    );

    const handleAudioError = () => {
      if (finished) return;
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(finishNotification, NOTIFICATION_DURATION);
    };

    displayNotification(
      current,
      hasSpeech ? finishNotification : undefined,
      hasSpeech ? handleAudioError : undefined
    );
  }, [displayNotification, cleanupTimers]);

  const enqueueDonation = useCallback((donation) => {
    if (!donation?._id || donation.mediaShareRequest?.enabled) return;
    if (receivedDonationIdsRef.current.has(donation._id)) return;

    receivedDonationIdsRef.current.add(donation._id);
    queueRef.current = [...queueRef.current, {
      message: `Donasi baru dari ${donation.name} sebesar ${formatRupiah(donation.amount)}`,
      donorName: donation.name,
      amountLabel: formatRupiah(donation.amount),
      detail: donation.message || '',
      time: new Date(donation.createdAt).toLocaleTimeString('id-ID'),
      timestamp: Date.now(),
      _id: donation._id,
      audioUrl: donation.audioUrl,
      speechText: donation.ttsEnabled
        ? `${numberToIndonesianWords(donation.amount)} dari ${donation.name}.${donation.message ? ` Pesan: ${donation.message}` : ' Tanpa pesan.'}`
        : ''
    }];

    if (!isShowingRef.current) {
      processQueue();
    }
  }, [processQueue]);

  const syncMissedDonations = useCallback(async () => {
    if (!username) return;

    const storageKey = `overlay-notification-last-seen:${username.toLowerCase()}`;
    const since = localStorage.getItem(storageKey)
      || new Date(Date.now() - (5 * 60 * 1000)).toISOString();

    try {
      const response = await fetch(`/api/overlay/latest-donations?username=${username}&since=${encodeURIComponent(since)}`);
      if (!response.ok) return;

      const data = await response.json();
      data.donations?.slice().reverse().forEach(enqueueDonation);
      localStorage.setItem(storageKey, data.timestamp || new Date().toISOString());
    } catch (error) {
      console.error('Gagal menyinkronkan notifikasi:', error);
    }
  }, [username, enqueueDonation]);

  useEffect(() => {
    if (!username) return;

    return subscribeToCreatorDonations(username, ({ donation }) => {
      enqueueDonation(donation);
      localStorage.setItem(
        `overlay-notification-last-seen:${username.toLowerCase()}`,
        new Date().toISOString()
      );
    }, { onSubscribed: syncMissedDonations });
  }, [username, enqueueDonation, syncMissedDonations]);

  useEffect(() => {
    if (!username) return;

    return subscribeToCreatorEvent(username, 'overlay.config', ({ config }) => {
      const notificationConfig = config?.notifications || {};
      setAlertStyle(resolveAlertStyle(notificationConfig));
    });
  }, [username]);

  // Listen for preview notifications (optimized)
  useEffect(() => {
    if (!username) return;

    const showPreviewNotification = (notificationData) => {
      cleanupTimers();
      isShowingRef.current = true;
      let finished = false;

      const finishPreview = () => {
        if (finished) return;
        finished = true;
        cleanupTimers();

        if (audioRef.current) {
          audioRef.current.onended = null;
          audioRef.current.onerror = null;
        }

        if (notificationRef.current) {
          notificationRef.current.style.display = 'none';
        }
        isShowingRef.current = false;
      };

      const hasSpeech = Boolean(notificationData.audioUrl || notificationData.speechText);
      const handleAudioError = () => {
        if (finished) return;
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(finishPreview, NOTIFICATION_DURATION);
      };

      hideTimeoutRef.current = setTimeout(
        finishPreview,
        hasSpeech ? 300000 : NOTIFICATION_DURATION
      );

      displayNotification(
        notificationData,
        hasSpeech ? finishPreview : undefined,
        hasSpeech ? handleAudioError : undefined
      );
    };

    const unsubscribeReplay = subscribeToCreatorEvent(username, 'overlay.replay', ({ type, data }) => {
      if (type === 'notification') {
        showPreviewNotification(data);
      }
    });

    // Also listen for localStorage (for browser-based testing)
    const handleStorageChange = (e) => {
      if (e.key === 'overlay-notification-trigger' && e.newValue) {
        try {
          const notificationData = JSON.parse(e.newValue);
          showPreviewNotification(notificationData);
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Check localStorage once on mount
    const checkForTrigger = () => {
      const triggerData = localStorage.getItem('overlay-notification-trigger');
      if (!triggerData) return;
      
      try {
        const notificationData = JSON.parse(triggerData);
        if (Date.now() - notificationData.timestamp < RECENT_NOTIFICATION_THRESHOLD) {
          showPreviewNotification(notificationData);
          localStorage.removeItem('overlay-notification-trigger');
        }
      } catch (error) {
        console.error('Error parsing stored notification:', error);
      }
    };
    
    checkForTrigger();

    return () => {
      unsubscribeReplay();
      window.removeEventListener('storage', handleStorageChange);
      cleanupTimers();
    };
  }, [username, displayNotification, cleanupTimers]);

  if (!username) {
    return null; // Don't render anything if no username
  }

  const backgroundImage = getSafeBackgroundImage(alertStyle.backgroundImage);
  const decorations = alertStyle.decorations?.length
    ? alertStyle.decorations
    : alertStyle.decorationImage
      ? [{
          id: 'legacy',
          image: alertStyle.decorationImage,
          x: alertStyle.decorationX ?? 82,
          y: alertStyle.decorationY ?? 50,
          size: alertStyle.decorationSize ?? 18,
          rotation: alertStyle.decorationRotation ?? 0,
          flipX: alertStyle.decorationFlipX ?? false,
          flipY: alertStyle.decorationFlipY ?? false,
        }]
      : [];
  const backgroundImageOpacity = Math.min(1, Math.max(0, Number(alertStyle.backgroundImageOpacity) || 0));
  const alertCardStyle = {
    backgroundColor: alertStyle.backgroundColor,
    borderColor: alertStyle.borderColor,
    fontFamily: ALERT_FONT_FAMILIES[alertStyle.fontFamily] || ALERT_FONT_FAMILIES.modern,
  };
  const alertImageStyle = backgroundImage ? {
    backgroundImage: `url("${backgroundImage}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: backgroundImageOpacity,
  } : null;

  return (
    <div className="fixed inset-0 font-sans antialiased">
      <style>{`
        @keyframes johen-alert-in {
          0% { opacity: 0; transform: translateY(24px) scale(.97); filter: blur(8px); }
          65% { opacity: 1; transform: translateY(-2px) scale(1.005); filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes johen-alert-glow {
          0%, 100% { opacity: .35; transform: scale(.98); }
          50% { opacity: .65; transform: scale(1.03); }
        }

        .johen-alert-enter {
          animation: johen-alert-in 340ms cubic-bezier(.22, 1, .36, 1) both;
        }

        .johen-alert-glow {
          animation: johen-alert-glow 2.4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .johen-alert-enter, .johen-alert-glow { animation: none; }
        }
      `}</style>

      {/* Audio element */}
      <audio
        ref={audioRef}
        preload="auto"
        src="/taco-bell-bong-sfx.mp3"
      />

      {/* Notification container (always mounted, display controlled) */}
      <div 
        ref={notificationRef}
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
        style={{ display: 'none' }}
        role="status"
        aria-live="polite"
      >
        <div ref={alertCardRef} className="johen-alert-enter relative flex min-h-80 w-[min(98vw,920px)] items-center justify-center overflow-hidden rounded-[28px] border-[4px] px-8 py-12 text-center shadow-[0_28px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:px-16" style={alertCardStyle}>
          {alertImageStyle && <div className="absolute inset-0" style={alertImageStyle} />}
          {decorations.map((decoration) => {
            const image = getSafeBackgroundImage(decoration.image);
            if (!image) return null;

            return (
              <img
                key={decoration.id}
                src={image}
                alt=""
                className="pointer-events-none absolute z-10 select-none object-contain"
                style={{
                  left: `${Math.min(100, Math.max(0, Number(decoration.x) || 0))}%`,
                  top: `${Math.min(100, Math.max(0, Number(decoration.y) || 0))}%`,
                  width: `${Math.min(100, Math.max(5, Number(decoration.size) || 18))}%`,
                  maxHeight: '90%',
                  transform: `translate(-50%, -50%) rotate(${Math.min(180, Math.max(-180, Number(decoration.rotation) || 0))}deg) scaleX(${decoration.flipX ? -1 : 1}) scaleY(${decoration.flipY ? -1 : 1})`,
                }}
              />
            );
          })}
          <AlertParticles type={alertStyle.particleStyle} color={alertStyle.amountColor} />

          <div className="relative z-20 flex max-w-full flex-col items-center">
            <div ref={amountRef} className="max-w-full whitespace-nowrap text-5xl font-black leading-none tabular-nums sm:text-7xl" style={getAmountStyle(alertStyle.amountStyle, alertStyle.amountColor, alertStyle.textColor)}></div>
            <div ref={messageRef} className="mt-3 break-words text-2xl font-black leading-tight sm:text-4xl" style={{ color: alertStyle.textColor }}></div>
            <div ref={detailRef} className="mt-3 break-words text-2xl font-semibold leading-tight sm:text-4xl" style={{ display: 'none', color: alertStyle.textColor, opacity: .9 }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
