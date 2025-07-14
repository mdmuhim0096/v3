import React from 'react';
import twemoji from 'twemoji';

export default function EmojiText({ text }) {
  const html = twemoji.parse(text, {
    folder: 'svg',
    ext: '.svg'
  });

  return (
    <span
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ fontSize: '1.2rem' }}
    />
  );
}
