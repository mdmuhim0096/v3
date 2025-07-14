import React from 'react'

const ShortText = ({ text = [], width, dot, range = 4 }) => {
    const _text_ = text.length > 6 && width < 570 ? text.slice(0, range) + `${dot === 2 ? ".." : dot === 3 ? "..." : dot === 4 ? "...." : "."}` : text;
    return (
        <span>{_text_}</span>
    )
}

export default ShortText;