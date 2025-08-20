"use client"

import { PaymentTracking } from "@/components/tpa/payment-tracking"

export default function PaymentsPage() {
  const handlePaymentStatusUpdate = (paymentId: string, status: string) => {
    console.log(`Payment ${paymentId} status updated to: ${status}`)
    // In a real implementation, you would update the payment status in your database
    // and possibly send notifications or trigger other business logic
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Payment Management</h1>
        <p className="text-muted-foreground">
          Track, process, and manage healthcare claim payments with comprehensive monitoring and batch processing capabilities
        </p>
      </div>
      
      <PaymentTracking onPaymentStatusUpdate={handlePaymentStatusUpdate} />
    </div>
  )
}
