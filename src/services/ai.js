/**
 * Simple Rule-Based AI for identifying emergency type and priority
 * In a real application, this would call a Flask backend or Gemini API.
 */
export async function analyzeEmergency(text) {
  const lowerText = text.toLowerCase();
  
  let category = 'General Assistance';
  let priority = 'Medium';
  
  // Rule-based NLP mock
  if (lowerText.match(/fire|smoke|burning|flame|kitchen fire|alarm/)) {
    category = 'Fire';
    priority = 'CRITICAL';
  } else if (lowerText.match(/heart|chest|breathing|choking|unconscious|blood|fainted|injury|ambulance/)) {
    category = 'Medical';
    priority = 'CRITICAL';
  } else if (lowerText.match(/thief|gun|stolen|robbed|attack|intruder|fight|suspicious|threat|weapon/)) {
    category = 'Security Threat';
    priority = 'High';
  } else if (lowerText.match(/earthquake|flood|storm|cyclone|landslide|tsunami|disaster/)) {
    category = 'Natural Disaster';
    priority = 'CRITICAL';
  } else if (lowerText.match(/lost|evacuation|blocked exit/)) {
    category = 'General Assistance';
    priority = 'Medium';
  }

  let criticalScore = 50;

  if (priority === 'CRITICAL') criticalScore = 90 + Math.floor(Math.random() * 9); // 90-98
  else if (priority === 'High') criticalScore = 75 + Math.floor(Math.random() * 14); // 75-89
  else if (priority === 'Medium') criticalScore = 40 + Math.floor(Math.random() * 20); // 40-59
  else criticalScore = 20;

  // Simulate AI network delay
  await new Promise(r => setTimeout(r, 1500));

  return { category, priority, criticalScore };
}
