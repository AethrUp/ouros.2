/**
 * I Ching AI Interpretation Prompt Templates
 */

import { CastedHexagram } from '../types/iching';
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

IMPORTANT:
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

Please provide a comprehensive interpretation now.`;

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
): string => {
  const { hexagram: primary, changingLines } = primaryHexagram;

  let interpretation = `QUESTION: ${question}\n\n`;

  interpretation += `HEXAGRAM ${primary.number}: ${primary.englishName} (${primary.chineseName})\n\n`;

  interpretation += `${primary.meaning}\n\n`;

  interpretation += `JUDGMENT:\n${primary.judgment}\n\n`;

  interpretation += `IMAGE:\n${primary.image}\n\n`;

  interpretation += `THE TRIGRAMS:\n`;
  interpretation += `Upper Trigram: ${primary.upperTrigram.englishName} (${primary.upperTrigram.attribute})\n`;
  interpretation += `Lower Trigram: ${primary.lowerTrigram.englishName} (${primary.lowerTrigram.attribute})\n\n`;

  interpretation += `This hexagram represents ${primary.keywords
    .slice(0, 3)
    .join(', ')}. `;

  if (changingLines.length > 0) {
    interpretation += `\n\nCHANGING LINES:\n`;
    interpretation += `There ${
      changingLines.length === 1 ? 'is' : 'are'
    } ${changingLines.length} changing ${
      changingLines.length === 1 ? 'line' : 'lines'
    } in this reading, indicating transformation and movement.\n`;
    interpretation += `Changing lines: ${changingLines
      .map((pos) => getLinePositionName(pos))
      .join(', ')}\n`;
  }

  if (relatingHexagram) {
    const relating = relatingHexagram.hexagram;
    interpretation += `\n\nRELATING HEXAGRAM ${relating.number}: ${relating.englishName} (${relating.chineseName})\n\n`;
    interpretation += `The relating hexagram represents the future development or outcome of this situation. ${relating.meaning}\n`;
    interpretation += `The transformation moves from ${primary.englishName} to ${relating.englishName}, `;
    interpretation += `suggesting a journey from ${primary.keywords[0]} toward ${relating.keywords[0]}.\n`;
  }

  interpretation += `\n\nGUIDANCE:\n`;
  interpretation += `Reflect deeply on how this hexagram's wisdom applies to your question. `;
  interpretation += `Consider both the traditional texts and your intuitive understanding. `;
  interpretation += `The I Ching offers guidance for the present moment and the path ahead.\n`;

  return interpretation;
};

/**
 * Validate AI response for I Ching interpretation
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
