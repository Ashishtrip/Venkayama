import OnionLogo from "./OnionLogo";

export default function Cooking({ className = "py-20" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-5 text-center ${className}`} role="status">
      <OnionLogo className="h-28 md:h-36" />
      <p className="font-mono text-sm font-bold uppercase tracking-[0.3em]">Cooking</p>
    </div>
  );
}
