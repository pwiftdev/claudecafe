/**
 * Clean text by removing unwanted formatting, brackets, and labels
 */
export function cleanText(text: string): string {
  if (!text) return text;
  
  // Remove leading/trailing whitespace
  let cleaned = text.trim();
  
  // Remove common bracket patterns at the start
  cleaned = cleaned.replace(/^\[(response|thought|philosophy|pantheism|observation|reflection)\]\s*/i, '');
  cleaned = cleaned.replace(/^\[.*?\]\s*/, ''); // Remove any [label] at start
  
  // Remove markdown-style labels
  cleaned = cleaned.replace(/^#+\s*(response|thought|philosophy|pantheism|observation|reflection):\s*/i, '');
  
  // Remove "Response:" or "Thought:" prefixes
  cleaned = cleaned.replace(/^(response|thought|philosophy|pantheism|observation|reflection):\s*/i, '');
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  return cleaned.trim();
}
