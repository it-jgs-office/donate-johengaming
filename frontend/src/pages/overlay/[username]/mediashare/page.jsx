"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { subscribeToCreatorDonations, subscribeToCreatorEvent } from "@/lib/pusher";
import { ALERT_FONT_FAMILIES } from "@/utils/alertFonts";
import { getAmountStyle } from "@/utils/alertStyles";
import AlertParticles from "@/components/atoms/AlertParticles";

const DEFAULT_ALERT_STYLE = {
  backgroundColor: "#0B1F3A",
  borderColor: "#2563EB",
  textColor: "#FFFFFF",
  amountColor: "#60A5FA",
  backgroundImage: "",
  backgroundImageOpacity: 0.62,
  fontFamily: "modern",
  amountStyle: "solid",
  particleStyle: "none",
  messagePrefix: "",
  messageSuffix: "",
  decorations: [],
};

const getSafeBackgroundImage = (value) => {
  if (!value || typeof value !== "string") return "";

  try {
    const url = new URL(value, window.location.origin);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
};

const getYouTubeVideoId = (value) => {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (hostname === "youtube.com" || hostname.endsWith(".youtube.com")) {
      const videoId = url.searchParams.get("v");
      if (videoId) return videoId;

      const [type, id] = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(type)) return id || null;
    }
  } catch {
    return null;
  }

  return null;
};

