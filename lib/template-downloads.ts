import { toast } from "@/hooks/use-toast"

export interface TemplateInfo {
  name: string
  description: string
  filename: string
  path: string
  format: 'legacy' | 'expanded' | 'tpa'
}

export const availableTemplates: TemplateInfo[] = [
  {
    name: "Legacy Claims Template",
    description: "Basic claim format for facility submissions (simplified view)",
    filename: "legacy-claims-template.csv",
    path: "/templates/legacy-claims-template.csv",
    format: 'legacy'
  },
  {
    name: "Expanded Claims Template",
    description: "TPA cleaned sheet format with comprehensive fields for audit and verification",
    filename: "expanded-claims-template.csv",
    path: "/templates/expanded-claims-template.csv",
    format: 'expanded'
  },
  {
    name: "TPA Audit Template",
    description: "Template for TPA decision-making and claim processing",
    filename: "tpa-audit-template.csv",
    path: "/templates/tpa-audit-template.csv",
    format: 'tpa'
  }
]

export async function downloadTemplate(template: TemplateInfo): Promise<void> {
  try {
    const response = await fetch(template.path)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.statusText}`)
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = template.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    toast({
      title: "Template Downloaded",
      description: `${template.name} has been downloaded successfully.`,
    })
  } catch (error) {
    console.error('Error downloading template:', error)
    toast({
      title: "Download Failed",
      description: `Failed to download ${template.name}. Please try again.`,
      variant: "destructive"
    })
  }
}

export function getTemplateByFormat(format: 'legacy' | 'expanded' | 'tpa'): TemplateInfo | undefined {
  return availableTemplates.find(template => template.format === format)
}
