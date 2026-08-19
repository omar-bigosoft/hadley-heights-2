"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { journeyScenes, type JourneyScene } from "../scene-data";
import EnquiryDialog from "./enquiry-dialog";

gsap.registerPlugin(ScrollTrigger);

const cinematicScrollEase = (value: number) =>
  1 - Math.pow(1 - value, 4);

type MediaLayerProps = {
  scene: JourneyScene;
  index: number;
  active: boolean;
  playbackEnabled: boolean;
  onFirstReady: () => void;
  onIntroReady: () => void;
  onIntroEnd: () => void;
};

function MediaLayer({
  scene,
  index,
  active,
  playbackEnabled,
  onFirstReady,
  onIntroReady,
  onIntroEnd,
}: MediaLayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    setVideoReady(true);
    if (index === 0) onIntroReady();
  }, [index, onIntroReady]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (active && playbackEnabled && !videoFailed) {
      video.play().catch(() => {
        if (index === 0) onIntroEnd();
      });
    } else {
      video.pause();
    }
  }, [active, index, onIntroEnd, playbackEnabled, videoFailed, videoReady]);

  return (
    <div
      className={`scene-layer ${active ? "is-active" : ""} ${
        scene.layout === "closing" ? "scene-layer--closing" : ""
      }`}
      data-scene-layer={index}
      aria-hidden={!active}
    >
      {scene.imageSrc ? (
        <Image
          src={scene.imageSrc}
          alt=""
          fill
          priority={index < 2}
          sizes="100vw"
          className="scene-image"
          style={{ objectPosition: scene.objectPosition }}
          onLoad={index === 0 ? onFirstReady : undefined}
        />
      ) : (
        <div className="closing-atmosphere" />
      )}

      {scene.videoSrc && !videoFailed ? (
        <video
          ref={videoRef}
          className={`scene-video ${videoReady ? "is-ready" : ""}`}
          muted
          loop={scene.loop ?? true}
          playsInline
          preload={active ? "auto" : "metadata"}
          poster={scene.imageSrc}
          onLoadedMetadata={() => {
            if (index === 0) onIntroReady();
          }}
          onCanPlay={() => {
            setVideoReady(true);
            if (index === 0) onIntroReady();
          }}
          onLoadedData={() => {
            setVideoReady(true);
            if (index === 0) onIntroReady();
          }}
          onEnded={index === 0 ? onIntroEnd : undefined}
          onError={() => {
            setVideoFailed(true);
            if (index === 0) {
              onIntroReady();
              onIntroEnd();
            }
          }}
          aria-label={`${scene.kicker} cinematic scene`}
        >
          {scene.videoWebmSrc ? (
            <source src={scene.videoWebmSrc} type="video/webm" />
          ) : null}
          <source src={scene.videoSrc} type="video/mp4" />
        </video>
      ) : null}

      <div className="scene-vignette" />
      <div className="scene-wash" />
    </div>
  );
}

