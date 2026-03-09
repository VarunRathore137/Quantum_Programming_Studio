import { ReactNode } from 'react'

interface AppShellProps {
   sidebar: ReactNode
   main: ReactNode
}

export function AppShell({ sidebar, main }: AppShellProps) {
   return (
      <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden">
         <aside className="w-64 flex-shrink-0 border-r border-zinc-800 flex flex-col">
            {sidebar}
         </aside>
         <main className="flex-1 overflow-hidden flex flex-col">
            {main}
         </main>
      </div>
   )
}
