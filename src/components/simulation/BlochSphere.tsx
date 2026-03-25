import React from 'react';

export interface BlochSphereProps {
  blochVector: { x: number; y: number; z: number } | null;
  qubitIndex: number;
}

export const BlochSphere: React.FC<BlochSphereProps> = ({ blochVector, qubitIndex }) => {
  const isEntangled = blochVector === null;

  let polar = 0;
  let azimuth = 0;

  if (blochVector) {
    // polar: z in [-1, 1], acos(z) gives 0 to pi (0 to 180 deg)
    polar = (Math.acos(blochVector.z) * 180) / Math.PI;
    // azimuth: atan2(y, x) gives -pi to pi (-180 to 180 deg)
    azimuth = (Math.atan2(blochVector.y, blochVector.x) * 180) / Math.PI;
  }

  // To match standard quantum mechanics textbook representation in CSS 3D:
  // Using rotateZ for azimuth (rotation around Z axis)
  // Using rotateY for polar (rotation away from Z axis into XY plane)
  // The plan specifically suggests: rotateX(${polar}deg) rotateZ(${azimuth}deg). Let's follow that but adjust carefully to point correctly.
  // Actually, standard: Z is up, X is right/forward. CSS default: Z is towards viewer, Y is down, X is right.
  // Let's just apply the rotation directly to the arrow container and let CSS handle it.

  return (
    <div className="flex flex-col items-center justify-center space-y-2 p-2">
      <div 
        className="relative w-[120px] h-[120px]" 
        style={{ perspective: '300px' }}
      >
        <div 
          className={`absolute inset-0 rounded-full border border-zinc-700/50 bg-gradient-to-br from-violet-500/10 to-blue-500/20 shadow-inner flex items-center justify-center transition-opacity duration-300 ${isEntangled ? 'opacity-35' : 'opacity-100'}`}
        >
          {/* Reference Axes (2D projections for visual cue) */}
          <div className="absolute w-full h-[1px] bg-zinc-700/50" />
          <div className="absolute h-full w-[1px] bg-zinc-700/50" />
          
          <span className="absolute top-1 text-[8px] text-zinc-500">+Z</span>
          <span className="absolute bottom-1 text-[8px] text-zinc-500">-Z</span>
          <span className="absolute right-1 text-[8px] text-zinc-500">+X</span>

          {/* Arrow */}
          {!isEntangled && (
            <div 
              className="absolute w-[4px] h-[60px] origin-bottom transition-transform duration-500 ease-out"
              style={{
                bottom: '50%',
                transform: `rotateZ(${azimuth}deg) rotateX(${polar}deg)`
              }}
            >
              <div className="w-full h-full bg-violet-400 relative rounded-sm shadow-[0_0_8px_rgba(167,139,250,0.8)]">
                {/* Arrow Tip */}
                <div className="absolute -top-1 -left-[1px] w-[6px] h-[6px] bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,1)]" />
              </div>
            </div>
          )}
        </div>

        {isEntangled && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-zinc-900 border border-violet-500/50 rounded-full text-[10px] font-mono text-violet-300 shadow-md whitespace-nowrap">
            ⟨ψ⟩ entangled
          </div>
        )}
      </div>
      
      <div className="text-xs font-mono text-zinc-400">
        q{qubitIndex}
      </div>
    </div>
  );
};