export default function MediaShareOverlay() {
  const { username } = useParams();

  const playerRef = useRef(null);
  const ytReadyRef = useRef(false);

  const currentRef = useRef(null);
  const isPlayingRef = useRef(false);
  const isFinishingRef = useRef(false);
  const playedIdsRef = useRef(new Set());
  const processedReplayIdsRef = useRef(new Set());
  const autoplayRetryRef = useRef(null);
  const unmuteAttemptedRef = useRef(false);
  const pendingReplayRef = useRef(null);
  const pendingMediaShareRef = useRef(null);
  const playbackRetryCountRef = useRef(0);

  const tickRef = useRef(null);

  const [remaining, setRemaining] = useState(0);
  const [, forceRender] = useState(0);
  const [transparentMode, setTransparentMode] = useState(false);
  const [alertStyle, setAlertStyle] = useState(DEFAULT_ALERT_STYLE);

  useEffect(() => {
    if (!username) return;

    let active = true;

    axios.get(`/api/overlay-config/notifications?username=${encodeURIComponent(username)}`)
      .then((response) => {
        if (active) {
          setAlertStyle({ ...DEFAULT_ALERT_STYLE, ...(response.data?.alertStyle || {}) });
        }
      })
      .catch(() => {});

    const unsubscribe = subscribeToCreatorEvent(username, "overlay.config", ({ config }) => {
      const notificationConfig = config?.notifications || {};
      setAlertStyle({ ...DEFAULT_ALERT_STYLE, ...(notificationConfig.alertStyle || {}) });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [username]);

  /* ================= LOAD YT API (OBS SAFE) ================= */
  useEffect(() => {
    const initializePlayer = () => initPlayer();

    if (window.YT?.Player) {
      initializePlayer();
      return;
    }

    const previousReadyHandler = window.onYouTubeIframeAPIReady;
    const readyHandler = () => {
      previousReadyHandler?.();
      initializePlayer();
    };
    window.onYouTubeIframeAPIReady = readyHandler;

    if (!document.getElementById("youtube-iframe-api")) {
      const script = document.createElement("script");
      script.id = "youtube-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      if (window.onYouTubeIframeAPIReady === readyHandler) {
        window.onYouTubeIframeAPIReady = previousReadyHandler;
      }
    };
  }, []);

  const initPlayer = () => {
    if (playerRef.current) return;

    playerRef.current = new window.YT.Player("yt-player", {
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 1,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        enablejsapi: 1,
      },
      events: {
        onReady: (event) => {
          ytReadyRef.current = true;
          try {
            event.target.getIframe().setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
            event.target.mute();
            event.target.setVolume(100);
          } catch {}

          if (pendingReplayRef.current) {
            const pendingReplay = pendingReplayRef.current;
            pendingReplayRef.current = null;
            playVideo(pendingReplay);
          } else if (pendingMediaShareRef.current) {
            const pendingMediaShare = pendingMediaShareRef.current;
            pendingMediaShareRef.current = null;
            playVideo(pendingMediaShare);
          } else {
            fetchQueue();
          }
        },
        onStateChange: onStateChange,
        onAutoplayBlocked: () => forceAutoplay(true),
        onError: () => handlePlayerError(),
      },
    });
  };

  /* ================= PLAYER STATE ================= */
  const handlePlayerError = () => {
    const video = currentRef.current;
    if (!video) return;

    if (playbackRetryCountRef.current >= 2) {
      completeVideo();
      return;
    }

    playbackRetryCountRef.current += 1;
    stopTick();
    clearTimeout(autoplayRetryRef.current);
    autoplayRetryRef.current = setTimeout(() => {
      if (currentRef.current?._id !== video._id) return;

      try {
        playerRef.current.mute();
        playerRef.current.loadVideoById({ videoId: video.videoId, startSeconds: 0 });
        playerRef.current.playVideo();
        forceAutoplay(true);
      } catch {
        handlePlayerError();
      }
    }, 700);
  };

  const onStateChange = (e) => {
    if (!currentRef.current) return;

    if (e.data === window.YT.PlayerState.PLAYING) {
      clearTimeout(autoplayRetryRef.current);
      playbackRetryCountRef.current = 0;
      startTick();

      if (!unmuteAttemptedRef.current) {
        unmuteAttemptedRef.current = true;
        autoplayRetryRef.current = setTimeout(() => {
          if (!currentRef.current) return;
          try {
            playerRef.current.setVolume(100);
            playerRef.current.unMute();
          } catch {}
        }, 350);
      }
    }

    if (e.data === window.YT.PlayerState.ENDED) {
      completeVideo();
      return;
    }

    if (e.data === window.YT.PlayerState.CUED || e.data === window.YT.PlayerState.UNSTARTED) {
      forceAutoplay(true);
    }

    if (e.data === window.YT.PlayerState.PAUSED) {
      stopTick();
      forceAutoplay(true);
    }

    if (e.data === window.YT.PlayerState.BUFFERING) {
      stopTick();
    }
  };

  const forceAutoplay = (mutedFallback = false) => {
    if (!playerRef.current || !currentRef.current) return;

    clearTimeout(autoplayRetryRef.current);
    autoplayRetryRef.current = setTimeout(() => {
      if (!currentRef.current || !isPlayingRef.current) return;
      try {
        if (mutedFallback) playerRef.current.mute();
        playerRef.current.playVideo();
      } catch {}
    }, mutedFallback ? 100 : 250);
  };

  const startTick = () => {
    if (tickRef.current) return;

    tickRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          completeVideo();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTick = () => {
    clearInterval(tickRef.current);
    tickRef.current = null;
  };

  /* ================= PLAY VIDEO ================= */
  const playVideo = async (video) => {
    if (!ytReadyRef.current || isPlayingRef.current) return;

    isPlayingRef.current = true;
    currentRef.current = video;
    playedIdsRef.current.add(video._id);
    unmuteAttemptedRef.current = false;
    playbackRetryCountRef.current = 0;
    setRemaining(video.requestedDuration || 30);
    forceRender((v) => v + 1);

    try {
      playerRef.current.mute();
      playerRef.current.setVolume(100);
      playerRef.current.loadVideoById({
        videoId: video.videoId,
        startSeconds: 0,
      });
      playerRef.current.playVideo();
      forceAutoplay(true);
    } catch {
      isPlayingRef.current = false;
      currentRef.current = null;
      setRemaining(0);
      forceRender((v) => v + 1);
      setTimeout(fetchQueue, 300);
      return;
    }

    try {
      await axios.put(`/api/mediashare/${username}`, {
        id: video._id,
        status: "PLAYING",
      });
    } catch {}
  };

  /* ================= COMPLETE VIDEO ================= */
  const completeVideo = async () => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
    stopTick();
    clearTimeout(autoplayRetryRef.current);
    autoplayRetryRef.current = null;

    const video = currentRef.current;
    if (!video) {
      isFinishingRef.current = false;
      return;
    }

    // Kosongkan status lebih dulu agar perubahan state YouTube tidak memicu autoplay ulang.
    currentRef.current = null;
    isPlayingRef.current = false;
    setRemaining(0);
    forceRender((v) => v + 1);

    try {
      playerRef.current.mute();
      playerRef.current.pauseVideo();
      playerRef.current.stopVideo();
      playerRef.current.clearVideo();
    } catch {}

    // Tutup tampilan segera; penyimpanan status tidak boleh menahan overlay.
    clearTimeout(autoplayRetryRef.current);
    autoplayRetryRef.current = null;
    isFinishingRef.current = false;
    setTimeout(fetchQueue, 300);

    try {
      await axios.put(`/api/mediashare/${username}`, {
        id: video._id,
        status: "PLAYED",
        actualDuration: video.requestedDuration,
      });
    } catch {}
  };

  /* ================= FETCH QUEUE ================= */
  const fetchQueue = async () => {
    if (isPlayingRef.current) return;

    try {
      const res = await axios.get(`/api/mediashare/${username}`);
      const queue = res.data?.data || [];
      const next = queue.find((v) => !playedIdsRef.current.has(v._id));
      if (next) playVideo(next);
    } catch {}
  };

  const queueRealtimeMediaShare = (donation) => {
    const request = donation?.mediaShareRequest;
    if (!request?.enabled || !request.youtubeUrl) return;

    const videoId = getYouTubeVideoId(request.youtubeUrl);
    const donationId = String(donation._id || donation.id || '');
    if (!videoId || !donationId || playedIdsRef.current.has(donationId)) return;

    const video = {
      _id: donationId,
      videoId,
      donorName: donation.name || 'Anonim',
      amount: donation.amount || 0,
      message: donation.message || '',
      requestedDuration: request.duration || 30,
    };

    if (!ytReadyRef.current) {
      pendingMediaShareRef.current = video;
      return;
    }

    if (!isPlayingRef.current) {
      playVideo(video);
    }
  };

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    if (!username) return;
    // Detect transparent mode via query param `?transparent=1` (for TikTok Studio)
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('transparent') === '1' || params.get('tiktok') === '1') {
        setTransparentMode(true);
      }
    } catch (e) {}

    fetchQueue();

    return () => {
      clearTimeout(autoplayRetryRef.current);
      stopTick();
    };
  }, [username]);

  /* ================= REALTIME QUEUE ================= */
  useEffect(() => {
    if (!username) return;

    return subscribeToCreatorDonations(username, ({ donation }) => {
      queueRealtimeMediaShare(donation);
    }, { onSubscribed: fetchQueue });
  }, [username]);

  /* ================= REPLAY LISTENER ================= */
  useEffect(() => {
    if (!username) return;

    const processReplayData = (replayData) => {
      if (!replayData || !replayData.youtubeUrl) return;

      const replayId = String(
        replayData.timestamp
        || `${replayData.youtubeUrl}|${replayData.donorName}|${replayData.amount}|${replayData.duration}`
      );
      if (processedReplayIdsRef.current.has(replayId)) return;

      processedReplayIdsRef.current.add(replayId);
      if (processedReplayIdsRef.current.size > 100) {
        const oldestReplayId = processedReplayIdsRef.current.values().next().value;
        processedReplayIdsRef.current.delete(oldestReplayId);
      }
      
      const videoId = getYouTubeVideoId(replayData.youtubeUrl);
      if (videoId) {
        const replayVideo = {
          _id: `replay-${Date.now()}`,
          videoId,
          donorName: replayData.donorName,
          amount: replayData.amount,
          message: replayData.message || '',
          requestedDuration: replayData.duration || 30,
        };

        if (!ytReadyRef.current) {
          pendingReplayRef.current = replayVideo;
          return;
        }
        
        // Stop current video if playing
        stopTick();
        if (playerRef.current) {
          try { playerRef.current.stopVideo(); } catch {}
        }
        
        // Force play this video
        isPlayingRef.current = false;
        currentRef.current = null;
        playVideo(replayVideo);
      }
    };

    const unsubscribeReplay = subscribeToCreatorEvent(username, "overlay.replay", ({ type, data }) => {
      if (type === "mediashare") {
        processReplayData(data);
      }
    });

    // Also listen for localStorage (for browser-based testing)
    const handleStorageChange = (e) => {
      if (e.key === 'mediashare-replay-trigger' && e.newValue) {
        try {
          const replayData = JSON.parse(e.newValue);
          processReplayData(replayData);
          localStorage.removeItem('mediashare-replay-trigger');
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Check localStorage on mount
    const checkLocalStorage = () => {
      const replayData = localStorage.getItem('mediashare-replay-trigger');
      if (!replayData) return;
      
      try {
        const data = JSON.parse(replayData);
        if (data.timestamp && Date.now() - data.timestamp < 5000) {
          processReplayData(data);
          localStorage.removeItem('mediashare-replay-trigger');
        }
      } catch {}
    };

    checkLocalStorage();

    return () => {
      unsubscribeReplay();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [username]);

  const video = currentRef.current;
  const visible = Boolean(video);
  const requestedDuration = Number(video?.requestedDuration) || 30;
  const playbackProgress = visible
    ? Math.min(100, Math.max(0, ((requestedDuration - remaining) / requestedDuration) * 100))
    : 0;
  const backgroundImage = getSafeBackgroundImage(alertStyle.backgroundImage);
  const backgroundImageOpacity = Math.min(1, Math.max(0, Number(alertStyle.backgroundImageOpacity) || 0));
  const cardStyle = {
    backgroundColor: alertStyle.backgroundColor,
    borderColor: alertStyle.borderColor,
    color: alertStyle.textColor,
    fontFamily: ALERT_FONT_FAMILIES[alertStyle.fontFamily] || ALERT_FONT_FAMILIES.modern,
  };
  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(video?.amount || 0);

  /* ================= RENDER (DOM SELALU ADA) ================= */
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-transparent p-3 sm:p-6 font-sans antialiased">
      <style>{`
        @keyframes johen-media-in {
          0% { opacity: 0; transform: translateY(24px) scale(.975); filter: blur(8px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }

        .johen-media-visible {
          animation: johen-media-in 360ms cubic-bezier(.22, 1, .36, 1) both;
        }

        @media (prefers-reduced-motion: reduce) {
          .johen-media-visible { animation: none; }
        }
      `}</style>

      <div
        className={`relative w-[min(94vw,960px)] overflow-hidden rounded-[28px] border-[4px] backdrop-blur-2xl transition-[opacity,transform] duration-200 ${
          transparentMode ? "" : "shadow-[0_30px_90px_rgba(0,0,0,0.42)]"
        } ${visible ? "johen-media-visible translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
        style={cardStyle}
        role="status"
        aria-live="polite"
        aria-label={video ? `Media Share dari ${video.donorName}` : "Menunggu Media Share"}
      >
        {backgroundImage && (
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${backgroundImage}")`, opacity: backgroundImageOpacity }}
          />
        )}

        <AlertParticles type={alertStyle.particleStyle} color={alertStyle.amountColor} />

        <div
          className="relative z-20 aspect-video w-full overflow-hidden border-b-2 bg-black"
          style={{ borderColor: alertStyle.borderColor }}
        >
          <div id="yt-player" className="h-full w-full" />
          <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2 rounded-xl border border-white/20 bg-black/60 px-2.5 py-2 backdrop-blur-md">
            <img src="/logo-blue.png" alt="" className="h-5 w-5 object-contain" />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/80">Johen Donate</span>
          </div>
        </div>

        {video && (
          <div className="relative z-20 bg-black/10 px-4 py-4 backdrop-blur-md sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-55">Dikirim oleh</p>
                <p className="mt-1 break-words text-xl font-black leading-tight sm:text-2xl">{video.donorName || "Anonim"}</p>
                <p className="mt-2 max-w-2xl break-words text-sm font-semibold leading-relaxed opacity-80 sm:text-base">
                  {video.message
                    ? `${alertStyle.messagePrefix || ""}${video.message}${alertStyle.messageSuffix || ""}`
                    : "Tanpa pesan"}
                </p>
              </div>

              <div
                className="shrink-0 text-2xl font-black tabular-nums sm:text-4xl"
                style={getAmountStyle(alertStyle.amountStyle, alertStyle.amountColor, alertStyle.textColor)}
              >
                {formattedAmount}
              </div>
            </div>
          </div>
        )}

        <div className="relative z-20 h-2 w-full overflow-hidden bg-black/20">
          <div
            className="h-full transition-[width] duration-1000 ease-linear"
            style={{ width: `${playbackProgress}%`, backgroundColor: alertStyle.amountColor }}
          />
        </div>
      </div>
    </div>
  );
}
