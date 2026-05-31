export type PromptProviderId =
  | "VEO_3"
  | "GEMINI_IMAGE"
  | "GEMINI_VIDEO"
  | "FLUX"
  | "KLING"
  | "RUNWAY"
  | "OPENAI_IMAGE";

export type PromptTemplate = {
  id: string;
  title: string;
  category: "Creator" | "Affiliate" | "Cinematic" | "Product" | "Social";
  generationType: "IMAGE" | "MOTION_IMAGE" | "AI_VIDEO";
  prompt: string;
  useCase: string;
};

export type PromptProviderGuide = {
  id: PromptProviderId;
  label: string;
  modality: "Image" | "Video" | "Image + Video";
  sourceLabel: string;
  sourceUrl: string;
  sourceStatus: "Official guide" | "Official quickstart";
  summary: string;
  modelNote: string;
  formula: string;
  bestPractices: string[];
  avoid: string[];
  templates: PromptTemplate[];
};

export type PromptLanguageItem = {
  term: string;
  description: string;
  phrase: string;
};

export const promptProviderGuides: PromptProviderGuide[] = [
  {
    id: "VEO_3",
    label: "Veo 3 / Veo 3.1",
    modality: "Video",
    sourceLabel: "Google Gemini API video guide",
    sourceUrl: "https://ai.google.dev/gemini-api/docs/video",
    sourceStatus: "Official guide",
    summary: "Cinematic video prompting with explicit composition, subject, context, ambiance, camera motion, action, and optional audio direction.",
    modelNote: "Veo model variants change over time. Confirm the selected model and supported resolution in Provider Management before a real run.",
    formula: "[composition] of [subject] in [context], [ambiance], [camera motion], [physical action], [audio or dialogue when needed].",
    bestPractices: [
      "Describe framing and camera movement explicitly: close-up, POV, aerial view, tracking shot, zoomed in.",
      "Describe visible physical actions and scene progression instead of abstract intent.",
      "Use lighting and palette language to control mood: natural light, sunrise, cool blue tones, muted warm tones.",
      "For image-to-video, choose a first-frame image close to the desired opening scene.",
      "Put unwanted concepts in a dedicated negative prompt as descriptive terms, not sentences using no or don't."
    ],
    avoid: [
      "Do not depend on vague instructions such as make it viral.",
      "Do not overload a short clip with unrelated camera moves.",
      "Do not assume every Veo variant supports the same duration, resolution, or reference-image behavior."
    ],
    templates: [
      {
        id: "veo-product-reveal",
        title: "Product Reveal Short",
        category: "Affiliate",
        generationType: "AI_VIDEO",
        useCase: "Vertical affiliate product reveal",
        prompt: "Vertical product commercial, close-up shot of {product} on a clean bathroom counter, natural morning light, slow dolly-in camera movement, water droplets glisten on the packaging, a hand gently reveals the product benefit, crisp commercial realism, 9:16 composition, clear physical motion, no on-screen text."
      },
      {
        id: "veo-creator-proof",
        title: "Creator Proof Hook",
        category: "Creator",
        generationType: "AI_VIDEO",
        useCase: "Fast creator workflow proof",
        prompt: "POV shot of a creator desk setup at night, laptop dashboard opens to reveal {result}, subtle handheld realism, camera tracks toward the screen, fingers tap one automation button, the result appears within the first three seconds, cool blue practical lighting, concise social video pacing, 9:16 composition."
      }
    ]
  },
  {
    id: "GEMINI_IMAGE",
    label: "Gemini Image / Imagen",
    modality: "Image",
    sourceLabel: "Google Gemini API image generation guide",
    sourceUrl: "https://ai.google.dev/gemini-api/docs/imagen-prompt-guide",
    sourceStatus: "Official guide",
    summary: "Image prompts work best when they clearly describe subject, context or background, and style, then refine details iteratively.",
    modelNote: "Gemini and Imagen have different strengths. Google recommends confirming a supported model and using Imagen when specialized photorealism or style control is important.",
    formula: "A [style or medium] of [subject], [context and background], [lighting], [camera proximity or lens], [important textures], [aspect ratio].",
    bestPractices: [
      "Start with subject, context or background, and visual style.",
      "For photography, specify proximity, camera position, lighting, lens type, and focus treatment.",
      "Iterate from the core idea by adding meaningful details instead of disconnected keyword lists.",
      "Use explicit image-output wording when generating through Gemini conversational image models.",
      "Generate complex text separately when exact typography matters."
    ],
    avoid: [
      "Do not rely on precise font replication.",
      "Do not mix contradictory styles or lighting directions.",
      "Do not hide the requested brand, color, or product behind decorative context."
    ],
    templates: [
      {
        id: "gemini-product-photo",
        title: "Marketplace Product Hero",
        category: "Product",
        generationType: "IMAGE",
        useCase: "Clean affiliate listing visual",
        prompt: "Generate an image: a photorealistic studio photo of {product}, keep the product as the main subject, placed on a clean reflective surface with a minimal {context} background, soft natural key light, controlled rim light, 85mm product photography lens, sharp packaging details, premium commerce aesthetic, {aspectRatio} format."
      },
      {
        id: "gemini-thumbnail",
        title: "Creator Thumbnail Base",
        category: "Creator",
        generationType: "IMAGE",
        useCase: "Thumbnail composition without embedded copy",
        prompt: "Generate an image: a high-contrast creator thumbnail base about {topic}, one clear subject with an expressive focal point, uncluttered background, dramatic directional lighting, room for a short headline added later in editing, sharp social media composition, {aspectRatio} format."
      }
    ]
  },
  {
    id: "GEMINI_VIDEO",
    label: "Gemini Video",
    modality: "Video",
    sourceLabel: "Google Gemini API video guide",
    sourceUrl: "https://ai.google.dev/gemini-api/docs/video",
    sourceStatus: "Official guide",
    summary: "Gemini API video generation currently uses Veo models. Treat the prompt as a shot description with explicit movement and ambiance.",
    modelNote: "Use Provider Management to confirm which Veo-backed Gemini video model is configured. Keep Gemini Video separate in the library so the UI does not imply image and video use the same endpoint.",
    formula: "[shot size] [subject] [physical action], [environment], [lighting or mood], [camera path], [ending frame].",
    bestPractices: [
      "Describe one coherent shot before combining multiple beats.",
      "Specify the first visible action and the intended ending frame.",
      "Use reference images when supported and when product continuity matters.",
      "Keep visual direction separate from dialogue and sound direction."
    ],
    avoid: [
      "Do not send image-generation instructions to a video endpoint.",
      "Do not assume output duration or aspect ratio without checking the chosen model.",
      "Do not ask the camera to pan, orbit, zoom, and crane simultaneously in a short clip."
    ],
    templates: [
      {
        id: "gemini-video-demo",
        title: "Benefit Demonstration",
        category: "Affiliate",
        generationType: "AI_VIDEO",
        useCase: "Single-product benefit demonstration",
        prompt: "Medium close-up of {product} in use on a tidy kitchen counter, bright natural daylight, the user performs one clear action that demonstrates {benefit}, camera makes a slow controlled push-in, product remains centered and recognizable, end on a clean product hero frame, vertical social video."
      }
    ]
  },
  {
    id: "FLUX",
    label: "FLUX",
    modality: "Image",
    sourceLabel: "Black Forest Labs prompting basics",
    sourceUrl: "https://docs.bfl.ai/guides/prompting_unified_basics",
    sourceStatus: "Official guide",
    summary: "FLUX image prompts benefit from clear natural-language descriptions that establish the visual subject and the desired scene.",
    modelNote: "FLUX models and endpoints vary. Keep model selection in Provider Management and use this library for prompt construction only.",
    formula: "[medium or photo type] of [subject], [setting], [composition], [lighting], [material or texture detail], [visual style].",
    bestPractices: [
      "Use a concrete subject and scene before adding style modifiers.",
      "Describe composition, lighting, and materials in readable natural language.",
      "Keep important product attributes near the start of the prompt.",
      "Use one dominant visual direction and refine iteratively."
    ],
    avoid: [
      "Do not bury the primary subject after a long style list.",
      "Do not combine unrelated aesthetics without a clear hierarchy.",
      "Do not treat generated text inside images as guaranteed accurate."
    ],
    templates: [
      {
        id: "flux-lifestyle",
        title: "Lifestyle Product Scene",
        category: "Affiliate",
        generationType: "IMAGE",
        useCase: "Lifestyle product campaign visual",
        prompt: "Commercial lifestyle photo of {product}, product fully visible and recognizable in the foreground, used naturally in a modern {setting}, soft window light, realistic materials and textures, clean editorial composition, premium marketplace campaign style, vertical format."
      }
    ]
  },
  {
    id: "KLING",
    label: "Kling",
    modality: "Video",
    sourceLabel: "Kling AI Video user guide",
    sourceUrl: "https://app.klingai.com/cn/quickstart/klingai-video-3-model-user-guide",
    sourceStatus: "Official quickstart",
    summary: "Kling video prompting should describe shot coverage, subject movement, and scene progression. Multi-shot capability depends on the selected model.",
    modelNote: "Kling model variants evolve quickly. Validate capabilities in the configured provider before enabling a real request.",
    formula: "[shot or shot sequence], [subject], [movement], [environment], [camera behavior], [visual mood], [final reveal].",
    bestPractices: [
      "Write visible scene progression and physical movement.",
      "Use clear shot boundaries only when the selected model supports multi-shot direction.",
      "Keep the product or subject continuity explicit between beats.",
      "End affiliate prompts with a recognizable product hero frame."
    ],
    avoid: [
      "Do not present model-specific multi-shot controls as universal.",
      "Do not request too many cuts for a short social clip.",
      "Do not use generic cinematic wording without describing the action."
    ],
    templates: [
      {
        id: "kling-unboxing",
        title: "Unboxing Sequence",
        category: "Affiliate",
        generationType: "AI_VIDEO",
        useCase: "Short product unboxing",
        prompt: "Vertical unboxing sequence: close-up of sealed {product} package on a clean desk, hands open the package carefully, camera follows the reveal with a smooth overhead-to-front transition, product is lifted into a centered hero frame, bright commerce lighting, realistic textures, concise social pacing."
      }
    ]
  },
  {
    id: "RUNWAY",
    label: "Runway",
    modality: "Video",
    sourceLabel: "Runway Gen-4 video prompting guide",
    sourceUrl: "https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide",
    sourceStatus: "Official guide",
    summary: "Runway recommends direct, simple prompts that describe positive physical motion. Camera language should describe the movement you want to see.",
    modelNote: "The Prompt Intelligence Center stores reusable language, while Runway model and control availability remain provider-specific.",
    formula: "[subject] [physical motion]. [camera motion]. [environment motion]. [lighting and mood].",
    bestPractices: [
      "Use positive phrasing: describe the desired motion rather than what should not happen.",
      "Translate abstract concepts into clear physical actions.",
      "Use camera language such as locked camera, handheld, dolly, pan, tracking, or focus shift.",
      "When the camera reveals new content, describe what comes into view during the movement."
    ],
    avoid: [
      "Do not write negative instructions such as no camera movement; use locked camera.",
      "Do not rely on abstract emotion as a substitute for physical movement.",
      "Do not overload image-to-video prompts with unnecessary scene description."
    ],
    templates: [
      {
        id: "runway-motion-image",
        title: "Motion Image Product Pan",
        category: "Product",
        generationType: "MOTION_IMAGE",
        useCase: "Animate a product still",
        prompt: "{product} remains centered on the display surface. The camera performs a slow left-to-right dolly movement while soft highlights travel across the packaging. Background practical lights shift gently. End on a locked product hero frame."
      }
    ]
  },
  {
    id: "OPENAI_IMAGE",
    label: "OpenAI Image",
    modality: "Image",
    sourceLabel: "OpenAI image generation guide",
    sourceUrl: "https://platform.openai.com/docs/guides/image-generation",
    sourceStatus: "Official guide",
    summary: "GPT Image supports generation and editing workflows with strong instruction following. Output options include size, quality, format, compression, and transparent backgrounds.",
    modelNote: "OpenAI documents GPT Image models including gpt-image-1.5, gpt-image-1, and gpt-image-1-mini. Check Provider Management before selecting a production model.",
    formula: "Create [asset type] of [subject]. Preserve [important attributes]. Use [composition], [lighting], [style]. Output for [channel or format].",
    bestPractices: [
      "State the requested asset and preserve important brand, color, logo, or subject attributes explicitly.",
      "For edits, specify what must change and what must remain consistent.",
      "Use high input fidelity when preserving logos, faces, or reference details is important and supported.",
      "Select transparent background only with compatible PNG or WebP output when needed.",
      "Treat provider revised prompts as metadata worth storing for audit."
    ],
    avoid: [
      "Do not assume exact layout-sensitive composition is guaranteed.",
      "Do not assume recurring character or brand consistency without references and iteration.",
      "Do not rely on generated typography without review."
    ],
    templates: [
      {
        id: "openai-product-ad",
        title: "Product Advertisement",
        category: "Affiliate",
        generationType: "IMAGE",
        useCase: "Product ad visual with explicit preservation",
        prompt: "Create a realistic product advertisement visual of {product}. Preserve the product name, dominant color, packaging shape, and logo placement from the reference when provided. Keep the product as the main subject. Use a clean commercial background, natural lighting, crisp product photography, and a vertical social-commerce composition."
      },
      {
        id: "openai-creator-carousel",
        title: "Creator Carousel Cover",
        category: "Creator",
        generationType: "IMAGE",
        useCase: "Editorial social cover",
        prompt: "Create an editorial social-media cover visual about {topic}. Use one strong focal subject, a clean background with room for headline text added later, modern corporate lighting, sharp contrast, and a premium creator-education aesthetic. Do not embed copy into the image."
      }
    ]
  }
];

