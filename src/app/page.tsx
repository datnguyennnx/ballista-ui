'use client'

import { FlickeringGrid } from "@/components/magicui/flickering-grid"
import { MorphingText } from '@/components/magicui/morphing-text'
import { SparklesText } from '@/components/magicui/sparkles-text'
import { AnimatedList } from "@/components/magicui/animated-list"
import { ModeToggle } from '@/components/mode-toggle'
import { cn } from "@/lib/utils"
import { useRouter } from 'next/navigation'

interface Item {
  name: string;
  description: string;
  icon: string;
  color: string;
  time: string;
}
 
const notifications = [
  {
    name: "Message",
    description: "Like the ancient ballista targeting distant battlements, modern testing must be precise, powerful, and purposeful.", 
    icon: "💬",
    color: "#00C9A7",
    time: "Just now"
  },
  {
    name: "Message",
    description: "In the siege of software quality, a well-aimed test will bring down walls that brute force cannot.",
    icon: "💬",
    color: "#FFB800",
    time: "Just now"
  },
  {
    name: "Message",
    description: "True testing isn't about finding what works—it's about discovering the exact conditions under which things break.",
    icon: "💬",
    color: "#FF3D71",
    time: "Just now"
  },
];

const Notification = ({ name, description, icon, color, time }: Item) => {
  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[500px] cursor-pointer overflow-hidden rounded-2xl p-4",
        // animation styles
        "transition-all duration-200 ease-in-out hover:scale-[103%]",
        // light styles
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        // dark styles
        "transform-gpu dark:bg-transparent dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]",
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-2xl p-4"
          style={{
            backgroundColor: color,
          }}
        >
          <span className="text-lg">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center whitespace-pre text-lg font-medium dark:text-white ">
            <span className="text-sm sm:text-lg">{name}</span>
            <span className="mx-1">·</span>
            <span className="text-xs text-gray-500">{time}</span>
          </figcaption>
          <p className="text-sm font-normal dark:text-white/60">
            {description}
          </p>
        </div>
      </div>
    </figure>
  );
};

export default function Home() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/dashboard');
  };

  return (
    <div className="relative flex h-screen w-full justify-center">
      <div className="absolute top-4 right-4 z-50">
        <ModeToggle />
      </div>
      <FlickeringGrid  
        className="absolute inset-0 z-0 [mask-image:radial-gradient(450px_circle_at_center,white,transparent)"
        squareSize={4}
        gridGap={6}
        color="#60A5FA"
        maxOpacity={0.5}
        flickerChance={0.1}
      />
      <div className="flex flex-col items-start mt-44 text-foreground gap-2 z-10 align-baseline">
        <h1 className="text-[44pt] font-bold flex items-center">
          <span>Want to </span>
          <MorphingText 
            texts={["api", "stress", "load"]} 
            className="text-[44pt] font-bold" 
          />
          <span> testing ?</span>
        </h1>
        <h1 className="text-[60pt] font-bold flex items-center">
          Just
          <span 
            onClick={handleClick} 
            className="text-[72pt] font-extrabold relative mx-4 cursor-pointer text-morphingtext transition-all duration-300 after:content-[''] after:absolute after:w-full after:h-[4px] after:bg-current after:left-0 after:bottom-0 hover:animate-bounce"
          >
            <SparklesText text="Test"/>
          </span>
          it <span className="text-[40pt]">⚡</span>
        </h1>

        <AnimatedList>
        {notifications.map((item, idx) => (
          <Notification {...item} key={idx} />
        ))}
      </AnimatedList>
 
      </div>
    </div>
  );
}