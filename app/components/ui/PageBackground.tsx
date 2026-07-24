export default function PageBackground() {
  return (
    <>
      {/* Base gradient — driven by the active theme */}
      <div
        className="absolute inset-0"
        style={{ background: 'var(--page-gradient)' }}
      />

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{ background: 'var(--orb-1)' }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{ background: 'var(--orb-2)', animationDelay: '1s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl animate-pulse"
          style={{ background: 'var(--orb-3)', animationDelay: '2s' }}
        />
      </div>
    </>
  );
}