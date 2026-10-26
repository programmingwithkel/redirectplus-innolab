export interface CaseCategoryDefinition {
  code: string
  label: string
  description: string
  isEmergencyCategory: boolean
  requiresHospitalEmergency: boolean
  redFlagSymptoms: string[]
  commonServices: string[]
}

export const CASE_CATEGORIES: CaseCategoryDefinition[] = [
  {
    code: "TRAUMA",
    label: "Trauma / Severe Injury",
    description: "Major vehicular accidents, severe falls, penetrating wounds, multiple fractures",
    isEmergencyCategory: true,
    requiresHospitalEmergency: true,
    redFlagSymptoms: [
      "Severe or uncontrolled hemorrhage",
      "Head injury with loss of consciousness or altered mental status",
      "Penetrating chest or abdominal injury",
      "Amputation or open fracture",
    ],
    commonServices: ["EMERGENCY_CARE", "TRAUMA_CARE", "GENERAL_SURGERY"],
  },
  {
    code: "EMERGENCY_GENERAL",
    label: "General Acute Emergency",
    description: "Acute life-threatening medical issues, acute poisonings, shock",
    isEmergencyCategory: true,
    requiresHospitalEmergency: true,
    redFlagSymptoms: [
      "Loss of consciousness or unresponsiveness",
      "Sudden collapse or severe shock",
      "Severe allergic reaction (anaphylaxis) with airway compromise",
    ],
    commonServices: ["EMERGENCY_CARE"],
  },
  {
    code: "OBSTETRIC_EMERGENCY",
    label: "Pregnancy / Obstetric Emergency",
    description: "Pre-eclampsia/eclampsia, hemorrhage, cord prolapse, obstructed labor",
    isEmergencyCategory: true,
    requiresHospitalEmergency: true,
    redFlagSymptoms: [
      "Heavy vaginal bleeding during pregnancy",
      "Severe headache, visual disturbances, or seizures (eclampsia)",
      "Cord prolapse or abnormal fetal presentation in labor",
      "Severe continuous abdominal pain (suspected placental abruption)",
    ],
    commonServices: ["EMERGENCY_CARE", "OBSTETRICS"],
  },
  {
    code: "RESPIRATORY_DISTRESS",
    label: "Severe Respiratory Distress",
    description: "Severe asthma, COPD exacerbation, acute pulmonary edema, acute cyanosis",
    isEmergencyCategory: true,
    requiresHospitalEmergency: true,
    redFlagSymptoms: [
      "Stridor or inability to speak full words",
      "Cyanosis (bluish lips, fingers)",
      "Severe intercostal retractions or agonal respirations",
      "SpO2 < 88% on room air",
    ],
    commonServices: ["EMERGENCY_CARE", "RESPIRATORY_CARE"],
  },
  {
    code: "CARDIAC_EMERGENCY",
    label: "Cardiac Emergency / Chest Pain",
    description: "Suspected myocardial infarction, acute coronary syndrome, unstable arrhythmias",
    isEmergencyCategory: true,
    requiresHospitalEmergency: true,
    redFlagSymptoms: [
      "Crushing chest pressure radiating to jaw, neck, or left arm",
      "Chest pain accompanied by diaphoresis and syncope",
      "Severe hypotension with irregular pulse",
    ],
    commonServices: ["EMERGENCY_CARE", "CARDIOLOGY"],
  },
  {
    code: "SUSPECTED_STROKE",
    label: "Suspected Stroke / Acute Neurological",
    description: "Sudden facial droop, arm weakness, slurred speech (FAST criteria)",
    isEmergencyCategory: true,
    requiresHospitalEmergency: true,
    redFlagSymptoms: [
      "Sudden unilateral weakness or paralysis",
      "Sudden inability to speak or comprehend language",
      "Sudden severe explosive headache (thunderclap)",
      "Sudden vision loss or profound ataxia",
    ],
    commonServices: ["EMERGENCY_CARE", "NEUROLOGY", "IMAGING"],
  },
  {
    code: "INTENSIVE_CARE",
    label: "Critical Care / ICU Requirement",
    description: "Septic shock, multi-organ failure, post-resuscitation care",
    isEmergencyCategory: true,
    requiresHospitalEmergency: true,
    redFlagSymptoms: [
      "Refractory shock requiring vasopressors",
      "Impending respiratory failure requiring mechanical ventilation",
      "Severe metabolic crisis with multiorgan failure",
    ],
    commonServices: ["INTENSIVE_CARE"],
  },
  {
    code: "SURGERY",
    label: "General Surgical Evaluation",
    description: "Appendicitis, hernia incarceration, cholecystitis, wound exploration",
    isEmergencyCategory: false,
    requiresHospitalEmergency: false,
    redFlagSymptoms: [
      "Board-like abdominal rigidity with high fever",
      "Signs of peritonitis or bowel strangulation",
    ],
    commonServices: ["GENERAL_SURGERY"],
  },
  {
    code: "MATERNITY",
    label: "Routine Maternity / Normal Delivery",
    description: "Low-risk labor, active labor without complications, routine prenatal",
    isEmergencyCategory: false,
    requiresHospitalEmergency: false,
    redFlagSymptoms: [
      "Fetal heart rate abnormalities",
      "Meconium-stained amniotic fluid",
    ],
    commonServices: ["MATERNITY_CARE"],
  },
  {
    code: "PEDIATRICS",
    label: "Pediatric Care",
    description: "Pediatric infections, dehydration, failure to thrive, specialist consult",
    isEmergencyCategory: false,
    requiresHospitalEmergency: false,
    redFlagSymptoms: [
      "Lethargy or inability to feed in an infant",
      "High fever with seizures or petechial rash",
      "Severe dehydration with sunken fontanelle",
    ],
    commonServices: ["PEDIATRICS"],
  },
  {
    code: "GENERAL_CONSULTATION",
    label: "General Consultation / Primary Care",
    description: "Non-urgent outpatient consultation, routine check-up, primary follow-up",
    isEmergencyCategory: false,
    requiresHospitalEmergency: false,
    redFlagSymptoms: [],
    commonServices: ["PRIMARY_CARE"],
  },
]

export function getCaseCategoryDefinition(code: string): CaseCategoryDefinition | undefined {
  return CASE_CATEGORIES.find((c) => c.code === code)
}
