import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const morphTime = 1.5;
const cooldownTime = 0.5;

// Function to generate a random color
const getRandomColor = () => {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
};

// Function to generate a random gradient
const getRandomGradient = (numColors = 2) => {
  const colors = [];
  for (let i = 0; i < numColors; i++) {
    colors.push(getRandomColor());
  }
  return colors;
};

const useMorphingText = (texts: string[], randomizeColors: boolean = false, initialGradientColors: string[] = ["#ff4080", "#7928ca"]) => {
  const [gradientColors, setGradientColors] = useState(initialGradientColors);
  const textIndexRef = useRef(0);
  const morphRef = useRef(0);
  const cooldownRef = useRef(0);
  const timeRef = useRef(new Date());
  const textRef = useRef<HTMLSpanElement>(null);

  const setStyles = useCallback(
    (fraction: number) => {
      const current = textRef.current;
      if (!current) return;

      // Apply styles to single text element
      if (fraction < 0.5) {
        // First half of animation - fade out current text
        const blurAmount = Math.min(8 / (1 - fraction * 2) - 8, 100);
        current.style.filter = `blur(${blurAmount}px)`;
        current.style.opacity = `${Math.pow(1 - fraction * 2, 0.4) * 100}%`;
        current.textContent = texts[textIndexRef.current % texts.length];
      } else {
        // Second half - fade in next text
        const adjustedFraction = (fraction - 0.5) * 2; // Rescale 0.5-1 to 0-1
        const blurAmount = Math.min(8 / adjustedFraction - 8, 100);
        current.style.filter = `blur(${blurAmount}px)`;
        current.style.opacity = `${Math.pow(adjustedFraction, 0.4) * 100}%`;
        current.textContent = texts[(textIndexRef.current + 1) % texts.length];
        
        // Change colors when transitioning to a new text if randomizeColors is true
        if (fraction === 1 && randomizeColors) {
          setGradientColors(getRandomGradient());
        }
      }
    },
    [texts, randomizeColors],
  );

  const doMorph = useCallback(() => {
    morphRef.current -= cooldownRef.current;
    cooldownRef.current = 0;

    let fraction = morphRef.current / morphTime;

    if (fraction > 1) {
      cooldownRef.current = cooldownTime;
      fraction = 1;
    }

    setStyles(fraction);

    if (fraction === 1) {
      textIndexRef.current++;
      
      // Change colors when transitioning to a new text if randomizeColors is true
      if (randomizeColors) {
        setGradientColors(getRandomGradient());
      }
    }
  }, [setStyles, randomizeColors]);

  const doCooldown = useCallback(() => {
    morphRef.current = 0;
    const current = textRef.current;
    if (current) {
      current.style.filter = "none";
      current.style.opacity = "100%";
      current.textContent = texts[textIndexRef.current % texts.length];
    }
  }, [texts]);

  useEffect(() => {
    // Initialize text content
    if (textRef.current) {
      textRef.current.textContent = texts[textIndexRef.current % texts.length];
    }
    
    // Initialize with random colors if randomizeColors is true
    if (randomizeColors) {
      setGradientColors(getRandomGradient());
    }
    
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const newTime = new Date();
      const dt = (newTime.getTime() - timeRef.current.getTime()) / 1000;
      timeRef.current = newTime;

      cooldownRef.current -= dt;

      if (cooldownRef.current <= 0) doMorph();
      else doCooldown();
    };

    animate();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [doMorph, doCooldown, texts, randomizeColors]);

  return { textRef, gradientColors };
};

interface MorphingTextProps {
  className?: string;
  texts: string[];
  inline?: boolean;
  gradientColors?: string[]; // For fixed custom gradients
  gradientDirection?: string;
  enableGradient?: boolean; // New prop to toggle gradient
}

const Texts: React.FC<Pick<MorphingTextProps, "texts" | "gradientColors" | "gradientDirection" | "enableGradient">> = ({ 
  texts, 
  gradientColors = ["var(--morphingtext)", "var(--morphingtext)"], 
  gradientDirection = "to right",
  enableGradient = true
}) => {
  const { textRef } = useMorphingText(texts, false, gradientColors);

  return (
    <span
      className="inline-block whitespace-nowrap bg-clip-text text-transparent font-extrabold"
      style={{
        backgroundColor: !enableGradient ? "var(--morphingtext)" : undefined,
        backgroundImage: enableGradient 
          ? `linear-gradient(${gradientDirection}, ${gradientColors.join(", ")})`
          : undefined,
      }}
      ref={textRef}
    />
  );
};

const SvgFilters: React.FC = () => (
    <svg
      id="filters"
      className="fixed h-0 w-0"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter id="threshold">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 255 -140"
          />
        </filter>
      </defs>
    </svg>
  );

export const MorphingText: React.FC<MorphingTextProps> = ({ 
  texts, 
  className, 
  inline = false,
  gradientColors = ["var(--morphingtext)", "var(--morphingtext)"],
  gradientDirection = "to right",
  enableGradient = false
}) => (
  <span
    className={cn(
      "relative inline-block",
      inline ? "" : "h-fit mx-2",
      "[filter:url(#threshold)_blur(0.6px)]",
      className,
    )}
  >
    <Texts 
      texts={texts} 
      gradientColors={gradientColors} 
      gradientDirection={gradientDirection}
      enableGradient={enableGradient}
    />
    <SvgFilters />
  </span>
);