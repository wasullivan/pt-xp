"use client"

import { useState } from "react"

export default function Dashboard() {
  const XP_VALUES: Record<string, number> = { TherEx:10, TherAct:16, Neuro:14, Manual:8 }
  const DECAY = 0.85
  const CRIT_CHANCE = 0.1
  const CRIT_MULTIPLIER = 1.5
  const PRODUCTIVITY_BONUS = 1.2

  const LEVELS = [
    { title: "Onboarder", threshold:0 },
    { title: "Rookie", threshold:100 },
    { title: "Up and Comer", threshold:300 },
    { title: "Clinical Anchor", threshold:600 },
    { title: "Legendary Clinician", threshold:1000 },
  ]

  const STREAK_TITLES = [
    { title:"Inconsistent", min:0, max:1 },
    { title:"Consistent", min:2, max:4 },
    { title:"Ol' Reliable", min:5, max:Infinity }
  ]

  const [patients, setPatients] = useState<string[]>([])
  const [newPatient, setNewPatient] = useState("")
  const [selectedPatient, setSelectedPatient] = useState("")

  const [units, setUnits] = useState({ TherEx:"", TherAct:"", Neuro:"", Manual:"" })
  const [patientUnits, setPatientUnits] = useState<Record<string,Record<string,number>>>({})
  const [patientXP, setPatientXP] = useState<Record<string,number>>({})
  const [totalXP, setTotalXP] = useState(0)
  const [xpPop, setXpPop] = useState("")

  const [targetUnits, setTargetUnits] = useState(4)
  const [streak, setStreak] = useState(0)
  const [lastStreakDay, setLastStreakDay] = useState<number|null>(null)

  const today = new Date().setHours(0,0,0,0)
  const currentLevel = LEVELS.slice().reverse().find(l=>totalXP>=l.threshold)?.title || "Onboarder"
  const streakTitle = STREAK_TITLES.find(s=>streak>=s.min && streak<=s.max)?.title || "Inconsistent"

  // Determine avatar rewards
  const avatarRewards: string[] = []
  if (currentLevel === "Rookie" || currentLevel === "Up and Comer" || currentLevel === "Clinical Anchor" || currentLevel === "Legendary Clinician") avatarRewards.push("🧢")
  if (streak >= 2) avatarRewards.push("🎖")
  if (currentLevel === "Clinical Anchor" || currentLevel === "Legendary Clinician") avatarRewards.push("🥇")
  if (currentLevel === "Legendary Clinician") avatarRewards.push("🏆")

  function addPatient() {
    if(!newPatient.trim() || patients.includes(newPatient)) return
    setPatients([...patients,newPatient])
    setPatientUnits({...patientUnits,[newPatient]:{TherEx:0,TherAct:0,Neuro:0,Manual:0}})
    setPatientXP({...patientXP,[newPatient]:0})
    setNewPatient("")
  }

  function deletePatient(name:string){
    const newPatients = patients.filter(p=>p!==name)
    const xpToRemove = patientXP[name]||0
    const newPatientUnits = {...patientUnits}; const newPatientXP = {...patientXP}
    delete newPatientUnits[name]; delete newPatientXP[name]
    setPatients(newPatients)
    setPatientUnits(newPatientUnits)
    setPatientXP(newPatientXP)
    setTotalXP(totalXP - xpToRemove)
    if(selectedPatient===name) setSelectedPatient("")
  }

  function logVisit(){
    if(!selectedPatient) return
    let gainedXP=0
    const newPatientUnits = {...patientUnits[selectedPatient]}
    Object.entries(units).forEach(([type,value])=>{
      const num = Number(value)
      const currentCount = newPatientUnits[type] || 0
      for(let i=0;i<num;i++) gainedXP += XP_VALUES[type]*Math.pow(DECAY,currentCount+i)
      newPatientUnits[type] = currentCount + num
    })
    if(Math.random()<CRIT_CHANCE) gainedXP *= CRIT_MULTIPLIER
    setPatientUnits({...patientUnits,[selectedPatient]:newPatientUnits})
    setPatientXP({...patientXP,[selectedPatient]: (patientXP[selectedPatient]||0)+gainedXP})
    setTotalXP(totalXP + gainedXP)
    setXpPop(`+${gainedXP.toFixed(1)} XP`)
    setTimeout(()=>setXpPop(""),1200)
    setUnits({TherEx:"",TherAct:"",Neuro:"",Manual:""})

    // Check streak
    const totalUnitsSum = Object.values({...patientUnits,[selectedPatient]:newPatientUnits})
      .reduce((sum:number,u)=>sum+Object.values(u).reduce((a,b)=>a+b,0),0)
    const avgUnits = patients.length ? totalUnitsSum/patients.length : 0
    if(avgUnits>=targetUnits){
      if(lastStreakDay === today-86400000) setStreak(streak+1)
      else if(lastStreakDay !== today) setStreak(1)
      setLastStreakDay(today)
    }
  }

  const totalPatients = patients.length
  const totalUnitsAll = Object.values(patientUnits)
    .reduce((sum:number,u)=>sum+Object.values(u).reduce((a,b)=>a+b,0),0)
  const avgUnits = totalPatients ? (totalUnitsAll/totalPatients).toFixed(2) : "0"

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-black space-y-6">
      <h1 className="text-3xl font-bold">PT XP Dashboard</h1>
      {xpPop && <div className="fixed top-24 left-1/2 -translate-x-1/2 text-3xl font-bold text-green-600 animate-bounce pointer-events-none">{xpPop}</div>}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <h2 className="font-semibold">Total XP {avatarRewards.join("")}</h2>
          <p className="text-2xl">{totalXP.toFixed(1)}</p>
          <p className="text-sm">Level: {currentLevel}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h2 className="font-semibold">Streak</h2>
          <p className="text-2xl">{streak} day(s)</p>
          <p className="text-sm">{streakTitle}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h2 className="font-semibold">Avg Units / Patient</h2>
          <p className="text-2xl">{avgUnits}</p>
          {Number(avgUnits)>=targetUnits ? <p className="text-green-600 font-semibold">🔥 Target Met</p> : <p className="text-yellow-600 font-semibold">⚠ Below Target</p>}
        </div>
      </div>

      {/* Target Units */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Set Target Units / Patient</h2>
        <input type="number" min={3.5} step={0.1} value={targetUnits} onChange={e=>setTargetUnits(Math.max(3.5,Number(e.target.value)))} className="border p-2 rounded text-black w-20"/>
        <p className="text-sm text-gray-600">Minimum 3.5 units</p>
      </div>

      {/* Add Patient */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Add Patient</h2>
        <input className="border p-2 rounded bg-white text-black" placeholder="Patient name" value={newPatient} onChange={e=>setNewPatient(e.target.value)} onKeyDown={e=>{if(e.key==="Enter") addPatient()}}/>
        <button className="bg-blue-500 text-white px-4 py-2 rounded ml-2" onClick={addPatient}>Add</button>
      </div>

      {/* Patient Bank */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Patient Bank</h2>
        <div className="grid grid-cols-3 gap-2">
          {patients.map(p=>(
            <div key={p} className={`p-3 rounded border cursor-pointer flex justify-between items-center ${selectedPatient===p?"bg-blue-200":"bg-white"}`} onClick={()=>setSelectedPatient(p)}>
              <span>{p}</span>
              <button className="text-red-500 font-bold" onClick={e=>{e.stopPropagation();deletePatient(p)}}>X</button>
            </div>
          ))}
        </div>
      </div>

      {/* Log Units */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Log Units</h2>
        <div className="grid grid-cols-4 gap-2">
          {Object.keys(units).map(type=>(
            <input key={type} className="border p-2 rounded bg-white text-black" placeholder={type} value={units[type as keyof typeof units]} onChange={e=>setUnits({...units,[type]:e.target.value})} onKeyDown={e=>{if(e.key==="Enter") logVisit()}}/>
          ))}
        </div>
        <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={logVisit}>Log Visit</button>
      </div>

      {/* Patient Stats */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Patient Stats</h2>
        {patients.map(p=>(
          <div key={p} className="border p-3 rounded bg-white shadow">
            <p className="font-semibold">{p}</p>
            <p>Units: {Object.values(patientUnits[p] || {}).reduce((a:number,b:number)=>a+b,0)}</p>
            <p>XP: {(patientXP[p] || 0).toFixed(1)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
