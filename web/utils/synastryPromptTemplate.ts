/**
 * AI Prompt Templates for Synastry Reading Generation
 * Uses Anthropic Claude API
 */

import { SynastryChart, SynastryAspect } from '../types/synastry';
import { NatalChartData, UserProfile } from '../types/user';

/**
 * Format synastry aspects for prompt
 */
const formatSynastryAspects = (aspects: SynastryAspect[]): string => {
  const lines: string[] = [];

  // Group by category
  const grouped = aspects.reduce((acc, aspect) => {
    if (!acc[aspect.category]) acc[aspect.category] = [];
    acc[aspect.category].push(aspect);
    return acc;
  }, {} as Record<string, SynastryAspect[]>);

  Object.entries(grouped).forEach(([category, categoryAspects]) => {
    lines.push(`\n${category.toUpperCase()} ASPECTS:`);
    categoryAspects
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5) // Top 5 per category
      .forEach((aspect) => {
        const harmoniousMarker = aspect.isHarmonious ? '✓' : '⚠';
        lines.push(
          `  ${harmoniousMarker} ${aspect.planet1} ${aspect.type} ${aspect.planet2} (${aspect.orb.toFixed(1)}° orb, ${Math.round(aspect.strength * 100)}% strength)`
        );
      });
  });

  return lines.join('\n');
};

/**
 * Format natal chart summary for prompt
 */
const formatChartSummary = (chart: NatalChartData, personName: string): string => {
  const { planets } = chart;
  const sun = planets.Sun || planets.sun;
  const moon = planets.Moon || planets.moon;
  const ascendant = chart.angles.ascendant;

  return `${personName}'s Chart: Sun in ${sun.sign}, Moon in ${moon.sign}, Ascendant at ${ascendant.toFixed(1)}°`;
};

/**
 * Create synastry reading generation prompt for Claude
 */
