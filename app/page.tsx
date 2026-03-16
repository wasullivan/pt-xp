"use client"

import { useState } from "react"

export default function Dashboard() {

  const XP_VALUES: Record<string, number> = {
    TherEx: 10,
    TherAct: 14,
    Neuro: 16,
    Manual: 8,
  }

  const DECAY = 0.85
  const CRIT_CHANCE = 0.1
  const CRIT_MULTIPLIER = 1.5

  const TARGET_AVG_UNITS = 4
  const PRODUCTIVITY_BONUS = 1.2

  const [patients, setPatients] = useState<string[]>([])
  const [newPatient, setNewPatient] = useState("")
  const [selectedPatient, setSelectedPatient] = useState("")

  const [units, setUnits] = useState({
    TherEx: "",
    TherAct: "",
    Neuro: "",
    Manual: "",
  })

  const [patientUnits, setPatientUnits] = useState<Record<string, number>>({})
  const [patientXP, setPatientXP] = useState<Record<string, number>>({})

  const [totalXP, setTotalXP] = useState(0)
  const [xpPop, setXpPop] = useState("")

  function addPatient() {
    if (!newPatient.trim()) return
    if (patients.includes(newPatient)) return

    setPatients([...patients, newPatient])

    setPatientUnits({ ...patientUnits, [newPatient]: 0 })
    setPatientXP({ ...patientXP, [newPatient]: 0 })

    setNewPatient("")
  }

  function deletePatient(name: string) {

    const newPatients = patients.filter((p) => p !== name)

    const xpToRemove = patientXP[name] || 0

    const newUnits = { ...patientUnits }
    const newXP = { ...patientXP }

    delete newUnits[name]
    delete newXP[name]

    setPatients(newPatients)
    setPatientUnits(newUnits)
    setPatientXP(newXP)

    setTotalXP(totalXP - xpToRemove)

    if (selectedPatient === name) {
      setSelectedPatient("")
    }
  }

  function logVisit() {

    if (!selectedPatient) return

    let gainedXP = 0
    let totalUnits = 0

    Object.entries(units).forEach(([type, value]) => {

      const num = Number(value)

      for (let i = 0; i < num; i++) {
        gainedXP += XP_VALUES[type] * Math.pow(DECAY, i)
      }

      totalUnits += num
    })

    const isCrit = Math.random() < CRIT_CHANCE

    if (isCrit) {
      gainedXP *= CRIT_MULTIPLIER
      setXpPop(`🔥 CRITICAL +${gainedXP.toFixed(1)} XP`)
    } else {
      setXpPop(`+${gainedXP.toFixed(1)} XP`)
    }

    setTimeout(() => setXpPop(""), 1200)

    const totalUnitsAll = Object.values(patientUnits).reduce((a, b) => a + b, 0)
    const projectedUnits = totalUnitsAll + totalUnits
    const projectedAvg = projectedUnits / patients.length

    let finalXP = gainedXP

    if (projectedAvg >= TARGET_AVG_UNITS) {
      finalXP *= PRODUCTIVITY_BONUS
    }

    const newPatientXP = {
      ...patientXP,
      [selectedPatient]: (patientXP[selectedPatient] || 0) + finalXP,
    }

    const newPatientUnits = {
      ...patientUnits,
      [selectedPatient]: (patientUnits[selectedPatient] || 0) + totalUnits,
    }

    setPatientXP(newPatientXP)
    setPatientUnits(newPatientUnits)

    setTotalXP(totalXP + finalXP)

    setUnits({
      TherEx: "",
      TherAct: "",
      Neuro: "",
      Manual: "",
    })
  }

  const totalPatients = patients.length

  const totalUnitsAll = Object.values(patientUnits).reduce((a, b) => a + b, 0)

  const avgUnits =
    totalPatients > 0 ? (totalUnitsAll / totalPatients).toFixed(2) : "0"

  return (

    <div className="p-8 space-y-8 text-black bg-gray-50 min-h-screen">

      <h1 className="text-3xl font-bold">PT XP Dashboard</h1>

      {xpPop && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 text-3xl font-bold text-green-600 animate-bounce pointer-events-none">
          {xpPop}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">

        <div className="p-4 bg-white rounded shadow">
          <h2 className="font-semibold">Total XP</h2>
          <p className="text-2xl">{totalXP.toFixed(1)}</p>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <h2 className="font-semibold">Patients</h2>
          <p className="text-2xl">{totalPatients}</p>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <h2 className="font-semibold">Avg Units / Patient</h2>
          <p className="text-2xl">{avgUnits}</p>

          {Number(avgUnits) >= TARGET_AVG_UNITS ? (
            <p className="text-green-600 font-semibold">
              🔥 Productivity Bonus Active
            </p>
          ) : (
            <p className="text-yellow-600 font-semibold">
              ⚠ Below Target
            </p>
          )}

        </div>

      </div>

      <div className="space-y-2">

        <h2 className="text-xl font-semibold">Add Patient</h2>

        <input
          className="border p-2 rounded bg-white text-black"
          placeholder="Patient name"
          value={newPatient}
          onChange={(e) => setNewPatient(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addPatient()
          }}
        />

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded ml-2"
          onClick={addPatient}
        >
          Add
        </button>

      </div>

      <div className="space-y-2">

        <h2 className="text-xl font-semibold">Patient Bank</h2>

        <div className="grid grid-cols-3 gap-2">

          {patients.map((p) => (
            <div
              key={p}
              className={`p-3 rounded border cursor-pointer flex justify-between items-center ${
                selectedPatient === p ? "bg-blue-200" : "bg-white"
              }`}
              onClick={() => setSelectedPatient(p)}
            >

              <span>{p}</span>

              <button
                className="text-red-500 font-bold"
                onClick={(e) => {
                  e.stopPropagation()
                  deletePatient(p)
                }}
              >
                X
              </button>

            </div>
          ))}

        </div>

      </div>

      <div className="space-y-2">

        <h2 className="text-xl font-semibold">Log Units</h2>

        <div className="grid grid-cols-4 gap-2">

          {Object.keys(units).map((type) => (
            <input
              key={type}
              className="border p-2 rounded bg-white text-black"
              placeholder={type}
              value={units[type as keyof typeof units]}
              onChange={(e) =>
                setUnits({
                  ...units,
                  [type]: e.target.value,
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") logVisit()
              }}
            />
          ))}

        </div>

        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={logVisit}
        >
          Log Visit
        </button>

      </div>

      <div className="space-y-2">

        <h2 className="text-xl font-semibold">Patient Stats</h2>

        {patients.map((p) => (

          <div key={p} className="border p-3 rounded bg-white shadow">

            <p className="font-semibold">{p}</p>

            <p>Units: {patientUnits[p] || 0}</p>

            <p>XP: {(patientXP[p] || 0).toFixed(1)}</p>

          </div>

        ))}

      </div>

    </div>
  )
}