export const cameraLanguage: PromptLanguageItem[] = [
  { term: "Locked camera", description: "Camera remains still while the subject or environment moves.", phrase: "Locked camera. The subject performs one clear action in frame." },
  { term: "Dolly-in", description: "Smooth physical camera move toward the subject.", phrase: "The camera performs a slow controlled dolly-in toward the product." },
  { term: "Tracking shot", description: "Camera follows the moving subject.", phrase: "A tracking shot follows the creator walking through the workspace." },
  { term: "Orbit", description: "Camera moves around the subject to reveal shape or depth.", phrase: "The camera makes a subtle half-orbit around the product hero." },
  { term: "Pan", description: "Camera rotates horizontally to reveal adjacent content.", phrase: "A slow pan reveals the product beside the completed result." },
  { term: "Tilt", description: "Camera rotates vertically to reveal height or detail.", phrase: "A gentle tilt-up reveals the full packaging from base to logo." },
  { term: "POV shot", description: "Shot framed as the viewer or user perspective.", phrase: "POV shot from the user's perspective while operating the tool." },
  { term: "Macro close-up", description: "Tight detail shot for texture or product features.", phrase: "Macro close-up of the product texture with controlled focus." },
  { term: "Rack focus", description: "Focus transitions from foreground to background.", phrase: "Rack focus shifts from the product label to the result in the background." }
];

