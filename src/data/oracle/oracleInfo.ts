/**
 * Information about oracle methods for the main oracle screen
 */

export interface OracleMethodSection {
  title: string;
  content: string;
}

export interface OracleMethodContent {
  title: string;
  sections: OracleMethodSection[];
}

export const ORACLE_METHOD_INFO: Record<string, OracleMethodContent> = {
  tarot: {
    title: 'Tarot',
    sections: [
      {
        title: 'What Tarot Is',
        content: `Tarot is an ancient divination system using a deck of 78 cards, each rich with symbolic imagery that speaks to universal human experiences, challenges, and potentials. The cards are divided into the Major Arcana (22 cards representing major life themes and spiritual lessons) and the Minor Arcana (56 cards reflecting everyday situations and emotions). Each card carries layers of meaning that can illuminate different aspects of your question or situation. Unlike fortune-telling that claims to predict fixed outcomes, tarot serves as a psychological and spiritual mirror, reflecting back the energies, patterns, and possibilities present in your life right now. The cards don't control your destiny—they help you see the forces at play so you can make more conscious choices about your path forward.

Tarot works through the principle of synchronicity—meaningful coincidences that reveal deeper patterns beneath surface events. When you draw cards with a specific question or intention, the universe (through your subconscious guidance) selects the exact symbolic messages you need to hear at that moment. Each card position in a spread represents a different aspect of your situation—such as past influences, present challenges, hidden factors, or potential outcomes. The AI in OUROS 2 doesn't just recite standard card meanings; it interprets how the cards relate to each other, the specific positions they occupy, and the deeper story they tell about your unique situation. This creates a personalized reading that speaks directly to your circumstances, offering insights that generic interpretations simply cannot provide.`,
      },
      {
        title: 'When Tarot Is Most Useful',
        content: `Tarot excels when you're facing complex emotional situations where logical analysis alone feels insufficient—those moments when you need perspective on relationships, career changes, creative blocks, or personal growth challenges. It's particularly powerful for questions that don't have simple yes/no answers, like "How can I improve my relationship with my sister?" or "What do I need to know about this career transition?" The cards help you explore the hidden dynamics, unconscious motivations, and potential consequences you might not be seeing clearly. Tarot is also invaluable during times of transition, grief, or major life decisions when you need to process emotions and gain clarity about what truly matters to you versus what you think you "should" want.

The oracle becomes especially meaningful when you're ready to take responsibility for your choices rather than looking for external validation or someone to tell you what to do. Tarot doesn't make decisions for you—it helps you understand the deeper currents in your life so you can navigate them more skillfully. Whether you're dealing with a difficult conversation, considering a move, processing a breakup, or wondering about your life purpose, tarot provides a safe space to explore your feelings and gain insights that your rational mind might miss. The cards often reveal surprising connections between seemingly unrelated aspects of your life, helping you see the bigger picture and understand how your inner world is creating your outer experiences.`,
      },
    ],
  },
  iching: {
    title: 'I Ching',
    sections: [
      {
        title: 'What I Ching Is',
        content: `The I Ching, or "Book of Changes," is a 3,000-year-old Chinese oracle system based on the fundamental principle that everything in the universe is in constant flux, following natural patterns of transformation. At its core are 64 hexagrams—six-line symbols made up of broken (yin) and solid (yang) lines that represent every possible combination of forces and energies in life situations. Each hexagram captures a specific moment in the natural cycle of change, from beginnings and growth phases to challenges, culminations, and new cycles. Rather than offering simple predictions, the I Ching provides strategic wisdom about timing, attitude, and action—helping you understand where you are in life's natural rhythms and how to work harmoniously with them. The oracle recognizes that the same situation can require completely different responses depending on the timing and context, making it remarkably sophisticated in its guidance.

The I Ching works through a consultation process where you pose a question and cast coins (or traditionally, yarrow stalks) to generate a hexagram that speaks to your situation. In OUROS 2, you virtually cast three coins six times, with each throw creating one line of your hexagram from bottom to top. If certain lines are "changing" (when all three coins show the same side), they indicate areas of dynamic transformation and point to a second hexagram showing how your situation is likely to evolve. The ancient text for each hexagram contains layers of meaning—from practical advice about relationships and decision-making to profound philosophical insights about human nature and cosmic principles. The AI interpretation helps you understand not just what the hexagram means, but how its wisdom applies specifically to your question and current life circumstances.`,
      },
      {
        title: 'When I Ching Is Most Useful',
        content: `The I Ching excels when you need guidance about timing and strategy—those crucial moments when you're wondering whether to act boldly, wait patiently, or change course entirely. It's particularly valuable for business decisions, relationship timing, creative projects, and major life transitions where understanding the natural flow of energy can mean the difference between success and struggle. If you're facing a situation where you sense there's a "right time" for action but can't quite figure out when that is, the I Ching provides remarkable insight into whether you're in a phase of gathering resources, breakthrough opportunity, or necessary patience. It's also invaluable when you're dealing with conflict or challenging relationships, offering profound wisdom about when to stand firm, when to yield, and how to maintain your integrity while adapting to changing circumstances.

The oracle becomes especially powerful during periods of uncertainty or major change when you need a wise counselor who can see the bigger picture. Unlike systems that focus primarily on emotions or desires, the I Ching emphasizes the importance of aligning with natural law and cosmic timing rather than forcing outcomes through willpower alone. It's perfect for entrepreneurs wondering about business timing, artists seeking guidance on creative projects, or anyone navigating complex family or workplace dynamics. The I Ching doesn't tell you what will happen—it reveals the energy patterns at play and suggests the most skillful way to work with them. Whether you're considering a career change, dealing with a difficult person, or trying to understand why certain areas of your life feel stuck, the I Ching offers ancient wisdom about the art of strategic action and graceful adaptation to life's inevitable changes.`,
      },
    ],
  },
  dream: {
    title: 'Dream Interpretation',
    sections: [
      {
        title: 'What Dream Interpretation Is',
        content: `Dream interpretation is the practice of analyzing the symbolic language of your subconscious mind to understand the deeper messages, emotions, and insights your psyche is trying to communicate while you sleep. Dreams operate in the realm of symbols, metaphors, and emotional associations rather than literal logic, creating a rich tapestry of meaning that reflects your inner world, unresolved conflicts, hidden desires, and intuitive wisdom. Modern dream analysis draws from both psychological frameworks—like Carl Jung's work on archetypes and the collective unconscious—and spiritual traditions that view dreams as a bridge between the conscious and divine realms. Each dream element, from people and places to colors and emotions, carries potential significance that can illuminate patterns in your waking life, reveal unconscious fears or hopes, and provide guidance for personal growth and decision-making.

The interpretation process involves examining not just the content of your dreams but also the emotions, atmosphere, and personal associations each symbol holds for you. While universal symbols exist (water often represents emotions, houses can symbolize the self, flying might indicate freedom or escape), the most meaningful interpretations consider your unique life context, current challenges, and personal symbol system. The AI in OUROS 2 analyzes your dream description through multiple lenses—psychological symbolism, spiritual meaning, archetypal patterns, and emotional undertones—then weaves these elements into a comprehensive interpretation that speaks to your specific situation. This approach recognizes that dreams often process recent experiences while simultaneously accessing deeper wisdom about your life path, relationships, and soul's journey.`,
      },
      {
        title: 'When Dream Interpretation Is Most Useful',
        content: `Dream interpretation becomes especially valuable during periods of major life transitions, emotional processing, or when you're facing decisions where your logical mind feels conflicted but your dreams seem to offer clarity. If you're experiencing recurring dreams, vivid nightmares, or unusually symbolic dreams, these often signal that your subconscious is working overtime to process important psychological or spiritual material that needs your conscious attention. Dreams frequently reveal hidden aspects of relationships—showing you how you really feel about someone beyond your conscious thoughts, or highlighting dynamics you haven't fully acknowledged. They're also powerful tools for creative problem-solving, as the subconscious often works through challenges during sleep and presents solutions in symbolic form that can spark breakthrough insights when properly understood.

The practice becomes particularly meaningful when you're dealing with grief, trauma, major life changes, or spiritual awakening, as dreams often serve as a natural healing mechanism that helps you process difficult emotions and integrate new understanding. If you're someone who tends to overthink decisions or gets stuck in mental loops, dream interpretation can provide access to your intuitive wisdom—that deeper knowing that exists beneath the chatter of rational analysis. Dreams also frequently offer guidance about timing, relationships, and life direction that your conscious mind might miss or dismiss. Whether you're struggling with a career decision, processing the end of a relationship, exploring your spiritual path, or simply wanting to understand yourself at a deeper level, paying attention to your dreams creates a dialogue with your unconscious that can profoundly enrich your self-awareness and guide your choices with greater wisdom and authenticity.`,
      },
    ],
  },
};

export const QUANTUM_RNG_INFO = {
  title: 'Quantum Random Number Generator',
  content: `All Tarot and I Ching readings in this app use true quantum randomness from the Australian National University's quantum physics laboratory.

What makes quantum randomness special?

Traditional computers generate "pseudo-random" numbers using mathematical algorithms. While they appear random, they're actually predictable if you know the algorithm. True randomness, however, exists at the quantum level of reality.

How it works:
• Quantum systems measure photon behavior at the subatomic level
• The measurement captures inherent uncertainty in quantum states
• This uncertainty is fundamental to the fabric of reality
• The results are genuinely unpredictable and non-deterministic

Why this matters for divination:

Many practitioners believe divination works through synchronicity - meaningful connections between inner consciousness and outer events. By using quantum randomness, your readings emerge from the most fundamental layer of reality itself, not from predictable computer calculations.

Whether you view these oracles as:
• Accessing collective wisdom
• Tapping unconscious knowledge
• Connecting with universal patterns
• Or simply providing contemplative reflection

...quantum randomness ensures each reading honors the profound mystery at the heart of both ancient divination and modern physics.

The quantum source provides authenticity and respects the depth of the oracle tradition.`,
};
