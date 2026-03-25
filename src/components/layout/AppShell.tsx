import { ReactNode } from 'react'
import { useAutoSim } from '../../hooks/useAutoSim'

interface AppShellProps {
   sidebar: ReactNode
   main: ReactNode
}

export function AppShell({ sidebar, main }: AppShellProps) {
   useAutoSim()

   return (
      <div className="relative flex h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden isolate">
         {/* Atmospheric Background Blurs */}
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-900/20 blur-[120px] rounded-full pointer-events-none -z-10" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none -z-10" />

         <aside className="w-64 flex-shrink-0 border-r border-zinc-800/50 bg-zinc-950/50 backdrop-blur-md flex flex-col z-10">
            {sidebar}
         </aside>
         <main className="flex-1 overflow-hidden flex flex-col z-10 relative">
            {main}
         </main>
      </div>
   )
}
