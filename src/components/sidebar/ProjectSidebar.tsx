import { useState } from 'react'
import { Plus, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProjectManager } from '@/hooks/useProjectManager'
import { ProjectSidebarItem } from './ProjectSidebarItem'
import { NewProjectDialog } from './NewProjectDialog'

export function ProjectSidebar() {
   const { projectIds, loading, saveCurrentProject, loadProject, createNewProject, deleteProject } =
      useProjectManager()
   const [dialogOpen, setDialogOpen] = useState(false)

   return (
      <div className="flex flex-col h-full">
         {/* Header */}
         <div className="px-4 py-4 border-b border-zinc-800">
            <div className="flex items-center justify-between">
               <span className="font-semibold text-zinc-100 text-sm tracking-wide">
                  Quantum Studio
               </span>
               <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full font-mono">
                  v0.1
               </span>
            </div>
         </div>

         {/* Action Buttons */}
         <div className="px-3 py-3 flex gap-2">
            <Button
               size="sm"
               variant="outline"
               className="flex-1 gap-1.5 text-xs bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-200"
               onClick={() => setDialogOpen(true)}
            >
               <Plus size={13} />
               New Project
            </Button>
            <Button
               size="sm"
               variant="outline"
               className="gap-1.5 text-xs bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-200"
               onClick={saveCurrentProject}
               title="Save current project"
            >
               <Save size={13} />
            </Button>
         </div>

         {/* Projects Label */}
         <div className="px-4 pb-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
               Projects
            </span>
         </div>

         {/* Project List */}
         <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
            {loading ? (
               // Loading skeleton
               <>
                  {[1, 2, 3].map(i => (
                     <div key={i} className="h-8 bg-zinc-800 rounded-md animate-pulse mx-1" />
                  ))}
               </>
            ) : projectIds.length === 0 ? (
               <p className="text-xs text-zinc-600 px-3 py-4 text-center">
                  No projects yet.
                  <br />
                  Click &quot;New Project&quot; to get started.
               </p>
            ) : (
               projectIds.map(id => (
                  <ProjectSidebarItem
                     key={id}
                     id={id}
                     onLoad={loadProject}
                     onDelete={deleteProject}
                  />
               ))
            )}
         </div>

         <NewProjectDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onCreate={createNewProject}
         />
      </div>
   )
}
