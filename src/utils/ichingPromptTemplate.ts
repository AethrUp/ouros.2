/**
 * I Ching AI Interpretation Prompt Templates
 */

import { CastedHexagram, IChingInterpretation, IChingInterpretationV2 } from '../types/iching';
import { getLineSymbol, getLinePositionName } from './ichingCasting';

interface IChingPromptContext {
  question: string;
  primaryHexagram: CastedHexagram;
  relatingHexagram?: CastedHexagram;
  context?: {
    birthData?: any;
    preferences?: any;
    currentDate?: string;
  };
  style?: 'traditional' | 'psychological' | 'spiritual' | 'practical';
  detailLevel?: 'concise' | 'detailed' | 'comprehensive';
}

/**
 * Construct the main AI prompt for I Ching interpretation
 */
export const constructIChingPrompt = ({
  question,
  primaryHexagram,
  relatingHexagram,
  context,
  style = 'psychological',
  detailLevel = 'detailed',
}: IChingPromptContext): string => {
  const { hexagram: primary, lines, changingLines } = primaryHexagram;

  // Build hexagram visualization
  const hexagramDisplay = buildHexagramDisplay(primaryHexagram);
  const relatingDisplay = relatingHexagram
    ? buildHexagramDisplay(relatingHexagram)
    : null;

  // Build changing lines description
  const changingLinesDesc =
    changingLines.length > 0
      ? `\n\nCHANGING LINES:\n${changingLines
          .map(
            (pos) =>
              `${getLinePositionName(pos)}: ${getLineSymbol(
                lines[pos - 1].type
              )}`
          )
          .join('\n')}`
      : '\n\nNo changing lines in this reading.';

  // Style-specific instructions
  const styleInstructions = getStyleInstructions(style);

  // Detail level instructions
  const detailInstructions = getDetailInstructions(detailLevel);

  // Personalization context
  const personalContext = context?.birthData
    ? `\n\nQUERENT'S CONTEXT:\nBirth Date: ${context.birthData.date}\nBirth Time: ${context.birthData.time}\n`
    : '';

  const prompt = `You are a wise I Ching consultant with deep understanding of the ancient Chinese Book of Changes. You will provide an interpretation that is insightful, practical, and relevant to the querent's question.

QUESTION:
"${question}"

PRIMARY HEXAGRAM:
Hexagram ${primary.number}: ${primary.englishName} (${primary.chineseName} ${primary.pinyinName})

${hexagramDisplay}

TRIGRAMS:
Upper Trigram: ${primary.upperTrigram.englishName} (${primary.upperTrigram.chineseName}) - ${primary.upperTrigram.attribute}
Lower Trigram: ${primary.lowerTrigram.englishName} (${primary.lowerTrigram.chineseName}) - ${primary.lowerTrigram.attribute}

TRADITIONAL TEXT:
Judgment: ${primary.judgment}
Image: ${primary.image}

KEYWORDS: ${primary.keywords.join(', ')}${changingLinesDesc}${
    relatingHexagram
      ? `\n\nRELATING HEXAGRAM (Future/Outcome):
Hexagram ${relatingHexagram.hexagram.number}: ${relatingHexagram.hexagram.englishName} (${relatingHexagram.hexagram.chineseName} ${relatingHexagram.hexagram.pinyinName})

${relatingDisplay}

This hexagram represents the situation after the changes have occurred, showing the potential outcome or future development.`
      : ''
  }${personalContext}

INTERPRETATION STYLE: ${style}
${styleInstructions}

${detailInstructions}

IMPORTANT INTERPRETATION GUIDELINES:
1. Address the querent's question directly and specifically
2. Explain the symbolism of the hexagram in relation to their situation
3. If there are changing lines, explain their significance and the transformation they indicate
4. If there is a relating hexagram, explain the journey from the present to the future state
5. Provide practical, actionable guidance
6. Be honest - the I Ching sometimes advises patience, restraint, or acceptance
7. Write in a warm, wise, and accessible tone
8. Keep the mystical elements balanced with practical wisdom
9. Reference the traditional texts (Judgment and Image) in your interpretation
10. Explain what the interaction of the two trigrams means for this situation

CRITICAL RESPONSE FORMAT REQUIREMENTS:
You MUST return your interpretation as a valid JSON object with the following structure. Return ONLY the JSON object, with no other text before or after.

{
  "interpretation": {
    "overview": "2-3 sentence summary of the main message and what this hexagram means for the querent",
    "present_situation": "Explain what this hexagram reveals about their current circumstances, referencing the traditional texts",
    "trigram_dynamics": "Describe how the upper and lower trigrams interact to create meaning in this specific situation",
    "changing_lines": ${
      changingLines.length > 0
        ? '"Detailed analysis of the changing lines and their significance for transformation"'
        : 'null'
    },
    "transformation": ${
      relatingHexagram
        ? '"Describe the journey from the present hexagram to the relating hexagram, explaining what this transformation means"'
        : 'null'
    },
    "guidance": "Practical advice and actionable wisdom the querent can apply to their situation",
    "timing": "Insights about when to act, when to wait, or natural timing and rhythm of the situation",
    "key_insight": "The single most important takeaway or insight for the querent's situation"
  },
  "tone": "warm|wise|encouraging|cautionary",
  "confidence": "high|medium|low"
}

FIELD REQUIREMENTS:
- All text fields must be filled with substantial, specific content related to this hexagram and question
- Each field should be at least 2-3 sentences unless otherwise specified
- The "changing_lines" field should be null if there are no changing lines
- The "transformation" field should be null if there is no relating hexagram
- Choose a tone that best matches the hexagram and situation
- Assess confidence based on how clearly the hexagram addresses the question
- Do NOT include any explanatory text outside the JSON structure
- Ensure all JSON is properly escaped and valid

Return ONLY the JSON object now.`;

  return prompt;
};

