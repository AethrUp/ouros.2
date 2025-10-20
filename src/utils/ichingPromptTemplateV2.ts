/**
 * I Ching AI Interpretation Prompt Templates V2 - Structured Format
 */

import { CastedHexagram, IChingInterpretationV2 } from '../types/iching';
import { getLineSymbol, getLinePositionName } from './ichingCasting';

interface IChingPromptContextV2 {
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
 * Get style-specific guidance
 */
const getStyleGuidance = (style: string): string => {
  switch (style) {
    case 'traditional':
      return `Use classical I Ching interpretative language and emphasize the wisdom of the ancient text. Reference Chinese philosophy (yin/yang, Tao, wu wei) in accessible terms. Maintain scholarly wisdom while remaining approachable.`;

    case 'psychological':
      return `Interpret through a psychological lens, focusing on inner states, personal growth, and unconscious patterns. Draw on Carl Jung's approach to the I Ching. Emphasize self-awareness and psychological development.`;

    case 'spiritual':
      return `Emphasize spiritual dimensions including karmic lessons, soul growth, and divine timing. Connect to higher purpose and spiritual development. Offer meditative practices related to the hexagram.`;

    case 'practical':
      return `Focus on concrete, actionable advice. Translate ancient wisdom to modern terms and situations. Emphasize practical steps they can take based on the hexagram's guidance.`;

    default:
      return `Provide balanced interpretation honoring traditional wisdom while making it relevant to modern life.`;
  }
};

/**
 * Construct I Ching interpretation prompt V2 (Structured JSON format)
 */
export const constructIChingPromptV2 = ({
  question,
  primaryHexagram,
  relatingHexagram,
  context,
  style = 'psychological',
  detailLevel = 'detailed',
}: IChingPromptContextV2): string => {
  const { hexagram: primary, lines, changingLines } = primaryHexagram;

  // Build hexagram visualization
  const hexagramDisplay = buildHexagramDisplay(primaryHexagram);
  const relatingDisplay = relatingHexagram
    ? buildHexagramDisplay(relatingHexagram)
    : null;

  // Build changing lines description
  const changingLinesText =
    changingLines.length > 0
      ? changingLines
          .map(
            (pos) =>
              `${getLinePositionName(pos)}: ${getLineSymbol(
                lines[pos - 1].type
              )}`
          )
          .join('\n')
      : 'No changing lines in this reading.';

  const hasChangingLines = changingLines.length > 0;
  const hasRelatingHexagram = !!relatingHexagram;

  const styleGuidance = getStyleGuidance(style);

  const personalContext = context?.birthData
    ? `\nQuerent's Birth Date: ${context.birthData.date}\nBirth Time: ${context.birthData.time}\n`
    : '';

  return `IMPORTANT: Return ONLY valid JSON, no explanatory text before or after.

You are a wise I Ching consultant with deep understanding of the ancient Chinese Book of Changes. You will provide an interpretation that is insightful, practical, and relevant to the querent's question.

WRITING STYLE & TONE:
You're interpreting the I Ching with the wisdom of someone who has studied it deeply and can make ancient wisdom accessible and relevant today.

Tone:
- Wise but warm, not distant or overly formal
- Respectful of the tradition while being accessible
- Thoughtful and considered - the I Ching is not hasty
- Honest about what the hexagram shows, including patience or difficulty
- Empowering - helping them understand their path forward

Language Level:
- Write for someone curious about the I Ching who may not know it deeply
- Explain Chinese concepts (yin/yang, wu wei, Tao) in accessible terms
- Reference the traditional texts but translate them to modern understanding
- Connect ancient wisdom to contemporary situations they'll recognize

Content Approach:
- Ground the reading in the querent's specific question
- Explain the hexagram's symbolism and what it means for their situation
- Show how the trigrams interact to create meaning
- If changing lines exist, explain the transformation underway
- Give practical guidance rooted in I Ching wisdom
- Balance philosophical depth with actionable insight

What to Avoid:
- Overly mystical language that obscures meaning
- Academic jargon that distances the reader
- Ignoring the question to give generic hexagram interpretation
- Dismissing traditional texts - they hold deep wisdom
- Being so poetic that practical guidance is lost

What to Include:
- Direct address to their question
- Explanation of hexagram symbolism in their context
- Traditional wisdom translated for modern understanding
- Specific guidance on timing and approach
- How changing lines indicate transformation
- Practical steps aligned with the hexagram's wisdom
- Reflection questions for deeper understanding

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

KEYWORDS: ${primary.keywords.join(', ')}

CHANGING LINES:
${changingLinesText}${
    relatingHexagram
      ? `

RELATING HEXAGRAM (Future/Outcome):
Hexagram ${relatingHexagram.hexagram.number}: ${relatingHexagram.hexagram.englishName} (${relatingHexagram.hexagram.chineseName} ${relatingHexagram.hexagram.pinyinName})

${relatingDisplay}

This hexagram represents the situation after the changes have occurred.`
      : ''
  }${personalContext}

INTERPRETATION STYLE: ${style}
${styleGuidance}

HOW TO INTERPRET:
1. The Primary Hexagram shows the PRESENT SITUATION and its nature
2. The Trigrams (upper and lower) interact to create meaning - explain this dynamic
3. The Traditional Texts (Judgment and Image) contain concentrated wisdom - reference them
4. Changing Lines show specific transformation happening - they're very important
5. The Relating Hexagram (if present) shows the FUTURE STATE after transformation
6. Always address the querent's specific question
7. Balance ancient wisdom with practical, modern guidance

THE I CHING'S WISDOM:
- Some hexagrams counsel bold action (Hexagram 1, 34, 51)
- Some counsel stillness and waiting (Hexagram 2, 5, 52)
- Some show necessary endings (Hexagram 23, 18)
- Some indicate breakthrough (Hexagram 43, 1)
- Honor what the hexagram actually says, even if it's patience or difficulty
- The I Ching is profoundly honest - trust its guidance

Create a DETAILED I Ching interpretation with this exact JSON structure. ALL FIELDS ARE REQUIRED:

{
  "title": "Compelling title that captures the hexagram's essence for this question (4-8 words)",
  "summary": "2-3 sentence overview of what this hexagram reveals about their question",
  "tone": "Contemplative|Dynamic|Cautionary|Auspicious",

  "overview": "Opening paragraph (4-6 sentences) introducing the hexagram and its relevance to their question. What is the nature of this time? What does this hexagram fundamentally represent?",

  "presentSituation": "4-6 sentences describing what the hexagram reveals about where they are right now. What energy or pattern is present? How does this hexagram illuminate their current circumstances? Reference the traditional Judgment text.",

  "trigramDynamics": {
    "interaction": "4-5 sentences explaining how the upper and lower trigrams interact to create this hexagram's meaning. What does this combination signify? How do these two energies work together or create tension?",
    "upperMeaning": "2-3 sentences on what the upper trigram represents in this context",
    "lowerMeaning": "2-3 sentences on what the lower trigram represents in this context"
  },

  "changingLines": {
    "present": ${
      hasChangingLines
        ? '"4-6 sentences interpreting the changing lines and what transformation they indicate. Which aspects of the situation are in flux? What do these specific lines counsel?"'
        : '"No changing lines in this reading - the situation is stable in its current form. The guidance is to understand and work with the present hexagram fully."'
    },
    "significance": ${
      hasChangingLines
        ? '"2-3 sentences on what it means that THESE specific lines are changing"'
        : '"Stability suggests this is a time to fully embody this hexagram\'s wisdom rather than seek change."'
    }
  },

  "transformation": {
    "journey": ${
      hasRelatingHexagram
        ? '"4-5 sentences describing the journey from the present hexagram to the relating hexagram. What transformation is underway? What is leaving and what is emerging?"'
        : '"With no changing lines, the focus is on mastering the wisdom of this single hexagram. No transformation to another hexagram is indicated - deepen into what IS."'
    },
    "futureState": ${
      hasRelatingHexagram
        ? '"3-4 sentences describing what the relating hexagram shows about where things are heading. What will the situation become? What qualities will emerge?"'
        : '"The future grows from fully understanding and embodying this hexagram\'s teaching."'
    }
  },

  "guidance": {
    "wisdom": "4-5 sentences of practical guidance rooted in this hexagram's teaching. What does the I Ching counsel? How should they approach this situation? Reference the traditional Image text if helpful.",
    "rightAction": [
      "Specific action or approach aligned with this hexagram 1",
      "Specific action or approach aligned with this hexagram 2",
      "Specific action or approach aligned with this hexagram 3"
    ],
    "toEmbody": [
      "Quality or principle to cultivate 1",
      "Quality or principle to cultivate 2",
      "Quality or principle to cultivate 3"
    ],
    "toAvoid": [
      "Approach or pattern that works against this hexagram's wisdom 1",
      "Approach or pattern that works against this hexagram's wisdom 2"
    ]
  },

  "timing": {
    "nature": "3-4 sentences on the timing and rhythm of this situation. Is this a time for action or patience? Speed or slowness? What is the natural tempo of this hexagram?",
    "whenToAct": "2-3 sentences on when and how to move forward",
    "whenToWait": "2-3 sentences on when and why to be still"
  },

  "keyInsight": "2-3 sentences capturing the single most important wisdom this hexagram offers for their question. This should be the core teaching they carry forward.",

  "reflectionPrompts": [
    "Deep question for contemplation related to this hexagram 1?",
    "Deep question for contemplation related to this hexagram 2?",
    "Deep question for contemplation related to this hexagram 3?",
    "Deep question for contemplation related to this hexagram 4?"
  ],

  "conclusion": "Closing paragraph (2-3 sentences) that honors both the ancient wisdom and their modern question. Leave them with clarity and confidence in the guidance received."
}

CRITICAL REQUIREMENTS:
1. Return ONLY the JSON object, no other text before or after
2. ALL fields must be present and filled completely
3. Always address the querent's specific question throughout
4. Reference the traditional Judgment and Image texts in your interpretation
5. Explain the trigram interaction - this is key to understanding the hexagram
6. If changing lines exist, give them significant attention
7. If relating hexagram exists, explain the transformation journey
8. Balance philosophical depth with practical guidance
9. Tone must be exactly one of: Contemplative, Dynamic, Cautionary, Auspicious
10. Write in second person ("you") to speak directly to the querent
11. Honor what the hexagram actually counsels - action, patience, caution, boldness
12. Reference Chinese concepts (yin/yang, wu wei, Tao) when helpful but explain them
13. Timing is important in I Ching - be specific about the rhythm of this situation
14. Key insight should distill the essential teaching
15. Reflection prompts should help them go deeper into the hexagram's wisdom
16. The I Ching is honest, sometimes difficult - don't sugarcoat but remain supportive

Create the complete structured reading now:`;
};

/**
 * Validate V2 I Ching interpretation JSON
 */
export const validateIChingInterpretationV2JSON = (
  response: any
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check if response is an object
  if (typeof response !== 'object' || response === null) {
    errors.push('Response is not a valid object');
    return { valid: false, errors };
  }

  // Check top-level fields
  if (!response.title) errors.push('Missing title');
  if (!response.summary) errors.push('Missing summary');
  if (!response.tone) errors.push('Missing tone');
  if (!response.overview) errors.push('Missing overview');
  if (!response.presentSituation) errors.push('Missing presentSituation');
  if (!response.trigramDynamics) errors.push('Missing trigramDynamics');
  if (!response.changingLines) errors.push('Missing changingLines');
  if (!response.transformation) errors.push('Missing transformation');
  if (!response.guidance) errors.push('Missing guidance');
  if (!response.timing) errors.push('Missing timing');
  if (!response.keyInsight) errors.push('Missing keyInsight');
  if (!response.reflectionPrompts) errors.push('Missing reflectionPrompts');
  if (!response.conclusion) errors.push('Missing conclusion');

  // Validate tone
  if (response.tone) {
    const validTones = ['Contemplative', 'Dynamic', 'Cautionary', 'Auspicious'];
    if (!validTones.includes(response.tone)) {
      errors.push(`tone must be one of: ${validTones.join(', ')}`);
    }
  }

  // Validate trigramDynamics structure
  if (response.trigramDynamics) {
    if (!response.trigramDynamics.interaction) errors.push('Missing trigramDynamics.interaction');
    if (!response.trigramDynamics.upperMeaning) errors.push('Missing trigramDynamics.upperMeaning');
    if (!response.trigramDynamics.lowerMeaning) errors.push('Missing trigramDynamics.lowerMeaning');
  }

  // Validate changingLines structure
  if (response.changingLines) {
    if (!response.changingLines.present) errors.push('Missing changingLines.present');
    if (!response.changingLines.significance) errors.push('Missing changingLines.significance');
  }

  // Validate transformation structure
  if (response.transformation) {
    if (!response.transformation.journey) errors.push('Missing transformation.journey');
    if (!response.transformation.futureState) errors.push('Missing transformation.futureState');
  }

  // Validate guidance structure
  if (response.guidance) {
    if (!response.guidance.wisdom) errors.push('Missing guidance.wisdom');
    if (!response.guidance.rightAction || !Array.isArray(response.guidance.rightAction)) {
      errors.push('guidance.rightAction must be an array');
    }
    if (!response.guidance.toEmbody || !Array.isArray(response.guidance.toEmbody)) {
      errors.push('guidance.toEmbody must be an array');
    }
    if (!response.guidance.toAvoid || !Array.isArray(response.guidance.toAvoid)) {
      errors.push('guidance.toAvoid must be an array');
    }
  }

  // Validate timing structure
  if (response.timing) {
    if (!response.timing.nature) errors.push('Missing timing.nature');
    if (!response.timing.whenToAct) errors.push('Missing timing.whenToAct');
    if (!response.timing.whenToWait) errors.push('Missing timing.whenToWait');
  }

  // Validate reflectionPrompts
  if (response.reflectionPrompts) {
    if (!Array.isArray(response.reflectionPrompts)) {
      errors.push('reflectionPrompts must be an array');
    } else if (response.reflectionPrompts.length < 3) {
      errors.push('reflectionPrompts must have at least 3 items');
    }
  }

  // Validate minimum content lengths
  if (response.overview && response.overview.length < 100) {
    errors.push('overview is too short');
  }
  if (response.keyInsight && response.keyInsight.length < 50) {
    errors.push('keyInsight is too short');
  }
  if (response.conclusion && response.conclusion.length < 50) {
    errors.push('conclusion is too short');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
