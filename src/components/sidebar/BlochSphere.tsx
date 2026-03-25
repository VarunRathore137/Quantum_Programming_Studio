import { useState, useEffect } from 'react'
import { useCircuitStore } from '@/store/circuitStore'

export function BlochSphere() {
   const { gates } = useCircuitStore()
   const [theta, setTheta] = useState(0) // Polar angle
   const [phi, setPhi] = useState(0)     // Azimuthal angle

   // Simulate State Vector change when a gate is dropped
   useEffect(() => {
      // Very basic Mock Simulation: Just rotate the vector based on the number of gates
      // In a real simulator, this would compute the exact state vector |psi>.
      const depth = gates.length
      setTheta((depth * 0.5) % Math.PI)
      setPhi((depth * 0.8) % (2 * Math.PI))
   }, [gates])

   // Calculate 2D projection of the 3D vector
   // R = 50 (radius of the sphere)
   const r = 40
   const x = r * Math.sin(theta) * Math.cos(phi)
   const y = r * Math.cos(theta) // Z-axis in Bloch is typically vertical (Y in SVG)
   const z = r * Math.sin(theta) * Math.sin(phi) // Depth

   // Scale Y and shrink X based on Isometric/Perspective projection 
   const projX = 50 + x * 0.8 + z * 0.2
   const projY = 50 - y 

   return (
      <div className="flex flex-col items-center justify-center p-4">
         <div className="relative w-32 h-32 rounded-full border border-cyan-500/20 bg-gradient-to-tr from-cyan-900/20 to-violet-900/20 backdrop-blur-md shadow-[inset_0_0_20px_rgba(6,182,212,0.1)] flex items-center justify-center group overflow-visible">
            
            {/* Equator */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
               <ellipse cx="50" cy="50" rx="50" ry="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2 2" />
               <ellipse cx="50" cy="50" rx="20" ry="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="2 4" />
               
               {/* Axes */}
               <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
               <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

               {/* Labels */}
               <text x="47" y="10" fill="white" fontSize="8" opacity="0.5">|0⟩</text>
               <text x="47" y="96" fill="white" fontSize="8" opacity="0.5">|1⟩</text>
               <text x="91" y="48" fill="white" fontSize="8" opacity="0.5">+x</text>
               <text x="5" y="48" fill="white" fontSize="8" opacity="0.5">-x</text>

               {/* State Vector Line */}
               <line 
                  x1="50" y1="50" 
                  x2={projX} y2={projY} 
                  stroke="#22d3ee" // cyan-400
                  strokeWidth="2"
                  className="transition-all duration-500 ease-out drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]"
               />
               
               {/* Vector Arrowhead / Dot */}
               <circle cx={projX} cy={projY} r="3" fill="#22d3ee" className="transition-all duration-500 ease-out shadow-[0_0_8px_#22d3ee]" />
            </svg>
         </div>
      </div>
   )
}
