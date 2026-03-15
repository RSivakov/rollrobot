import {
  parseAndRollSimple,
  parseClassicRoll,
  parseSimpleRoll,
  parseWodRoll,
  roll,
} from 'roll-parser';
import type { InlineQueryResult } from 'grammy/types';
import { limit } from '../limiter';
import { createFullResultMessage } from '../text';

function createInputMessageContent(text: string) {
  return {
    message_text: text,
    parse_mode: 'Markdown' as const,
    link_preview_options: { is_disabled: true },
  };
}

function createArticle(
  title: string,
  description: string,
  message: string,
  iconText: string,
): InlineQueryResult {
  return {
    type: 'article',
    id: crypto.randomUUID(),
    title,
    input_message_content: createInputMessageContent(message),
    description,
    thumbnail_url: `https://dummyimage.com/128x128/eee/999.png&text=${iconText}`,
  };
}

function createRollArticle(notation: string): InlineQueryResult | null {
  const title = 'Classic';
  const result = roll(limit(parseClassicRoll(notation || 'd20') || parseSimpleRoll(notation)));
  const message = result && createFullResultMessage(result);
  return result && message ? createArticle(title, result.notation, message, 'C') : null;
}

function createWodArticle(notation: string): InlineQueryResult | null {
  const title = 'World of Darkness';
  const result = roll(limit(parseWodRoll(notation || 'd10>6')));
  const message = result && createFullResultMessage(result);
  return result && message ? createArticle(title, result.notation, message, 'W') : null;
}

function createRandomArticle(): InlineQueryResult | null {
  const title = 'Random';
  const result = parseAndRollSimple('100');
  const message = result && createFullResultMessage(result);
  return result && message ? createArticle(title, result.notation, message, 'R') : null;
}

export function createInlineArticles(query = ''): InlineQueryResult[] {
  const notation = query.trim();
  const articles = [createRollArticle(notation), createWodArticle(notation), createRandomArticle()];
  return articles.filter((article): article is InlineQueryResult => article != null);
}