function TransitionFilm({ scene, index }: { scene: JourneyScene; index: number }) {
  if (!scene.transitionVideoSrc) return null;

  return (
    <video
      className="scene-transition-video"
      data-transition-video={index}
      muted
      playsInline
      preload={index < 2 ? "auto" : "metadata"}
      poster={scene.imageSrc}
      aria-hidden="true"
      tabIndex={-1}
    >
      {scene.transitionVideoWebmSrc ? (
        <source src={scene.transitionVideoWebmSrc} type="video/webm" />
      ) : null}
      <source src={scene.transitionVideoSrc} type="video/mp4" />
    </video>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-mark ${compact ? "brand-mark--compact" : ""}`}>
      <span className="brand-mark__name">Hadley Heights</span>
      <span className="brand-mark__roman">II</span>
      {!compact ? (
        <span className="brand-mark__edition">Olympic Champion Edition</span>
      ) : null}
    </div>
  );
}

function AnimatedTitle({ children }: { children: string }) {
  return (
    <h1 aria-label={children}>
      {children.split(" ").map((word, index) => (
        <span className="title-word-clip" aria-hidden="true" key={`${word}-${index}`}>
          <span className="title-word" data-title-word>
            {word}
          </span>
        </span>
      ))}
    </h1>
  );
}

type MobileStoryProps = {
  onFirstReady: () => void;
  onEnquire: () => void;
};

type MobileIntroProps = {
  playbackEnabled: boolean;
  onReady: () => void;
  onComplete: () => void;
};

function MobileIntro({ playbackEnabled, onReady, onComplete }: MobileIntroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!playbackEnabled) {
      video.pause();
      return;
    }

    video.play().catch(() => onComplete());
  }, [onComplete, playbackEnabled]);

  return (
    <div className="mobile-intro" aria-hidden="true">
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        poster={journeyScenes[0].imageSrc}
        onCanPlay={onReady}
        onLoadedData={onReady}
        onEnded={onComplete}
        onError={() => {
          onReady();
          onComplete();
        }}
      >
        <source src={journeyScenes[0].videoSrc ?? undefined} type="video/mp4" />
      </video>
    </div>
  );
}

function MobileStory({ onFirstReady, onEnquire }: MobileStoryProps) {
  const sceneRefs = useRef<Array<HTMLElement | null>>([]);
  const sceneRatios = useRef<number[]>(Array(journeyScenes.length).fill(0));
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fallback = window.setTimeout(() => {
      onFirstReady();
    }, 1800);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute("data-mobile-scene"));
          if (Number.isFinite(index)) {
            sceneRatios.current[index] = entry.isIntersecting
              ? entry.intersectionRatio
              : 0;
          }
        });

        const nextIndex = sceneRatios.current.reduce(
          (mostVisible, ratio, index, ratios) =>
            ratio > ratios[mostVisible] ? index : mostVisible,
          0,
        );
        setActiveIndex(nextIndex);
      },
      { threshold: [0, 0.2, 0.45, 0.7, 1], rootMargin: "-18% 0px -26%" },
    );

    sceneRefs.current.forEach((scene) => scene && observer.observe(scene));

    return () => {
      window.clearTimeout(fallback);
      observer.disconnect();
    };
  }, [onFirstReady]);

  const activeScene = journeyScenes[activeIndex];

  return (
    <section className="mobile-journey" aria-label="Hadley Heights 2 mobile story">
      <div className="mobile-story-copy-stage">
        <div
          className={`mobile-story-copy ${
            activeScene.layout === "closing" ? "mobile-story-copy--closing" : ""
          }`}
          key={activeScene.id}
        >
          <p className="mobile-story-copy__index">
            {String(activeIndex + 1).padStart(2, "0")} <span /> {journeyScenes.length}
          </p>
          <p className="mobile-story-copy__kicker">{activeScene.kicker}</p>
          <h1>{activeScene.title}</h1>
          <p className="mobile-story-copy__description">{activeScene.description}</p>
          {activeScene.layout === "closing" ? (
            <button type="button" onClick={onEnquire}>
              Request availability <span aria-hidden="true">→</span>
            </button>
          ) : null}
        </div>
      </div>
      {journeyScenes.map((scene, index) => (
        <article
          className={`mobile-story-scene ${
            activeIndex === index ? "is-active" : ""
          } ${scene.layout === "closing" ? "mobile-story-scene--closing" : ""}`}
          data-mobile-scene={index}
          key={scene.id}
          ref={(element) => {
            sceneRefs.current[index] = element;
          }}
        >
          {scene.imageSrc ? (
            <Image
              src={scene.imageSrc}
              alt=""
              fill
              priority={index < 2}
              sizes="100vw"
              className="mobile-story-scene__image"
              style={{ objectPosition: scene.objectPosition }}
              onLoad={
                index === 0
                  ? () => {
                      onFirstReady();
                    }
                  : undefined
              }
            />
          ) : (
            <div className="mobile-story-scene__atmosphere" />
          )}
          <div className="mobile-story-scene__veil" aria-hidden="true" />
          <div className="mobile-story-scene__frame" aria-hidden="true" />
        </article>
      ))}
    </section>
  );
}

export default function JourneyExperience() {
  const rootRef = useRef<HTMLElement>(null);
  const journeyRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const activeIndexRef = useRef(0);
  const loaderExitStartedRef = useRef(false);
  const [activeScene, setActiveScene] = useState(0);
  const [firstImageReady, setFirstImageReady] = useState(false);
  const motionEnabled = true;
  const [introPlaybackAllowed, setIntroPlaybackAllowed] = useState(false);
  const [heroIntroComplete, setHeroIntroComplete] = useState(false);
  const [heroMediaReady, setHeroMediaReady] = useState(false);
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 800px)");
    const syncLayout = () => setIsMobileLayout(media.matches);
    syncLayout();
    media.addEventListener("change", syncLayout);
    return () => media.removeEventListener("change", syncLayout);
  }, []);

  useEffect(() => {
    const isCompactViewport = () =>
      window.matchMedia("(max-width: 800px)").matches;
    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 0.88,
      touchMultiplier: 1,
      syncTouch: false,
      overscroll: false,
      anchors: {
        duration: 1.05,
        easing: cinematicScrollEase,
      },
      stopInertiaOnNavigate: true,
      respectReducedMotion: false,
    });
    let chapterSnapPoints: number[] = [];
    let chapterSnapTimer = 0;

    const syncSnapPoints = () => {
      const journey = journeyRef.current;
      if (!journey) return;

      const scrollDistance = journey.offsetHeight - window.innerHeight;
      const journeyTop = journey.offsetTop;

      chapterSnapPoints = journeyScenes.map(
        (_, index) =>
          journeyTop +
          (scrollDistance * index) / (journeyScenes.length - 1),
      );
    };

    const settleOnNearestChapter = () => {
      if (!chapterSnapPoints.length) return;

      const nearestPoint = chapterSnapPoints.reduce((nearest, point) =>
        Math.abs(point - lenis.targetScroll) <
        Math.abs(nearest - lenis.targetScroll)
          ? point
          : nearest,
      );

      if (Math.abs(nearestPoint - lenis.animatedScroll) < 2) return;

      lenis.scrollTo(nearestPoint, {
        duration: 0.68,
        easing: cinematicScrollEase,
        userData: { chapterSnap: true },
      });
    };

    const queueChapterSnap = () => {
      // Mobile should feel like a continuous film reel, not a forced carousel.
      // The desktop chapter snap remains unchanged for precise scene navigation.
      if (isCompactViewport()) return;
      window.clearTimeout(chapterSnapTimer);
      chapterSnapTimer = window.setTimeout(settleOnNearestChapter, 520);
    };

    const updateScrollTrigger = () => ScrollTrigger.update();
    const updateLenis = (time: number) => lenis.raf(time * 1000);
    const handleResize = () => {
      syncSnapPoints();
      ScrollTrigger.refresh();
    };

    lenisRef.current = lenis;
    lenis.on("scroll", updateScrollTrigger);
    lenis.on("virtual-scroll", queueChapterSnap);
    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);
    window.addEventListener("resize", handleResize);
    syncSnapPoints();

    lenis.stop();

    ScrollTrigger.refresh();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.clearTimeout(chapterSnapTimer);
      gsap.ticker.remove(updateLenis);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.off("scroll", updateScrollTrigger);
      lenis.off("virtual-scroll", queueChapterSnap);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;

    if (heroIntroComplete && !enquiryOpen) {
      lenis.start();
      lenis.resize();
      ScrollTrigger.refresh();
    } else {
      lenis.stop();
    }
  }, [enquiryOpen, heroIntroComplete]);

  useEffect(() => {
    const startedAt = performance.now();
    const duration = 1800;
    let frame = 0;

    const updateProgress = (now: number) => {
      const raw = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - raw, 3);
      setLoaderProgress(Math.round(eased * 100));
      if (raw < 1) frame = window.requestAnimationFrame(updateProgress);
    };

    frame = window.requestAnimationFrame(updateProgress);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (
      loaderProgress < 100 ||
      loaderExitStartedRef.current ||
      (firstImageReady && heroMediaReady)
    )
      return;

    // iOS and data-saving mobile browsers may ignore video preload until a
    // playback request. Never let that behavior trap the experience at 100%:
    // reveal the poster first, then let the intro start (or gracefully skip).
    const mobileReadyFallback = window.setTimeout(() => {
      setFirstImageReady(true);
      setHeroMediaReady(true);
    }, 2200);

    return () => window.clearTimeout(mobileReadyFallback);
  }, [firstImageReady, heroMediaReady, loaderProgress]);

  useEffect(() => {
    if (
      loaderProgress < 100 ||
      !firstImageReady ||
      !heroMediaReady ||
      loaderExitStartedRef.current
    )
      return;

    loaderExitStartedRef.current = true;
    setIntroPlaybackAllowed(true);
    document.body.classList.add("experience-starting");

    const revealTimer = window.setTimeout(() => {
      document.body.classList.remove("experience-starting");
      document.body.classList.add("experience-ready");
    }, 1100);

    return () => window.clearTimeout(revealTimer);
  }, [firstImageReady, heroMediaReady, loaderProgress]);

  useEffect(
    () => () => {
      document.body.classList.remove(
        "experience-starting",
        "experience-ready",
      );
    },
    [],
  );

  useEffect(() => {
    document.body.classList.toggle("intro-playing", !heroIntroComplete);
    return () => document.body.classList.remove("intro-playing");
  }, [heroIntroComplete]);

  useEffect(() => {
    if (!introPlaybackAllowed || heroIntroComplete) return;
    const fallbackTimer = window.setTimeout(() => {
      setHeroIntroComplete(true);
    }, 12000);
    return () => window.clearTimeout(fallbackTimer);
  }, [heroIntroComplete, introPlaybackAllowed]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const journey = journeyRef.current;
    if (isMobileLayout || !root || !journey) return;

    let transitionRenderFrame = 0;

    const context = gsap.context(() => {
      const layers = gsap.utils.toArray<HTMLElement>("[data-scene-layer]");
      const copies = gsap.utils.toArray<HTMLElement>("[data-scene-copy]");
      const media = layers.map(
        (layer) =>
          layer.querySelector<HTMLElement>(".scene-video") ??
          layer.querySelector<HTMLElement>(".scene-image"),
      );
      const transitionFilms = gsap.utils.toArray<HTMLVideoElement>(
        "[data-transition-video]",
      );
      const compactMotion = window.matchMedia("(max-width: 800px)").matches;
      const activeTransitionFilms = compactMotion ? [] : transitionFilms;
      const transitionTargets = new Map<HTMLVideoElement, number>(
        activeTransitionFilms.map((film) => [film, 0]),
      );
      const titleWords = copies.map((copy) =>
        gsap.utils.toArray<HTMLElement>("[data-title-word]", copy),
      );
      const copyDetails = copies.map((copy) =>
        gsap.utils.toArray<HTMLElement>("[data-copy-detail]", copy),
      );
      const copyRules = copies.map((copy) =>
        copy.querySelector<HTMLElement>("[data-copy-rule]"),
      );
      const ornaments = copies.map((copy) =>
        copy.querySelector<HTMLElement>("[data-motion-ornament]"),
      );
      const transitionSweep = root.querySelector<HTMLElement>(
        "[data-transition-sweep]",
      );
      const reducedMotion = !motionEnabled;

      const updateChrome = (progress: number) => {
        if (progressRef.current) {
          progressRef.current.style.transform = `scaleX(${progress})`;
        }

        const nextIndex = Math.min(
          journeyScenes.length - 1,
          Math.round(progress * (journeyScenes.length - 1)),
        );
        if (nextIndex !== activeIndexRef.current) {
          activeIndexRef.current = nextIndex;
          setActiveScene(nextIndex);
        }

        const journeyProgress = progress * (journeyScenes.length - 1);
        activeTransitionFilms.forEach((film) => {
          const transitionIndex = Number(film.dataset.transitionVideo);
          const localProgress = gsap.utils.clamp(
            0,
            1,
            journeyProgress - transitionIndex,
          );
          const fadeIn = gsap.utils.clamp(0, 1, (localProgress - 0.02) / 0.07);
          const fadeOut = 1 - gsap.utils.clamp(0, 1, (localProgress - 0.91) / 0.08);

          gsap.set(film, { autoAlpha: fadeIn * fadeOut });

          if (Number.isFinite(film.duration) && film.duration > 0)
            transitionTargets.set(film, localProgress * film.duration);
        });
      };

      let previousRenderTime = 0;
      const renderTransitionFrames = (time: number) => {
        if (time - previousRenderTime >= 1000 / 24) {
          previousRenderTime = time;

          activeTransitionFilms.forEach((film) => {
            const targetTime = transitionTargets.get(film) ?? 0;
            const delta = targetTime - film.currentTime;

            if (
              !Number.isFinite(film.duration) ||
              film.duration <= 0 ||
              film.seeking ||
              Math.abs(delta) < 1 / 48
            )
              return;

            const easedTime =
              film.currentTime +
              Math.sign(delta) *
                Math.min(Math.abs(delta), Math.max(1 / 24, Math.abs(delta) * 0.48));

            film.currentTime = gsap.utils.clamp(
              0,
              Math.max(0, film.duration - 0.001),
              easedTime,
            );
          });
        }

        transitionRenderFrame = window.requestAnimationFrame(
          renderTransitionFrames,
        );
      };

      transitionRenderFrame = window.requestAnimationFrame(
        renderTransitionFrames,
      );

      gsap.set(layers, { autoAlpha: 0 });
      gsap.set(copies, { autoAlpha: 0 });
      gsap.set(
        titleWords.flat(),
        compactMotion ? { yPercent: 0, rotate: 0 } : { yPercent: 115, rotate: 2 },
      );
      gsap.set(
        copyDetails.flat(),
        compactMotion ? { autoAlpha: 1, y: 0 } : { autoAlpha: 0, y: 16 },
      );
      gsap.set(
        copyRules,
        compactMotion
          ? { scaleX: 1, transformOrigin: "left center" }
          : { scaleX: 0, transformOrigin: "left center" },
      );
      gsap.set(
        ornaments,
        compactMotion
          ? { autoAlpha: 0, scale: 1, rotate: 0 }
          : { autoAlpha: 0, scale: 0.7, rotate: -18 },
      );
      gsap.set(transitionSweep, { autoAlpha: 0, xPercent: -120 });
      gsap.set(transitionFilms, { autoAlpha: 0 });
      gsap.set(layers[0], { autoAlpha: 1 });
      gsap.set(copies[0], { autoAlpha: 1 });

      if (compactMotion) {
        ScrollTrigger.create({
          trigger: journey,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            const scenePosition = self.progress * (journeyScenes.length - 1);
            const currentIndex = Math.floor(scenePosition);
            const nextIndex = Math.min(
              journeyScenes.length - 1,
              currentIndex + 1,
            );
            const sceneProgress = scenePosition - currentIndex;
            const visualMix = gsap.utils.clamp(
              0,
              1,
              (sceneProgress - 0.04) / 0.92,
            );
            const copyMix = gsap.utils.clamp(
              0,
              1,
              (sceneProgress - 0.7) / 0.28,
            );
            const hasNextScene = nextIndex !== currentIndex;

            gsap.set(layers, { autoAlpha: 0, zIndex: 0 });
            gsap.set(copies, { autoAlpha: 0, y: 0 });
            gsap.set(layers[currentIndex], {
              autoAlpha: hasNextScene ? 1 - visualMix * 0.84 : 1,
              zIndex: 1,
            });
            gsap.set(copies[currentIndex], {
              autoAlpha: hasNextScene ? 1 - copyMix : 1,
              y: hasNextScene ? -10 * copyMix : 0,
            });

            if (hasNextScene) {
              gsap.set(layers[nextIndex], {
                autoAlpha: visualMix,
                zIndex: 2,
              });
              gsap.set(copies[nextIndex], {
                autoAlpha: copyMix,
                y: 12 * (1 - copyMix),
              });
            }

            if (media[currentIndex]) {
              gsap.set(media[currentIndex], {
                scale: 1 + sceneProgress * 0.018,
                yPercent: -sceneProgress * 1.2,
              });
            }

            if (hasNextScene && media[nextIndex]) {
              gsap.set(media[nextIndex], {
                scale: 1.028 - visualMix * 0.028,
                yPercent: 1.4 - visualMix * 1.4,
              });
            }

            updateChrome(self.progress);
          },
        });
        return;
      }

      if (reducedMotion) {
        ScrollTrigger.create({
          trigger: journey,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            const index = Math.min(
              journeyScenes.length - 1,
              Math.round(self.progress * (journeyScenes.length - 1)),
            );
            gsap.set(layers, { autoAlpha: 0 });
            gsap.set(copies, { autoAlpha: 0 });
            gsap.set(layers[index], { autoAlpha: 1 });
            gsap.set(copies[index], { autoAlpha: 1 });
            gsap.set(titleWords.flat(), { yPercent: 115 });
            gsap.set(copyDetails.flat(), { autoAlpha: 0, y: 16 });
            gsap.set(copyRules, { scaleX: 0 });
            gsap.set(ornaments, { autoAlpha: 0, scale: 0.7, rotate: -18 });
            gsap.set(titleWords[index], { yPercent: 0, rotate: 0 });
            gsap.set(copyDetails[index], { autoAlpha: 1, y: 0 });
            gsap.set(copyRules[index], { scaleX: 1 });
            gsap.set(ornaments[index], {
              autoAlpha: index === journeyScenes.length - 1 ? 0 : 0.72,
              scale: 1,
              rotate: 0,
            });
            updateChrome(self.progress);
          },
        });
        return;
      }

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: journey,
          start: "top top",
          end: "bottom bottom",
          scrub: compactMotion ? 0.2 : 0.45,
          invalidateOnRefresh: true,
          onUpdate: (self) => updateChrome(self.progress),
        },
      });

      journeyScenes.slice(0, -1).forEach((_, index) => {
        const position = index;
        const currentMedia = media[index];
        const nextMedia = media[index + 1];

        const exitTitleTween =
          index === 0
            ? timeline.fromTo(
                titleWords[index],
                { yPercent: 0, rotate: 0 },
                {
                  yPercent: -115,
                  rotate: -1.5,
                  duration: 0.28,
                  stagger: 0.014,
                  ease: "power2.in",
                  immediateRender: false,
                },
                position,
              )
            : timeline.to(
                titleWords[index],
                {
                  yPercent: -115,
                  rotate: -1.5,
                  duration: 0.28,
                  stagger: 0.014,
                  ease: "power2.in",
                },
                position,
              );

        exitTitleTween
          .to(
            copyDetails[index],
            {
              autoAlpha: 0,
              y: -12,
              duration: 0.2,
              stagger: 0.018,
              ease: "power1.in",
            },
            position,
          )
          .to(
            copyRules[index],
            { scaleX: 0, duration: 0.2, ease: "power2.in" },
            position,
          )
          .to(
            ornaments[index],
            {
              autoAlpha: 0,
              scale: 1.18,
              rotate: 18,
              duration: 0.3,
              ease: "power2.in",
            },
            position,
          )
          .set(copies[index], { autoAlpha: 0 }, position + 0.42)
          .to(
            layers[index],
            { autoAlpha: 0, duration: 0.82, ease: "power1.inOut" },
            position + 0.18,
          )
          .fromTo(
            layers[index + 1],
            {
              autoAlpha: 0,
              clipPath:
                index % 2 === 0
                  ? "inset(100% 0% 0% 0%)"
                  : "inset(0% 0% 100% 0%)",
            },
            {
              autoAlpha: 1,
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 0.82,
              ease: "power2.inOut",
            },
            position + 0.18,
          )
          .fromTo(
            copies[index + 1],
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.01 },
            position + 0.48,
          )
          .to(
            copyRules[index + 1],
            { scaleX: 1, duration: 0.34, ease: "power2.out" },
            position + 0.5,
          )
          .to(
            titleWords[index + 1],
            {
              yPercent: 0,
              rotate: 0,
              duration: 0.38,
              stagger: 0.018,
              ease: "power3.out",
            },
            position + 0.48,
          )
          .to(
            copyDetails[index + 1],
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.26,
              stagger: 0.022,
              ease: "power2.out",
            },
            position + 0.58,
          )
          .to(
            ornaments[index + 1],
            {
              autoAlpha:
                index + 1 === journeyScenes.length - 1 ? 0 : 0.72,
              scale: 1,
              rotate: 0,
              duration: 0.42,
              ease: "back.out(1.7)",
            },
            position + 0.5,
          );

        timeline
          .set(
            transitionSweep,
            { xPercent: -120, autoAlpha: 0 },
            position + 0.08,
          )
          .to(
            transitionSweep,
            { autoAlpha: 0.55, duration: 0.12, ease: "power1.out" },
            position + 0.14,
          )
          .to(
            transitionSweep,
            { xPercent: 120, duration: 0.72, ease: "power2.inOut" },
            position + 0.14,
          )
          .to(
            transitionSweep,
            { autoAlpha: 0, duration: 0.18, ease: "power1.in" },
            position + 0.72,
          );

        if (currentMedia) {
          timeline.fromTo(
            currentMedia,
            { scale: 1 },
            { scale: compactMotion ? 1.025 : 1.065, duration: 1, ease: "none" },
            position,
          );
        }

        if (nextMedia) {
          timeline.fromTo(
            nextMedia,
            { scale: compactMotion ? 1.035 : 1.08 },
            { scale: 1, duration: 0.95, ease: "power1.out" },
            position + 0.08,
          );
        }
      });
    }, root);

    return () => {
      window.cancelAnimationFrame(transitionRenderFrame);
      context.revert();
    };
  }, [isMobileLayout, motionEnabled]);

  useLayoutEffect(() => {
    if (
      !firstImageReady ||
      !heroIntroComplete ||
      !rootRef.current ||
      !motionEnabled || isMobileLayout
    )
      return;

    const context = gsap.context(() => {
      const firstCopy = document.querySelector<HTMLElement>(
        '[data-scene-copy="0"]',
      );
      if (!firstCopy) return;

      const words = gsap.utils.toArray<HTMLElement>(
        "[data-title-word]",
        firstCopy,
      );
      const details = gsap.utils.toArray<HTMLElement>(
        "[data-copy-detail]",
        firstCopy,
      );
      const rule = firstCopy.querySelector<HTMLElement>("[data-copy-rule]");
      const ornament =
        firstCopy.querySelector<HTMLElement>("[data-motion-ornament]");

      gsap
        .timeline({ delay: 0.65 })
        .to(rule, { scaleX: 1, duration: 0.45, ease: "power2.out" })
        .to(
          words,
          {
            yPercent: 0,
            rotate: 0,
            duration: 0.72,
            stagger: 0.055,
            ease: "power3.out",
          },
          0.08,
        )
        .to(
          details,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.065,
            ease: "power2.out",
          },
          0.32,
        )
        .to(
          ornament,
          {
            autoAlpha: 0.72,
            scale: 1,
            rotate: 0,
            duration: 0.8,
            ease: "back.out(1.6)",
          },
          0.45,
        );
    }, rootRef);

    return () => context.revert();
  }, [firstImageReady, heroIntroComplete, isMobileLayout, motionEnabled]);

  const jumpToScene = (index: number) => {
    const journey = journeyRef.current;
    if (!journey) return;
    const distance = journey.offsetHeight - window.innerHeight;
    const top = journey.offsetTop + (distance * index) / (journeyScenes.length - 1);
    if (lenisRef.current) {
      lenisRef.current.scrollTo(top, {
        duration: 1.05,
        easing: cinematicScrollEase,
      });
      return;
    }

    window.scrollTo({ top, behavior: "auto" });
  };

  return (
    <main ref={rootRef} id="top" className="experience-shell">
      <div className="experience-loader" aria-hidden="true">
        <BrandMark />
        <span className="loader-line">
          <span style={{ transform: `scaleX(${loaderProgress / 100})` }} />
        </span>
        <div className="loader-status">
          <p>
            {loaderProgress === 100 && !heroMediaReady
              ? "Preparing the film"
              : "Preparing your private journey"}
          </p>
          <strong>{String(loaderProgress).padStart(3, "0")}%</strong>
        </div>
      </div>

      <header className="site-header">
        <a href="#top" className="header-brand" aria-label="Hadley Heights 2 home">
          <BrandMark compact />
        </a>
        <div className="header-center" aria-hidden="true">
          <span>Dubai Sports City</span>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="header-enquire"
            onClick={() => setEnquiryOpen(true)}
          >
            <span>Enquire</span>
            <i aria-hidden="true">↗</i>
          </button>
        </div>
      </header>

      <aside className="scene-navigation" aria-label="Journey chapters">
        {journeyScenes.map((scene, index) => (
          <button
            key={scene.id}
            type="button"
            className={activeScene === index ? "is-active" : ""}
            onClick={() => jumpToScene(index)}
            aria-label={`Go to ${scene.chapter}`}
            aria-current={activeScene === index ? "step" : undefined}
          >
            <span />
          </button>
        ))}
      </aside>

      {!isMobileLayout ? (
        <section
          ref={journeyRef}
          className="journey"
          style={{
            "--scene-count": journeyScenes.length,
          } as CSSProperties}
          aria-label="Hadley Heights 2 cinematic journey"
        >
        <div className="journey-stage">
          <div className="media-stack">
            {journeyScenes.map((scene, index) => (
              <MediaLayer
                key={scene.id}
                scene={scene}
                index={index}
                active={activeScene === index}
                playbackEnabled={
                  index === 0
                    ? introPlaybackAllowed && !heroIntroComplete
                    : activeScene === index
                }
                onFirstReady={() => setFirstImageReady(true)}
                onIntroReady={() => {
                  setHeroMediaReady(true);
                  setFirstImageReady(true);
                }}
                onIntroEnd={() => setHeroIntroComplete(true)}
              />
            ))}
            {journeyScenes.map((scene, index) => (
              <TransitionFilm
                key={`${scene.id}-transition`}
                scene={scene}
                index={index}
              />
            ))}
          </div>

          <div
            className="transition-sweep"
            data-transition-sweep
            aria-hidden="true"
          >
            <span />
          </div>

          <div className="architectural-frame" aria-hidden="true">
            <span className="frame-corner frame-corner--tl" />
            <span className="frame-corner frame-corner--tr" />
            <span className="frame-corner frame-corner--bl" />
            <span className="frame-corner frame-corner--br" />
          </div>

          <div className="mobile-glide-cue" aria-hidden="true" key={activeScene}>
            <span />
            <p>
              {String(activeScene + 1).padStart(2, "0")} <i /> {journeyScenes.length}
            </p>
          </div>

          <div className="copy-stack">
            {journeyScenes.map((scene, index) => (
              <article
                key={scene.id}
                className={`scene-copy scene-copy--${scene.layout ?? "default"} scene-copy--${scene.tone ?? "dark"} scene-copy--${scene.placement ?? "bottom-left"} ${
                  activeScene === index ? "is-active" : ""
                }`}
                data-scene-copy={index}
                aria-hidden={activeScene !== index}
              >
                <div
                  className={`motion-ornament ${
                    scene.layout === "closing" ? "motion-ornament--closing" : ""
                  }`}
                  data-motion-ornament
                  aria-hidden="true"
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <i />
                  <b />
                </div>
                <div
                  className="scene-copy__rule"
                  data-copy-rule
                  aria-hidden="true"
                />
                <p className="scene-copy__chapter" data-copy-detail>
                  {scene.chapter}
                </p>
                <p className="scene-copy__kicker" data-copy-detail>
                  {scene.kicker}
                </p>
                <AnimatedTitle>{scene.title}</AnimatedTitle>
                <p className="scene-copy__description" data-copy-detail>
                  {scene.description}
                </p>

                {scene.layout === "closing" ? (
                  <div className="closing-actions" data-copy-detail>
                    <button
                      type="button"
                      className="closing-actions__primary"
                      onClick={() => setEnquiryOpen(true)}
                    >
                      Request a private presentation
                      <span aria-hidden="true">↗</span>
                    </button>
                    <a
                      className="closing-actions__secondary"
                      href="https://leosdevelopments.com/property-for-sale-in-dubai/hadley-heights-2/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View project details
                    </a>
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          <div className="journey-footer" aria-hidden="true">
            <div className="journey-progress">
              <span ref={progressRef} />
            </div>
            <div className="journey-footer__meta">
              <span>
                {String(activeScene + 1).padStart(2, "0")} / {journeyScenes.length}
              </span>
              <span className="journey-footer__hint">
                {activeScene === journeyScenes.length - 1 ? "End of journey" : "Scroll to explore"}
              </span>
              <span>LEOS Developments</span>
            </div>
          </div>
        </div>
        </section>
      ) : (
        <>
          {!heroIntroComplete ? (
            <MobileIntro
              playbackEnabled={introPlaybackAllowed}
              onReady={() => setHeroMediaReady(true)}
              onComplete={() => setHeroIntroComplete(true)}
            />
          ) : null}
          <MobileStory
            onFirstReady={() => setFirstImageReady(true)}
            onEnquire={() => setEnquiryOpen(true)}
          />
        </>
      )}

      <button
        type="button"
        className="mobile-enquiry-cta"
        onClick={() => setEnquiryOpen(true)}
      >
        <span>Get floor plans &amp; pricing</span>
        <i aria-hidden="true">→</i>
      </button>

      <EnquiryDialog open={enquiryOpen} onClose={() => setEnquiryOpen(false)} />
    </main>
  );
}
