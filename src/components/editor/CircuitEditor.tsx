import { GatePalette } from '@/components/palette/GatePalette'
import { CircuitControls } from './CircuitControls'
import { CircuitGrid } from './CircuitGrid'

export function CircuitEditor() {
   return (
      <div className="flex flex-col h-full">
         <CircuitControls />
         <div className="flex flex-1 overflow-hidden">
            <GatePalette />
            <CircuitGrid />
         </div>
      </div>
   )
}
