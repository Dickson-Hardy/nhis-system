import { DischargeForm } from "@/components/facility/discharge-form"

export default function DischargePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Patient Discharge Form</h1>
        <p className="text-muted-foreground">Complete the discharge form for cesarean section procedures</p>
      </div>
      <DischargeForm />
    </div>
  )
}
