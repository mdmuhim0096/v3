// components/EmojiPicker.js
import React, { useState } from 'react';
import Picker from 'emoji-picker-react';

const Emoji = ({ onSelect }) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleEmojiClick = (emojiObject) => {
    onSelect(emojiObject.emoji);
  };

  return (
    <div >
      <button
        onClick={() => setShowPicker((prev) => !prev)}
        style={{ fontSize: '24px', cursor: 'pointer' }}
        aria-label="Toggle emoji picker"
      >
        😄
      </button>

      {showPicker && (
        <div id='Picker'>
          <Picker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
};

export default Emoji;
