import { ReactNode } from "react";
import { ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const BentoGrid = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-1 md:grid-cols-3 gap-4",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
}: {
  name: string;
  className?: string;
  background?: ReactNode;
  Icon?: React.ComponentType<{ className?: string }>;
  description: string;
  href?: string;
  cta?: string;
}) => (
  <div
    key={name}
    className={cn(
      "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl",
      // tactical dark styles
      "bg-[#0e131f] border border-slate-800/80 [box-shadow:0_0_0_1px_rgba(255,255,255,.03),0_2px_4px_rgba(0,0,0,.5),0_12px_24px_rgba(0,0,0,.5)]",
      // hover
      "transform-gpu hover:border-slate-700/80 transition-all duration-300",
      className
    )}
  >
    <div>{background}</div>
    <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-2">
      {Icon && <Icon className="h-10 w-10 origin-left transform-gpu text-cyan-400 transition-all duration-300 ease-in-out group-hover:scale-110" />}
      <h3 className="text-lg font-semibold text-slate-100 tracking-tight font-mono">
        {name}
      </h3>
      <p className="max-w-lg text-sm text-slate-400 font-sans">{description}</p>
    </div>

    {cta && (
      <div
        className={cn(
          "pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        )}
      >
        <span className="pointer-events-auto flex items-center text-xs font-semibold text-cyan-400 font-mono">
          {cta}
          <ArrowRightIcon className="ml-2 h-4 w-4" />
        </span>
      </div>
    )}
    <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-cyan-500/[.03]" />
  </div>
);
