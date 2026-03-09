import { useState } from 'react'

interface AngleEditorProps {
   value: number           // angle in radians
   onChange: (rad: number) => void
}

export function AngleEditor({ value, onChange }: AngleEditorProps) {
   const [editing, setEditing] = useState(false)
   const [draft, setDraft] = useState('')

   const displayPi = `${(value / Math.PI).toFixed(2)}π`

   const handleBlur = () => {
      setEditing(false)
      const parsed = parseFloat(draft)
      if (!isNaN(parsed)) onChange(parsed * Math.PI)
   }

   if (editing) {
      return (
         <input
            autoFocus
            type="number"
            step="0.25"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={e => { if (e.key === 'Enter') handleBlur(); if (e.key === 'Escape') setEditing(false) }}
            onClick={e => e.stopPropagation()}
            className="w-14 text-center text-[10px] bg-zinc-900 border border-violet-400 rounded text-violet-200 outline-none px-1"
            title="Enter angle as multiple of π (e.g. 0.5 = π/2)"
         />
      )
   }

   return (
      <button
         onClick={e => { e.stopPropagation(); setDraft((value / Math.PI).toFixed(2)); setEditing(true) }}
         className="text-[9px] text-violet-200 hover:text-white underline decoration-dotted mt-0.5 leading-none"
         title="Click to edit angle"
      >
         {displayPi}
      </button>
   )
}
