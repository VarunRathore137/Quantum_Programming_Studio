import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface NewProjectDialogProps {
   open: boolean
   onOpenChange: (open: boolean) => void
   onCreate: (name: string) => void
}

export function NewProjectDialog({ open, onOpenChange, onCreate }: NewProjectDialogProps) {
   const [name, setName] = useState('')
   const handleCreate = () => {
      if (!name.trim()) return
      onCreate(name.trim())
      setName('')
      onOpenChange(false)
   }
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="bg-zinc-900 border-zinc-700">
            <DialogHeader><DialogTitle>New Circuit Project</DialogTitle></DialogHeader>
            <Input
               value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
               placeholder="My Quantum Circuit"
               className="bg-zinc-800 border-zinc-600"
               onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleCreate()}
               autoFocus
            />
            <DialogFooter>
               <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
               <Button onClick={handleCreate} disabled={!name.trim()}>Create</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   )
}
