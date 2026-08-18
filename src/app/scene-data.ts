export type JourneyScene = {
  id: string;
  chapter: string;
  kicker: string;
  title: string;
  description: string;
  imageSrc?: string;
  videoSrc: string | null;
  videoWebmSrc?: string;
  transitionVideoSrc?: string;
  transitionVideoWebmSrc?: string;
  loop?: boolean;
  duration: number;
  objectPosition?: string;
  tone?: "light" | "dark";
  layout?: "default" | "hero" | "closing";
  placement?:
    | "top-left"
    | "top-right"
    | "center-left"
    | "center-right"
    | "bottom-left"
    | "bottom-right"
    | "center";
};

// Scene videos establish a chapter. Transition videos belong to the scene they
// depart from and bridge into the following chapter. Both can provide an MP4
// fallback plus an optional WebM source.
const journeySceneContent: JourneyScene[] = [
  {
    id: "exterior-arrival",
    chapter: "01 / Arrival",
    kicker: "Hadley Heights 2",
    title: "Built for those who never stand still.",
    description:
      "An Olympic champion edition in Dubai Sports City, shaped around movement, precision and a life lived at full momentum.",
    imageSrc: "/scenes/Journey_EXT-01.jpg",
    videoSrc: "/videos/hadley-heights-intro.mp4",
    transitionVideoSrc: "/videos/journey-ext-01-scrub.mp4",
    loop: false,
    duration: 5,
    objectPosition: "50% 50%",
    tone: "light",
    layout: "hero",
    placement: "top-left",
  },
  {
    id: "architectural-context",
    chapter: "02 / The Crown",
    kicker: "A new skyline signature",
    title: "Future, framed in light.",
    description:
      "A sculptural rooftop crown completes an architecture conceived to feel fluid, elevated and unmistakably forward.",
    imageSrc: "/scenes/Journey_EXT-04.jpg",
    videoSrc: null,
    transitionVideoSrc: "/videos/journey-ext-02-scrub.mp4",
    duration: 5,
    objectPosition: "50% 48%",
    tone: "light",
    placement: "bottom-right",
  },
  {
    id: "facade-approach",
    chapter: "03 / Architecture",
    kicker: "Form in motion",
    title: "Every line has momentum.",
    description:
      "Aerodynamic bands, private pools and expansive glazing create a façade that changes with every point of view.",
    imageSrc: "/scenes/Journey_EXT-06.jpg",
    videoSrc: null,
    duration: 5,
    objectPosition: "50% 50%",
    tone: "dark",
    placement: "center-right",
  },
  {
    id: "threshold",
    chapter: "04 / Threshold",
    kicker: "The arrival",
    title: "Cross into another rhythm.",
    description:
      "A luminous entrance draws the building’s flowing geometry down to the human scale.",
    imageSrc: "/scenes/Journey_EXT-08.jpg",
    videoSrc: null,
    duration: 5,
    objectPosition: "52% 58%",
    tone: "dark",
    placement: "center-left",
  },
  {
    id: "lobby",
    chapter: "05 / Lobby",
    kicker: "A defining first impression",
    title: "Arrival, with gravity.",
    description:
      "Soft stone, warm metal and celestial light create a welcome that feels calm, focused and quietly spectacular.",
    imageSrc: "/scenes/Journey_INT-01.jpg",
    videoSrc: null,
    duration: 5,
    objectPosition: "50% 50%",
    tone: "dark",
    placement: "top-right",
  },
  {
    id: "living",
    chapter: "06 / Residence",
    kicker: "Living and dining",
    title: "Composed for modern living.",
    description:
      "Generous open-plan interiors balance sculptural detail with natural light, effortless flow and a private water view.",
    imageSrc: "/scenes/Journey_INT-05.jpg",
    videoSrc: null,
    duration: 5,
    objectPosition: "50% 50%",
    tone: "dark",
    placement: "top-left",
  },
  {
    id: "bedroom",
    chapter: "07 / Retreat",
    kicker: "The primary suite",
    title: "The city, softened.",
    description:
      "A private retreat where panoramic glass, tactile finishes and warm morning light bring the horizon close.",
    imageSrc: "/scenes/Journey_INT-10.jpg",
    videoSrc: null,
    duration: 5,
    objectPosition: "50% 50%",
    tone: "dark",
    placement: "center-left",
  },
  {
    id: "bathroom",
    chapter: "08 / Ritual",
    kicker: "Material detail",
    title: "Restoration, refined.",
    description:
      "Natural textures and serene green tile turn an everyday ritual into a measured moment of reset.",
    imageSrc: "/scenes/Journey_INT-12.jpg",
    videoSrc: null,
    duration: 5,
    objectPosition: "50% 50%",
    tone: "dark",
    placement: "top-left",
  },
  {
    id: "private-pool",
    chapter: "09 / Horizon",
    kicker: "A pool with every residence",
    title: "Your horizon. Your water.",
    description:
      "A private pool extends the home into the skyline—an intimate place to pause above Dubai Sports City.",
    imageSrc: "/scenes/Journey_EXT-10.jpg",
    videoSrc: null,
    duration: 5,
    objectPosition: "50% 50%",
    tone: "dark",
    placement: "top-left",
  },
  {
    id: "amenities",
    chapter: "10 / Vitality",
    kicker: "Signature amenities",
    title: "Performance meets restoration.",
    description:
      "Water, movement and wellbeing converge in spaces designed to energise the body and quiet the mind.",
    imageSrc: "/scenes/Journey_EXT-12.jpg",
    videoSrc: null,
    duration: 5,
    objectPosition: "50% 50%",
    tone: "dark",
    placement: "top-right",
  },
  {
    id: "full-elevation",
    chapter: "11 / The Vision",
    kicker: "Hadley Heights 2",
    title: "Built for champions. Backed by one.",
    description:
      "A new expression of waterfront living in Dubai Sports City, created for people defined by ambition.",
    imageSrc: "/scenes/Journey_EXT-02.jpg",
    videoSrc: null,
    duration: 5,
    objectPosition: "50% 50%",
    tone: "light",
    placement: "bottom-right",
  },
  {
    id: "enquiry",
    chapter: "12 / Private Presentation",
    kicker: "Your next move",
    title: "Live beyond the expected.",
    description:
      "Discover studios to three-bedroom residences in the heart of Dubai Sports City.",
    videoSrc: null,
    duration: 5,
    tone: "light",
    layout: "closing",
    placement: "center",
  },
];

const assetBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const withAssetBasePath = (source: string) => `${assetBasePath}${source}`;

export const journeyScenes: JourneyScene[] = journeySceneContent.map(
  (scene) => ({
    ...scene,
    imageSrc: scene.imageSrc
      ? withAssetBasePath(scene.imageSrc)
      : undefined,
    videoSrc: scene.videoSrc ? withAssetBasePath(scene.videoSrc) : null,
    videoWebmSrc: scene.videoWebmSrc
      ? withAssetBasePath(scene.videoWebmSrc)
      : undefined,
    transitionVideoSrc: scene.transitionVideoSrc
      ? withAssetBasePath(scene.transitionVideoSrc)
      : undefined,
    transitionVideoWebmSrc: scene.transitionVideoWebmSrc
      ? withAssetBasePath(scene.transitionVideoWebmSrc)
      : undefined,
  }),
);
