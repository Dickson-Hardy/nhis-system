/**
 * Utility to parse legacy claim text data into structured claim items
 * This handles the conversion from the bulky text-based procedure/treatment/medication data
 * into individual itemized claim items for better cost management
 */

interface ParsedClaimItem {
  itemType: 'investigation' | 'procedure' | 'medication' | 'other_service'
  itemCategory: string
  itemName: string
  itemDescription?: string
  quantity: number
  unit: string
  dosage?: string
  duration?: string
  unitCost: number
  totalCost: number
  serviceDate: string
  urgency: 'routine' | 'urgent' | 'emergency'
  indication?: string
}

// Common medical procedure patterns
const PROCEDURE_KEYWORDS = [
  'delivery', 'caesarean', 'section', 'cs', 'emcs', 'surgery', 'operation', 'repair',
  'laparotomy', 'episiotomy', 'evacuation', 'salpingectomy', 'mva', 'consultation',
  'exploration', 'assisted delivery'
]

const INVESTIGATION_KEYWORDS = [
  'pcv', 'fbc', 'hbsag', 'hcv', 'hiv', 'vdrl', 'blood', 'group', 'cross', 'matching',
  'urinalysis', 'rbs', 'bilirubin', 'mp', 'esr', 'electrolyte', 'scan', 'x-ray'
]

const MEDICATION_KEYWORDS = [
  'inj', 'injection', 'tab', 'tablet', 'syrup', 'ivf', 'infusion', 'mg', 'ml',
  'ceftriaxone', 'metronidazole', 'paracetamol', 'diclofenac', 'flagyl', 'vitamin'
]

const OTHER_SERVICE_KEYWORDS = [
  'bed', 'nursing', 'care', 'specialist', 'review', 'consultation', 'folder',
  'consumables', 'oxygen', 'incubator', 'phototherapy', 'monitor', 'ventilator',
  'dialysis', 'physiotherapy'
]

/**
 * Categorizes an item based on its name and description
 */
function categorizeItem(itemName: string): {
  itemType: 'investigation' | 'procedure' | 'medication' | 'other_service'
  itemCategory: string
} {
  const lowerName = itemName.toLowerCase()

  // Check for procedures first (most specific)
  if (PROCEDURE_KEYWORDS.some(keyword => lowerName.includes(keyword))) {
    if (lowerName.includes('caesarean') || lowerName.includes('cs') || lowerName.includes('emcs')) {
      return { itemType: 'procedure', itemCategory: 'Surgical Procedure' }
    }
    if (lowerName.includes('delivery')) {
      return { itemType: 'procedure', itemCategory: 'Delivery Procedure' }
    }
    if (lowerName.includes('consultation') || lowerName.includes('review')) {
      return { itemType: 'procedure', itemCategory: 'Medical Consultation' }
    }
    return { itemType: 'procedure', itemCategory: 'Medical Procedure' }
  }

  // Check for investigations
  if (INVESTIGATION_KEYWORDS.some(keyword => lowerName.includes(keyword))) {
    if (lowerName.includes('blood') || lowerName.includes('pcv') || lowerName.includes('fbc')) {
      return { itemType: 'investigation', itemCategory: 'Blood Test' }
    }
    if (lowerName.includes('urine') || lowerName.includes('urinalysis')) {
      return { itemType: 'investigation', itemCategory: 'Urine Test' }
    }
    if (lowerName.includes('scan') || lowerName.includes('x-ray')) {
      return { itemType: 'investigation', itemCategory: 'Radiology' }
    }
    return { itemType: 'investigation', itemCategory: 'Laboratory Test' }
  }

  // Check for medications
  if (MEDICATION_KEYWORDS.some(keyword => lowerName.includes(keyword))) {
    if (lowerName.includes('inj') || lowerName.includes('injection') || lowerName.includes('iv')) {
      return { itemType: 'medication', itemCategory: 'Injection' }
    }
    if (lowerName.includes('tab') || lowerName.includes('tablet')) {
      return { itemType: 'medication', itemCategory: 'Oral Medication' }
    }
    if (lowerName.includes('ivf') || lowerName.includes('infusion')) {
      return { itemType: 'medication', itemCategory: 'IV Fluid' }
    }
    return { itemType: 'medication', itemCategory: 'Medication' }
  }

  // Default to other services
  if (lowerName.includes('bed') || lowerName.includes('nursing')) {
    return { itemType: 'other_service', itemCategory: 'Nursing Care' }
  }
  if (lowerName.includes('specialist') || lowerName.includes('consultation')) {
    return { itemType: 'other_service', itemCategory: 'Professional Charges' }
  }
  
  return { itemType: 'other_service', itemCategory: 'Medical Service' }
}