export const cinematicLanguage: PromptLanguageItem[] = [
  { term: "Natural window light", description: "Soft daylight suitable for realistic commerce visuals.", phrase: "Soft natural window light with gentle shadow falloff." },
  { term: "Cool blue practicals", description: "Corporate or technology mood using visible environmental light sources.", phrase: "Cool blue practical lighting with a restrained enterprise mood." },
  { term: "Golden hour", description: "Warm low-angle sunlight for lifestyle scenes.", phrase: "Golden-hour sunlight creates a warm lifestyle atmosphere." },
  { term: "Film noir", description: "High contrast black-and-white visual direction.", phrase: "Film noir style, high contrast monochrome lighting, controlled shadows." },
  { term: "Commercial realism", description: "Product-first photographic treatment without distracting decoration.", phrase: "Crisp commercial realism, controlled reflections, product remains recognizable." },
  { term: "Editorial minimalism", description: "Clean negative space suitable for later typography.", phrase: "Editorial minimalism with clean negative space for copy added in post." }
];

export const visualStyleLibrary = [
  { name: "Premium Product Photo", description: "Controlled surface, natural or studio light, recognizable packaging.", bestFor: "Affiliate hero images" },
  { name: "UGC Commerce", description: "Natural handheld framing, believable home environment, simple proof.", bestFor: "Affiliate short videos" },
  { name: "Creator Education", description: "Clear focal point, uncluttered background, room for captions.", bestFor: "Tutorial clips and carousel covers" },
  { name: "Corporate AI", description: "Clean interface context, cool practical lighting, restrained technology cues.", bestFor: "AI workflow content" },
  { name: "Lifestyle Editorial", description: "Natural environment, product in context, soft directional light.", bestFor: "Brand and marketplace campaigns" },
  { name: "Cinematic Proof", description: "Result appears quickly with controlled camera movement and clear action.", bestFor: "Short-form hooks" }
];