/**
 * Build visual display of hexagram
 */
const buildHexagramDisplay = (castedHexagram: CastedHexagram): string => {
  const { lines } = castedHexagram;

  // Build from top to bottom for display (reverse of internal representation)
  const display = lines
    .slice()
    .reverse()
    .map((line, idx) => {
      const position = 6 - idx;
      return `${getLinePositionName(position)}: ${getLineSymbol(line.type)}`;
    })
    .join('\n');

  return display;
};

/**
 * Get style-specific instructions
 */
const getStyleInstructions = (style: string): string => {
  switch (style) {
    case 'traditional':
      return `Use classical I Ching interpretative language and emphasize the wisdom of the ancient text. Reference Chinese philosophy and concepts like yin/yang, the Tao, and wu wei when appropriate. Maintain a formal, scholarly tone while remaining accessible.`;

    case 'psychological':
      return `Interpret the hexagram through a psychological lens, focusing on inner states, personal growth, and unconscious patterns. Draw connections to the querent's psychological development and self-awareness. Use Carl Jung's approach to the I Ching as inspiration.`;

    case 'spiritual':
      return `Emphasize the spiritual dimensions of the reading, including karmic lessons, soul growth, and divine timing. Connect the hexagram to higher purpose and spiritual development. Offer meditative practices or spiritual insights related to the hexagram.`;

    case 'practical':
      return `Focus on concrete, actionable advice and real-world applications. Translate the ancient wisdom into modern terms and situations. Emphasize practical steps the querent can take based on the hexagram's guidance.`;

    default:
      return `Provide a balanced interpretation that honors the traditional wisdom while making it relevant to modern life.`;
  }
};

/**
 * Get detail level instructions
 */
