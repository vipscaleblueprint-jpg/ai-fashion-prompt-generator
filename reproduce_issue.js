
const data = [
    {
        "content": {
            "parts": [
                {
                    "text": "```yaml\nphotograph:\n  subject:\n    age: 20-30 years old (estimated)\n```"
                }
            ],
            "role": "model"
        },
        "finishReason": "STOP",
        "index": 0
    },
    {
        "content": {
            "parts": [
                {
                    "text": "```yaml\nface_analysis:\n  face_shape:\n    outline: The face appears to have an oval to slightly heart-shaped outline.\n```"
                }
            ],
            "role": "model"
        },
        "finishReason": "STOP",
        "index": 0
    }
];

function normalizeToPrompts(data) {
    if (!data) return [];
    if (Array.isArray(data)) {
        return (data)
            .map((item) => {
                if (typeof item === 'string') return item;
                if (item?.input?.prompt && typeof item.input.prompt === 'string') return item.input.prompt;
                if (item?.content?.parts && Array.isArray(item.content.parts) && item.content.parts.length > 0) {
                    if (item.content.parts[0]?.text && typeof item.content.parts[0].text === 'string') {
                        return item.content.parts[0].text;
                    }
                }
                if (item?.prompt && typeof item.prompt === 'string') return item.prompt;
                if (item?.text && typeof item.text === 'string') return item.text;
                if (item?.output && typeof item.output === 'string') return item.output;
                return null;
            })
            .filter((p) => typeof p === "string");
    }
    return [];
}

const prompts = normalizeToPrompts(data);
console.log("Extracted Prompts:");
console.log(prompts);
