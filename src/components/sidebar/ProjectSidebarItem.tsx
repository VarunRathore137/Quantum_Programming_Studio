import { Trash2 } from 'lucide-react'
import { useCircuitStore } from '@/store/circuitStore'

interface ProjectSidebarItemProps {
   id: string
   onLoad: (id: string) => void
   onDelete: (id: string) => void
}

export function ProjectSidebarItem({ id, onLoad, onDelete }: ProjectSidebarItemProps) {
   const activeId = useCircuitStore(s => s.id)
   const activeName = useCircuitStore(s => s.metadata.name)
   const isActive = id === activeId
   const displayName = isActive ? activeName : id.slice(0, 12) + '…'

   return (
      <div
         className={`group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm transition-colors ${isActive
               ? 'bg-zinc-700 text-zinc-50'
               : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
         onClick={() => onLoad(id)}
      >
         <span className="flex-1 truncate">{displayName}</span>
         <button
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-red-400"
            onClick={e => {
               e.stopPropagation()
               onDelete(id)
            }}
            title="Delete project"
         >
            <Trash2 size={14} />
         </button>
      </div>
   )
}