export const createSynastryPrompt = (
  synastryChart: SynastryChart,
  person1Chart: NatalChartData,
  person2Chart: NatalChartData,
  person1Name: string,
  person2Name: string,
  relationshipContext?: string,
  detailLevel: 'brief' | 'detailed' | 'comprehensive' = 'detailed'
): string => {
  const aspectsText = formatSynastryAspects(synastryChart.synastryAspects);
  const person1Summary = formatChartSummary(person1Chart, person1Name);
  const person2Summary = formatChartSummary(person2Chart, person2Name);

  const lengthGuidance = {
    brief: '2-3 paragraphs',
    detailed: '4-6 paragraphs',
    comprehensive: '8-12 paragraphs',
  };

  const relationshipGuidance = relationshipContext
    ? `RELATIONSHIP CONTEXT: ${person1Name} describes ${person2Name} as their "${relationshipContext}".
Tailor your interpretation to this specific relationship dynamic. Consider what matters most in this type of connection and frame your insights accordingly.`
    : `RELATIONSHIP CONTEXT: General compatibility analysis.
Provide a balanced overview that could apply to any type of meaningful connection.`;

  return `You are an expert relationship astrologer providing a synastry analysis. Your writing should be:
- Warm and insightful, like a trusted advisor
- Balanced between strengths and challenges
- Specific to the actual aspects in the charts
- Practical and actionable
- Supportive and growth-oriented
- Free of astrological jargon (explain concepts in plain language)

CONTEXT:
${person1Summary}
${person2Summary}

${relationshipGuidance}

COMPATIBILITY SCORE: ${synastryChart.compatibilityScore}/100

ELEMENT COMPATIBILITY:
- Fire: ${synastryChart.elementCompatibility?.fire}/100
- Earth: ${synastryChart.elementCompatibility?.earth}/100
- Air: ${synastryChart.elementCompatibility?.air}/100
- Water: ${synastryChart.elementCompatibility?.water}/100
Overall: ${synastryChart.elementCompatibility?.overall}/100 - ${synastryChart.elementCompatibility?.description}

MODALITY COMPATIBILITY:
- Cardinal: ${synastryChart.modalityCompatibility?.cardinal}/100
- Fixed: ${synastryChart.modalityCompatibility?.fixed}/100
- Mutable: ${synastryChart.modalityCompatibility?.mutable}/100
Overall: ${synastryChart.modalityCompatibility?.overall}/100 - ${synastryChart.modalityCompatibility?.description}

INTER-CHART ASPECTS:
${aspectsText}

KEY STRENGTHS:
${synastryChart.strengths.map((s) => `- ${s}`).join('\n')}

KEY CHALLENGES:
${synastryChart.challenges.map((c) => `- ${c}`).join('\n')}

LENGTH: ${lengthGuidance[detailLevel]}

Generate a ${detailLevel} synastry reading with the following structure:

1. OPENING (1 paragraph)
   - Set the tone and context
   - Acknowledge the relationship context if provided
   - Mention overall compatibility score and what it means
   - Give a preview of key themes

2. STRENGTHS SECTION (${detailLevel === 'brief' ? '1 paragraph' : '2-3 paragraphs'})
   - Discuss the most harmonious aspects
   - Explain what these mean for their specific relationship
   - Give concrete examples of how these play out
   - Make them feel good about their connection

3. GROWTH AREAS SECTION (${detailLevel === 'brief' ? '1 paragraph' : '2-3 paragraphs'})
   - Discuss challenging aspects constructively
   - Frame as opportunities for growth
   - Provide practical strategies for navigating difficulties
   - Emphasize that challenges can strengthen the bond

4. ELEMENTAL & MODALITY COMPATIBILITY (${detailLevel === 'comprehensive' ? '2 paragraphs' : '1 paragraph'})
   - Explain how their elemental makeup interacts
   - Discuss their approaches to action and change
   - Connect to real-world situations in their relationship context

5. RELATIONSHIP DYNAMICS (${detailLevel === 'brief' ? '1 paragraph' : '2-3 paragraphs'})
   - Deep dive into aspects most relevant to their relationship type
   - Provide insights unique to this connection
   - Give practical advice tailored to their dynamic

6. ADVICE & RECOMMENDATIONS (1 paragraph)
   - Summarize key takeaways
   - Provide 3-5 actionable recommendations
   - End on an encouraging note

IMPORTANT GUIDELINES:
- Use plain language, not astrological jargon
- Be specific to the actual aspects listed above
- Balance positive and challenging information
- Frame challenges as growth opportunities
- Provide practical, actionable advice
- Write in a warm, supportive tone
- Reference ${person1Name} and ${person2Name} by name
- Tailor your language and focus to the relationship context provided
- Be honest but never discouraging
- Emphasize that astrology shows potentials, not destinies

Write the reading now as a flowing narrative. Do NOT use section headers or bullet points. Write in continuous paragraphs that flow naturally from one to the next.`;
};

/**
 * Create brief synastry summary prompt (for cards/previews)
 */
export const createSynastrySummaryPrompt = (
  synastryChart: SynastryChart,
  person1Name: string,
  person2Name: string
): string => {
  return `Create a 2-3 sentence summary of ${person1Name} and ${person2Name}'s compatibility based on this synastry chart:

Compatibility Score: ${synastryChart.compatibilityScore}/100
Strongest Aspects: ${synastryChart.synastryAspects.slice(0, 3).map((a) => `${a.planet1} ${a.type} ${a.planet2}`).join(', ')}
Key Strength: ${synastryChart.strengths[0]}
Key Challenge: ${synastryChart.challenges[0]}

Write a warm, encouraging summary that captures their dynamic. Use plain language, no jargon. Be specific to their chart.`;
};

/**
 * Validate synastry reading response
 */
export const validateSynastryResponse = (response: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!response || response.trim().length === 0) {
    errors.push('Response is empty');
  }

  if (response.length < 500) {
    errors.push('Response is too short for a complete reading');
  }

  if (response.length > 10000) {
    errors.push('Response is unusually long');
  }

  // Check for common failure patterns
  if (response.includes('I apologize') || response.includes("I can't")) {
    errors.push('Response contains apology or refusal');
  }

  if (response.includes('[') || response.includes('{')) {
    errors.push('Response appears to contain JSON or template syntax');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
