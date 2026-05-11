import React, { memo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { TajweedWord } from '../../models/Quran';
import { TAJWEED_RULES } from '../../constants/tajweed';
import { Colors } from '../../constants/colors';

interface Props {
  word: TajweedWord;
  fontSize?: number;
  tajweedEnabled?: boolean;
}

/**
 * Renders a single Arabic word with Tajweed color spans.
 * Uses React Native's nested <Text> technique for inline coloring.
 */
function TajweedRenderer({ word, fontSize = 28, tajweedEnabled = true }: Props) {
  if (!tajweedEnabled || word.spans.length === 0) {
    return <Text style={[styles.word, { fontSize, color: '#000000' }]}>{word.text}</Text>;
  }

  // Build an array of character segments with their colors
  const segments: { chars: string; color: string }[] = [];

  // Sort spans by start, deduplicate overlaps by keeping first match
  const sortedSpans = [...word.spans].sort((a, b) => a.start - b.start);

  let cursor = 0;
  for (const span of sortedSpans) {
    const start = Math.max(cursor, 0);
    const end = Math.min(span.end, word.text.length);

    if (start >= end) continue;

    // Characters before this span (plain color)
    if (start > cursor) {
      segments.push({ chars: word.text.slice(cursor, start), color: Colors.textArabic });
    }

    // Span characters (rule color)
    const ruleColor = TAJWEED_RULES[span.rule]?.color ?? Colors.textArabic;
    segments.push({ chars: word.text.slice(start, end), color: ruleColor });
    cursor = end;
  }

  // Remaining characters after last span
  if (cursor < word.text.length) {
    segments.push({ chars: word.text.slice(cursor), color: Colors.textArabic });
  }

  return (
    <Text style={[styles.word, { fontSize }]}>
      {segments.map((seg, i) => (
        <Text key={i} style={{ color: seg.color }}>{seg.chars}</Text>
      ))}
    </Text>
  );
}

export default memo(TajweedRenderer);

const styles = StyleSheet.create({
  word: {
    fontFamily: 'IndoPak',
    lineHeight: 32,
    textAlign: 'right',
    writingDirection: 'rtl',
    letterSpacing: 0,
    includeFontPadding: false,
  },
});
