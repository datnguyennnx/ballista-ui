"use client";

import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { MorphingText } from "@/components/magicui/morphing-text";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { AnimatedList } from "@/components/magicui/animated-list";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Item {
  name: string;
  description: string;
  icon: string;
  color: string;
  time: string;
}

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
};

const notifications = [
  {
    name: "Message",
    description:
      "Like the ancient ballista targeting distant battlements, modern testing must be precise, powerful, and purposeful.",
    icon: "💬",
    color: "#00C9A7",
    time: formatTimeAgo(new Date(Date.now() - 1000 * 60 * 60 * 2)), // 2 hours ago
  },
  {
    name: "Message",
    description:
      "In the siege of software quality, a well-aimed test will bring down walls that brute force cannot.",
    icon: "💬",
    color: "#FFB800",
    time: formatTimeAgo(new Date(Date.now() - 1000 * 60 * 5)), // 5 minutes ago
  },
  {
    name: "Message",
    description:
      "True testing isn't about finding what works—it's about discovering the exact conditions under which things break.",
    icon: "💬",
    color: "#FF3D71",
    time: formatTimeAgo(new Date(Date.now() - 1000 * 30)), // 30 seconds ago
  },
];

const Notification = ({ name, description, icon, color, time }: Item) => {
  const [currentTime, setCurrentTime] = useState(time);

  useEffect(() => {
    const interval = setInterval(() => {
      const date = new Date(
        Date.now() -
          (time.includes("m")
            ? parseInt(time) * 60 * 1000
            : time.includes("h")
              ? parseInt(time) * 60 * 60 * 1000
              : time.includes("d")
                ? parseInt(time) * 24 * 60 * 60 * 1000
                : 0),
      );
      setCurrentTime(formatTimeAgo(date));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [time]);

  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[600px] transform-gpu cursor-pointer overflow-hidden rounded-2xl border border-neutral-200 p-6",
        // animation styles
        "transition-all duration-300 ease-in-out hover:scale-[102%] hover:shadow-lg",
        // light styles
        "bg-white/80 [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] backdrop-blur-sm",
        // dark styles
        "dark:bg-black/40 dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)]",
      )}
    >
      <div className="flex flex-row items-center gap-4">
        <div
          className="flex size-12 items-center justify-center rounded-2xl p-4 transition-transform duration-300 hover:scale-110"
          style={{
            backgroundColor: color,
          }}
        >
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center text-lg font-medium whitespace-pre dark:text-white">
            <span className="text-base font-semibold sm:text-lg">{name}</span>
            <span className="mx-2">·</span>
            <span className="text-sm text-neutral-500">{currentTime}</span>
          </figcaption>
          <p className="mt-1 text-sm leading-relaxed font-normal dark:text-white/80">
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
    router.push("/dashboard");
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-between overflow-hidden">
      <div className="absolute top-4 right-4 z-50">
        <ModeToggle />
      </div>
      <FlickeringGrid
        className="[mask-image:radial-gradient(450px_circle_at_center,white,transparent) absolute inset-0 z-0"
        squareSize={4}
        gridGap={6}
        color="#60A5FA"
        maxOpacity={0.5}
        flickerChance={0.1}
      />
      <div className="text-foreground z-10 mt-32 flex min-w-[600px] flex-col items-start gap-2 align-baseline">
        <h1 className="flex items-center text-[44pt] font-bold">
          <span>Want to </span>
          <MorphingText texts={["api", "stress", "load"]} className="text-[44pt] font-bold" />
          <span> testing ?</span>
        </h1>
        <h1 className="flex items-center text-[60pt] font-bold">
          Just
          <span
            onClick={handleClick}
            className="text-morphingtext relative mx-4 cursor-pointer text-[72pt] font-extrabold transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:h-[4px] after:w-full after:bg-current after:content-[''] hover:animate-bounce"
          >
            <SparklesText text="Test" />
          </span>
          it <span className="text-[40pt]">⚡</span>
        </h1>

        <div className="w-full max-w-3xl">
          <AnimatedList className="space-y-6">
            {notifications.map((item, idx) => (
              <Notification {...item} key={idx} />
            ))}
          </AnimatedList>
        </div>
      </div>
    </div>
  );
}