/**
 * Extracts dosage information from medication names
 */
function extractDosage(itemName: string): { dosage?: string; cleanName: string } {
  const dosagePatterns = [
    /(\d+(?:\.\d+)?)\s*mg/i,
    /(\d+(?:\.\d+)?)\s*ml/i,
    /(\d+(?:\.\d+)?)\s*g/i,
    /(\d+(?:\.\d+)?)\s*iu/i,
    /(\d+(?:\.\d+)?)\s*mcg/i
  ]

  for (const pattern of dosagePatterns) {
    const match = itemName.match(pattern)
    if (match) {
      return {
        dosage: match[0],
        cleanName: itemName.replace(pattern, '').trim()
      }
    }
  }

  return { cleanName: itemName }
}

/**
 * Extracts frequency/duration from medication names
 */
function extractFrequency(itemName: string): { duration?: string; cleanName: string } {
  const frequencyPatterns = [
    /(\d+\/\d+)/g, // e.g., "5/7", "3/7"
    /(daily|bd|tds|qds|b\.d|t\.d\.s|q\.d\.s)/gi,
    /(\d+\s*times?\s*daily?)/gi,
    /(\d+\s*hrly)/gi,
    /(stat)/gi
  ]

  let duration: string | undefined
  let cleanName = itemName

  for (const pattern of frequencyPatterns) {
    const matches = itemName.match(pattern)
    if (matches) {
      duration = matches.join(', ')
      cleanName = itemName.replace(pattern, '').trim()
    }
  }

  return { duration, cleanName }
}

/**
 * Estimates cost based on item type and complexity
 */
function estimateCost(itemType: string, itemName: string): { unitCost: number; quantity: number } {
  const lowerName = itemName.toLowerCase()

  // Base cost estimates (in Naira)
  const baseCosts = {
    investigation: {
      'blood test': 3000,
      'urine test': 1500,
      'radiology': 8000,
      'laboratory test': 2500
    },
    procedure: {
      'surgical procedure': 150000,
      'delivery procedure': 80000,
      'medical consultation': 15000,
      'medical procedure': 45000
    },
    medication: {
      'injection': 2000,
      'oral medication': 500,
      'iv fluid': 3000,
      'medication': 1000
    },
    other_service: {
      'nursing care': 5000,
      'professional charges': 10000,
      'medical service': 3000
    }
  }

  // Determine quantity from text
  let quantity = 1
  const quantityMatch = lowerName.match(/(\d+)\s*(times?|days?|units?|packs?|bottles?)/i)
  if (quantityMatch) {
    quantity = parseInt(quantityMatch[1]) || 1
  }

  // Get base cost
  const category = categorizeItem(itemName).itemCategory.toLowerCase()
  const typeKey = itemType as keyof typeof baseCosts
  const baseCost = baseCosts[typeKey]?.[category as keyof typeof baseCosts[typeof typeKey]] || 
                   baseCosts[typeKey]?.['medical service' as keyof typeof baseCosts[typeof typeKey]] || 1000

  // Adjust for complexity
  let unitCost: number = baseCost as number
  if (lowerName.includes('emergency') || lowerName.includes('urgent')) {
    unitCost *= 1.5
  }
  if (lowerName.includes('specialist') || lowerName.includes('consultant')) {
    unitCost *= 1.3
  }
  if (lowerName.includes('icu') || lowerName.includes('intensive')) {
    unitCost *= 2
  }

  return { unitCost: Math.round(unitCost), quantity }
}