export const creatorPromptTemplates: PromptTemplate[] = [
  {
    id: "creator-ai-workflow",
    title: "AI Workflow Proof",
    category: "Creator",
    generationType: "AI_VIDEO",
    useCase: "Show a result inside the first three seconds",
    prompt: "Vertical short-form creator video about {topic}. Open with the visible final result in the first three seconds. Show one clear before-and-after workflow on a creator desk. Use a controlled tracking shot toward the screen, cool blue practical lighting, concise tutorial pacing, and room for subtitles added in post."
  },
  {
    id: "creator-explainer-cover",
    title: "Explainer Cover",
    category: "Creator",
    generationType: "IMAGE",
    useCase: "Cover visual for education content",
    prompt: "Create a clean social-media cover visual about {topic}. Use one recognizable subject, editorial minimalism, restrained corporate blue accents, strong contrast, and empty space for a short headline added later. Vertical composition."
  }
];

export const affiliatePromptTemplates: PromptTemplate[] = [
  {
    id: "affiliate-problem-solution",
    title: "Problem to Solution",
    category: "Affiliate",
    generationType: "AI_VIDEO",
    useCase: "Demonstrate a product benefit quickly",
    prompt: "Vertical affiliate video for {product}. Show the everyday problem immediately, then demonstrate one clear product action that solves it. Use natural UGC commerce framing, a subtle camera push-in, realistic lighting, and finish with a recognizable product hero frame. Keep motion physically clear and concise."
  },
  {
    id: "affiliate-product-hero",
    title: "Marketplace Hero",
    category: "Affiliate",
    generationType: "IMAGE",
    useCase: "Product-first campaign image",
    prompt: "Create a premium product hero image of {product}. Keep packaging, dominant color, and product form recognizable. Place it on a clean surface in a relevant lifestyle environment with soft natural light, crisp commercial realism, controlled reflections, and vertical social-commerce composition."
  }
];

export const allPromptTemplates = [
  ...creatorPromptTemplates,
  ...affiliatePromptTemplates,
  ...promptProviderGuides.flatMap((provider) => provider.templates)
];

