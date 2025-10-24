/**
 * Detailed information about tarot spreads for info modals
 */

interface SpreadInfoSection {
  title: string;
  content: string;
}

export const SPREAD_INFO: Record<string, SpreadInfoSection[]> = {
  'single-card': [
    {
      title: '',
      content: `The Single Card spread is the simplest and most direct form of tarot reading, perfect for daily guidance or quick insights.

When to use:
• Daily morning or evening practice
• Quick check-in with your intuition
• When you need a simple yes/no perspective
• To focus on a specific quality or energy

This spread cuts through complexity to reveal the essential energy surrounding your question. Despite its simplicity, a single card can contain profound wisdom when contemplated deeply.

The single card is ideal for building a regular tarot practice, as it allows you to develop familiarity with each card's nuances over time.`,
    },
  ],

  'three-card': [
    {
      title: '',
      content: `The Past-Present-Future spread is one of the most versatile and popular tarot layouts. It provides clarity on how situations have evolved and where they're heading.

How to read it:
• Past: The foundation and influences that brought you here
• Present: Current energies, challenges, and opportunities
• Future: Likely outcome if you continue on this path

This spread works beautifully for:
• Understanding a developing situation
• Gaining perspective on a decision
• Tracking the evolution of a relationship or project
• Seeing how past patterns influence your current reality

The three cards together tell a story of transformation, showing how energy flows and changes over time. The future card represents potential, not fate - it shows where current momentum is leading, giving you the power to adjust your course.`,
    },
  ],

  'five-elements': [
    {
      title: '',
      content: `The Five Elements spread connects your question to the fundamental forces of nature: Earth, Water, Fire, Air, and Spirit.

The positions represent:
• Earth (Center): Your grounding and practical foundation
• Water (Left): Your emotions and intuitive knowing
• Fire (Bottom): Your passion, will, and creative spark
• Air (Right): Your thoughts, communication, and mental clarity
• Spirit (Top): Higher guidance and spiritual perspective

This spread is powerful for:
• Understanding imbalance in your life
• Connecting with natural wisdom
• Finding harmony between different aspects of self
• Receiving holistic guidance that addresses all dimensions

The elemental framework helps you see how different energies interact within your situation. When one element is blocked or excessive, the spread reveals what's needed to restore balance.

This spread honors the ancient wisdom that everything contains and expresses these primal forces.`,
    },
  ],

  'celtic-cross': [
    {
      title: '',
      content: `The Celtic Cross is the most comprehensive and famous tarot spread, offering deep insight into complex situations. Its ten positions create a complete picture of past, present, and potential future.

The positions reveal:
1. Present Position: Your current state and central issue
2. Challenge: What crosses or complicates the situation
3. Foundation: Deep past influences and root causes
4. Recent Past: Events and energies moving behind you
5. Best Outcome: The highest potential available
6. Near Future: What's approaching in the coming weeks
7. Your Position: How you see yourself in this situation
8. Environment: External influences and others' perspectives
9. Hopes & Fears: Your inner landscape of desire and anxiety
10. Final Outcome: Where everything is leading

This spread is ideal for:
• Life-changing decisions
• Complex relationship dynamics
• Career transitions
• Deep self-understanding
• When you need comprehensive guidance

The Celtic Cross requires time and contemplation. Each position interacts with the others, creating layers of meaning. The crossing card (#2) is particularly important - it shows what complicates or challenges your current position, revealing hidden tensions.

This spread rewards patience and reflection, often revealing insights that unfold over days or weeks.`,
    },
  ],
};
