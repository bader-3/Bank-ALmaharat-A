/**
 * AmbientBackground — a single, calm backdrop for the whole page.
 * Very soft radial light + an ultra-faint dot texture that fades toward the
 * bottom. Fixed so sections share one continuous, quiet atmosphere.
 */
export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Soft radial light */}
      <div className="absolute -top-[15%] right-[-5%] h-[46rem] w-[46rem] rounded-full bg-[radial-gradient(circle,rgb(11_27_43/0.04)_0%,transparent_65%)] dark:bg-[radial-gradient(circle,rgb(45_106_79/0.12)_0%,transparent_68%)] dark:opacity-100" />
      <div className="absolute top-[8%] left-[-10%] h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle,rgb(45_106_79/0.05)_0%,transparent_68%)] dark:bg-[radial-gradient(circle,rgb(196_154_44/0.06)_0%,transparent_70%)] dark:opacity-100" />
      <div className="absolute bottom-[-10%] left-[20%] hidden h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgb(21_45_69/0.5)_0%,transparent_70%)] dark:block" />

      {/* Faint dot texture — light mode only */}
      <svg className="absolute inset-0 h-full w-full opacity-60 dark:hidden">
        <defs>
          <pattern id="ambient-dots" width="46" height="46" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.7" fill="rgb(19 34 56 / 0.05)" />
          </pattern>
          <linearGradient id="ambient-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.85" />
            <stop offset="55%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="ambient-mask">
            <rect width="100%" height="100%" fill="url(#ambient-fade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#ambient-dots)" mask="url(#ambient-mask)" />
      </svg>
    </div>
  );
}