/**
 * Parses a single claim text into individual items
 */
export function parseClaimText(
  claimText: string, 
  serviceDate: string = new Date().toISOString().split('T')[0],
  primaryDiagnosis: string = ''
): ParsedClaimItem[] {
  if (!claimText || claimText.trim() === '') return []

  // Split by common separators
  const items = claimText
    .split(/[,;]+/)
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .filter(item => !item.match(/^(total|grand total|amount|₦|\d+\.\d+)$/i))

  const parsedItems: ParsedClaimItem[] = []

  for (const itemText of items) {
    if (itemText.length < 3) continue // Skip very short items

    const { itemType, itemCategory } = categorizeItem(itemText)
    const { dosage, cleanName: nameAfterDosage } = extractDosage(itemText)
    const { duration, cleanName: finalName } = extractFrequency(nameAfterDosage)
    const { unitCost, quantity } = estimateCost(itemType, itemText)

    // Determine urgency
    let urgency: 'routine' | 'urgent' | 'emergency' = 'routine'
    if (itemText.toLowerCase().includes('emergency') || itemText.toLowerCase().includes('emcs')) {
      urgency = 'emergency'
    } else if (itemText.toLowerCase().includes('urgent')) {
      urgency = 'urgent'
    }

    // Determine unit
    let unit = 'units'
    if (itemType === 'medication') {
      if (itemText.toLowerCase().includes('tab')) unit = 'tablets'
      else if (itemText.toLowerCase().includes('ml')) unit = 'ml'
      else if (itemText.toLowerCase().includes('injection')) unit = 'vials'
      else if (itemText.toLowerCase().includes('ivf')) unit = 'bags'
    } else if (itemType === 'investigation') {
      unit = 'tests'
    } else if (itemType === 'procedure') {
      unit = 'procedures'
    } else if (itemType === 'other_service') {
      if (itemText.toLowerCase().includes('day')) unit = 'days'
      else if (itemText.toLowerCase().includes('hour')) unit = 'hours'
      else unit = 'services'
    }

    const totalCost = unitCost * quantity

    parsedItems.push({
      itemType,
      itemCategory,
      itemName: finalName || itemText,
      itemDescription: itemText !== finalName ? itemText : undefined,
      quantity,
      unit,
      dosage,
      duration,
      unitCost,
      totalCost,
      serviceDate,
      urgency,
      indication: primaryDiagnosis || undefined
    })
  }

  return parsedItems
}

/**
 * Parse multiple claim texts (for batch processing)
 */
export function parseMultipleClaimTexts(claims: Array<{
  claimId: number
  treatmentProcedure: string
  primaryDiagnosis?: string
  dateOfTreatment?: string
}>): Array<{ claimId: number; items: ParsedClaimItem[] }> {
  return claims.map(claim => ({
    claimId: claim.claimId,
    items: parseClaimText(
      claim.treatmentProcedure,
      claim.dateOfTreatment || new Date().toISOString().split('T')[0],
      claim.primaryDiagnosis
    )
  }))
}

/**
 * Example usage with your sample data
 */
export function parseSampleClaimData(): ParsedClaimItem[] {
  const sampleText = `PCV, HBSAG, HCV, GROUPING & CROSS MATCHING, IVF 5% DS 500ML 4 HRLY, IVF N/S 500ML 4 HRLY, IV CEFTRIAZONE 1G 12 HRLY, IV FLAGYL 500MG 8 HRLY, IV PCM 600MG 8 HRLY, IM PENTAZOCINE 30MG 6 HRLY, IM DICLOFENAC 75MG 12 HRLY, TAB CEFUROXIME 500MG BD 5/7, TAB METRONIDAZOLE 400MG TDS 5/7, TAB PCM 1G TDS 5/7, TAB DICLOFENAC BD 3/7, CAESEREAN SECTION, CONSUMABLES, INITIAL SPECIALIST CONSULTATION, BED FEES, NURSING CARE`
  
  return parseClaimText(sampleText, '2024-01-15', 'Emergency Caesarean Section')
}