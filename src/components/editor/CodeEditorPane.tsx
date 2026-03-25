import { useState, useEffect } from 'react'
import { useCircuitStore } from '@/store/circuitStore'
import { toQASM2 } from '@/lib/qasm/toQASM2'
import type { Gate, GateType } from '@/types/circuit.types'
import { nanoid } from 'nanoid'

// Reverse map for QASM parsing
const REVERSE_GATE_MAP: Record<string, GateType> = {
   h: 'H', x: 'X', y: 'Y', z: 'Z',
   s: 'S', t: 'T', sdg: 'Sdg', tdg: 'Tdg',
   cx: 'CNOT', cz: 'CZ', swap: 'SWAP', ccx: 'Toffoli',
   rx: 'RX', ry: 'RY', rz: 'RZ', u3: 'U3', p: 'P',
}

export function CodeEditorPane() {
   const { gates, setGates } = useCircuitStore()
   const [code, setCode] = useState('')
   const [isTyping, setIsTyping] = useState(false)
   const [error, setError] = useState<string | null>(null)

   // Sync code FROM circuit store when gates change (if not actively typing)
   useEffect(() => {
      if (!isTyping) {
         try {
            const currentQasm = toQASM2(useCircuitStore.getState())
            if (code !== currentQasm) {
               setCode(currentQasm)
               setError(null)
            }
         } catch (e) {
            // Ignore export errors during drag state
         }
      }
   }, [gates, isTyping]) // purposely omitting 'code' dependency here to avoid loops

   // Sync code TO circuit store
   const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newCode = e.target.value
      setCode(newCode)
      setIsTyping(true)
      
      try {
         const parsedGates = parseQASM(newCode)
         setGates(parsedGates)
         setError(null)
      } catch (err: any) {
         setError(err.message)
      }
   }

   const handleBlur = () => {
      setIsTyping(false)
      // On blur, forcefully format whatever was there into pristine QASM via Store export
      setCode(toQASM2(useCircuitStore.getState()))
   }

   return (
      <div className="h-48 border-t border-zinc-800/50 bg-black/40 backdrop-blur-md flex flex-col z-20">
         <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900/80 border-b border-zinc-800/50">
            <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wide uppercase">QASM Editor</span>
            {error && <span className="text-[10px] text-red-400 font-mono bg-red-900/20 px-2 py-0.5 rounded border border-red-500/30">{error}</span>}
         </div>
         <textarea
            value={code}
            onChange={handleCodeChange}
            onBlur={handleBlur}
            spellCheck={false}
            className={`
               flex-1 w-full p-4 font-mono text-xs focus:outline-none resize-none
               transition-colors duration-200
               ${error ? 'bg-red-950/10 text-red-200' : 'bg-transparent text-zinc-300'}
            `}
         />
      </div>
   )
}

// Basic real-time naive parser for simple QASM instructions
function parseQASM(qasm: string): Gate[] {
   const lines = qasm.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('OPENQASM') && !l.startsWith('include') && !l.startsWith('qreg') && !l.startsWith('creg'))
   const newGates: Gate[] = []
   const nextCol: Record<string, number> = {} // Keeps track of next available column for each qubit
   
   // Simple grid placer logic
   const getCol = (qubits: number[]) => {
      const maxCol = Math.max(0, ...qubits.map(q => nextCol[q] ?? 0))
      qubits.forEach(q => nextCol[q] = maxCol + 1)
      return maxCol
   }

   for (const line of lines) {
      if (line.startsWith('measure')) {
         const match = line.match(/measure q\[(\d+)\]/)
         if (match) {
            const q = parseInt(match[1])
            newGates.push({ id: nanoid(), type: 'MEASURE', qubits: [q], column: getCol([q]) })
         }
         continue
      }
      
      if (line.startsWith('barrier')) {
         const match = line.match(/q\[(\d+)\]/g)
         if (match) {
            const qs = match.map(s => parseInt(s.match(/\d+/)![0]!))
            newGates.push({ id: nanoid(), type: 'BARRIER', qubits: qs, column: getCol(qs) })
         }
         continue
      }

      // Check standard gates: e.g. "cx q[0],q[1];" or "rx(1.57) q[0];"
      const parts = line.split(' ')
      const opcode = parts[0]?.split('(')[0]?.toLowerCase()
      if (!opcode) continue

      const type = REVERSE_GATE_MAP[opcode]
      if (!type) continue

      // Extrapolate params
      let params = undefined
      if (parts[0].includes('(')) {
         const argStr = parts[0].match(/\((.*?)\)/)?.[1]
         if (argStr) {
            const args = argStr.split(',').map(s => parseFloat(s))
            if (type === 'U3') params = { theta: args[0], phi: args[1], lambda: args[2] }
            else params = { theta: args[0] }
         }
      }

      // Extrapolate qubits from the remainder
      const qubitsChunk = parts.slice(1).join('')
      const qsMatch = qubitsChunk.match(/q\[(\d+)\]/g)
      if (qsMatch) {
         const qs = qsMatch.map(s => parseInt(s.match(/\d+/)![0]!))
         newGates.push({ id: nanoid(), type, qubits: qs, column: getCol(qs), params })
      }
   }

   return newGates
}