const getDetailInstructions = (detailLevel: string): string => {
  switch (detailLevel) {
    case 'concise':
      return `LENGTH: Provide a concise interpretation of 2-3 paragraphs (200-300 words). Focus on the most essential insights and guidance.`;

    case 'detailed':
      return `LENGTH: Provide a detailed interpretation of 4-6 paragraphs (400-600 words). Include:
- Overview of the hexagram's meaning in context of the question
- Explanation of the trigram interaction
- Interpretation of changing lines (if any)
- Guidance for the present situation
- Relating hexagram interpretation (if applicable)
- Practical advice and next steps`;

    case 'comprehensive':
      return `LENGTH: Provide a comprehensive interpretation of 6-10 paragraphs (800-1200 words). Include:
- Deep exploration of the hexagram's meaning
- Detailed analysis of each trigram and their interaction
- Line-by-line analysis of changing lines (if any)
- Multiple dimensions of interpretation (psychological, practical, spiritual)
- Relating hexagram detailed analysis (if applicable)
- Specific actionable guidance
- Timing and seasonal considerations
- Potential challenges and opportunities
- Meditation or reflection prompts`;

    default:
      return `LENGTH: Provide a balanced interpretation of moderate length (400-600 words).`;
  }
};

/**
 * Construct static interpretation (fallback when AI is unavailable)
 */
export const constructStaticIChingInterpretation = (
  question: string,
  primaryHexagram: CastedHexagram,
  relatingHexagram?: CastedHexagram
): IChingInterpretation => {
  const { hexagram: primary, changingLines } = primaryHexagram;
  const hasChangingLines = changingLines.length > 0;

  return {
    interpretation: {
      overview: `You have received Hexagram ${primary.number}: ${primary.englishName} (${primary.chineseName}). This hexagram speaks to themes of ${primary.keywords.slice(0, 3).join(', ')}. In relation to your question "${question}", this hexagram offers guidance about ${primary.keywords[0]}.`,

      present_situation: `${primary.meaning}\n\nThe Judgment says: "${primary.judgment}"\n\nThe Image says: "${primary.image}"\n\nThese traditional texts provide the foundation for understanding your current situation through the lens of ${primary.englishName}.`,

      trigram_dynamics: `The upper trigram is ${primary.upperTrigram.englishName} (${primary.upperTrigram.chineseName}), representing ${primary.upperTrigram.attribute}, while the lower trigram is ${primary.lowerTrigram.englishName} (${primary.lowerTrigram.chineseName}), representing ${primary.lowerTrigram.attribute}. The interplay of ${primary.upperTrigram.englishName} above and ${primary.lowerTrigram.englishName} below creates the dynamic energy of ${primary.englishName}. This combination suggests a situation where ${primary.upperTrigram.attribute} influences ${primary.lowerTrigram.attribute}, creating the conditions for ${primary.keywords[0]}.`,

      changing_lines: hasChangingLines
        ? `There ${changingLines.length === 1 ? 'is' : 'are'} ${changingLines.length} changing ${changingLines.length === 1 ? 'line' : 'lines'} in this reading (${changingLines.map((pos) => getLinePositionName(pos)).join(', ')}), indicating transformation and movement. The presence of changing lines suggests that your situation is in flux and evolution is at hand. These lines point to specific areas where change is occurring or needed, and they serve as markers of the transformation from the present to the future state.`
        : null,

      transformation: relatingHexagram
        ? `The transformation leads to Hexagram ${relatingHexagram.hexagram.number}: ${relatingHexagram.hexagram.englishName} (${relatingHexagram.hexagram.chineseName}). ${relatingHexagram.hexagram.meaning} This suggests a journey from ${primary.englishName} (${primary.keywords[0]}) toward ${relatingHexagram.hexagram.englishName} (${relatingHexagram.hexagram.keywords[0]}). The relating hexagram represents the future development or potential outcome of your situation as it evolves and transforms.`
        : null,

      guidance: `Reflect deeply on how this hexagram's wisdom applies to your question. Consider both the traditional texts and your intuitive understanding of the symbols and meanings presented. The themes of ${primary.keywords.slice(0, 3).join(', ')} are particularly relevant to your situation at this time. Contemplate the relationship between the upper and lower trigrams and how their interaction reflects the dynamics of your circumstances. The I Ching invites you to align yourself with the natural way and respond to your situation with wisdom and awareness.`,

      timing: hasChangingLines
        ? 'This is a time of transition and change. The presence of changing lines indicates that movement is happening now or will soon unfold. Pay attention to the natural rhythm of events and be prepared to act when the moment is right. The transformation is already in motion, and your awareness of this timing can help you navigate the changes with grace and wisdom.'
        : 'This situation calls for steady presence and awareness. The absence of changing lines suggests a time to fully embody the qualities of this hexagram before seeking change. This is a period for deepening your understanding, consolidating your position, and allowing the situation to mature naturally. There is wisdom in patience and in recognizing when stillness serves better than movement.',

      key_insight: `The I Ching offers guidance for the present moment and the path ahead. Hexagram ${primary.number}, ${primary.englishName}, invites you to embrace the qualities of ${primary.keywords[0]} in response to your question. Trust in the wisdom of this ancient oracle and let its guidance illuminate your way forward.`,
    },
    tone: 'wise',
    confidence: 'medium',
  };
};

