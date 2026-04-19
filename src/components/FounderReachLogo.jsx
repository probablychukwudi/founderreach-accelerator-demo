const logoUrl = "/founder_reach_logo.svg";

export function FounderReachLogo({ size = 30 }) {
  return (
    <img
      src={logoUrl}
      alt="FounderReach logo"
      style={{
        width: size,
        height: Math.round(size * 1.0645),
        flexShrink: 0,
      }}
    />
  );
}
