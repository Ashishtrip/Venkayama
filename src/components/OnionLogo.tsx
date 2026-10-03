export default function OnionLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`relative aspect-[860/1193] ${className}`} role="img" aria-label="Venkayam onion logo">
      <img src="/assets/onion-body.png" alt="" className="absolute inset-0 size-full select-none" draggable={false} />
      <img src="/assets/onion-tip.png" alt="" className="onion-tip absolute inset-0 size-full select-none" draggable={false} />
    </div>
  );
}