/**
 * Validate AI response for I Ching interpretation (legacy string validation)
 */
export const validateIChingResponse = (
  response: string
): { valid: boolean; error?: string } => {
  if (!response || response.trim().length === 0) {
    return { valid: false, error: 'Response is empty' };
  }

  if (response.length < 100) {
    return { valid: false, error: 'Response is too short' };
  }

  if (response.length > 10000) {
    return { valid: false, error: 'Response is too long' };
  }

  // Check for common AI refusal patterns
  const refusalPatterns = [
    'I cannot',
    'I am not able',
    'I do not have access',
    'As an AI',
    'I apologize, but',
  ];

  for (const pattern of refusalPatterns) {
    if (response.includes(pattern)) {
      return {
        valid: false,
        error: 'AI declined to provide interpretation',
      };
    }
  }

  return { valid: true };
};

/**
 * Type guard to check if interpretation is structured format
 */
export const isStructuredInterpretation = (
  interpretation: string | IChingInterpretation
): interpretation is IChingInterpretation => {
  return (
    typeof interpretation === 'object' &&
    interpretation !== null &&
    'interpretation' in interpretation &&
    'tone' in interpretation &&
    'confidence' in interpretation
  );
};

/**
 * Validate structured I Ching interpretation JSON
 */
export const validateIChingInterpretationJSON = (
  response: any
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check if response is an object
  if (typeof response !== 'object' || response === null) {
    errors.push('Response is not a valid object');
    return { valid: false, errors };
  }

  // Check top-level fields
  if (!response.interpretation) {
    errors.push('Missing interpretation object');
    return { valid: false, errors };
  }
  if (!response.tone) errors.push('Missing tone');
  if (!response.confidence) errors.push('Missing confidence');

  // Check interpretation fields
  const interp = response.interpretation;
  if (typeof interp !== 'object' || interp === null) {
    errors.push('interpretation is not a valid object');
    return { valid: false, errors };
  }

  if (!interp.overview) errors.push('Missing interpretation.overview');
  if (!interp.present_situation)
    errors.push('Missing interpretation.present_situation');
  if (!interp.trigram_dynamics)
    errors.push('Missing interpretation.trigram_dynamics');
  // Note: changing_lines and transformation can be null
  if (interp.changing_lines === undefined)
    errors.push('Missing interpretation.changing_lines (should be string or null)');
  if (interp.transformation === undefined)
    errors.push('Missing interpretation.transformation (should be string or null)');
  if (!interp.guidance) errors.push('Missing interpretation.guidance');
  if (!interp.timing) errors.push('Missing interpretation.timing');
  if (!interp.key_insight) errors.push('Missing interpretation.key_insight');

  // Validate tone values
  const validTones = ['warm', 'wise', 'encouraging', 'cautionary'];
  if (response.tone && !validTones.includes(response.tone)) {
    errors.push(`Invalid tone: ${response.tone}. Must be one of: ${validTones.join(', ')}`);
  }

  // Validate confidence values
  const validConfidence = ['high', 'medium', 'low'];
  if (response.confidence && !validConfidence.includes(response.confidence)) {
    errors.push(
      `Invalid confidence: ${response.confidence}. Must be one of: ${validConfidence.join(', ')}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
