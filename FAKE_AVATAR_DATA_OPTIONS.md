# Fake Avatar Generator - Complete Data Options

## Overview
This document outlines all available settings and data options for creating a detailed fake avatar using the AI Fake Avatar Generator.

---

## Avatar Settings Categories

### 1. **Ethnicity** (Multi-select, up to 2)
Select up to 2 ethnicities to create mixed heritage avatars:
- American
- Asian
- Australian
- European
- Filipino
- Spanish

**Output Format:**
- Single selection: `"Asian"`
- Mixed selection: `"Mixed - Asian & European"`

---

### 2. **Gender**
- Male
- Female

---

### 3. **Skin Color**
- Fair
- Light
- Medium
- Tan
- Dark
- Deep

---

### 4. **Hair Color**
- Black
- Brown
- Blonde
- Red
- Auburn
- Gray
- White
- Platinum
- Burgundy
- Blue
- Green
- Pink
- Purple

---

### 5. **Facial Expression**
- Neutral
- Happy
- Sad
- Angry
- Surprised
- Serious
- Smiling

---

### 6. **Background/Environment Theme** ⭐ NEW
Choose the setting/environment for your avatar:
- **Studio** - Professional studio backdrop
- **Urban Street** - City street environment
- **Nature/Outdoor** - Natural outdoor setting
- **Office** - Professional office environment
- **Cafe** - Coffee shop/cafe setting
- **Beach** - Beach/coastal environment
- **Mountain** - Mountain landscape
- **Desert** - Desert landscape
- **Forest** - Forest/woodland setting
- **City Skyline** - Urban skyline backdrop
- **Industrial** - Industrial/warehouse setting
- **Minimalist** - Clean, minimal background
- **Luxury** - Luxurious/upscale environment
- **Vintage** - Retro/vintage aesthetic
- **Futuristic** - Modern/sci-fi environment
- **Abstract** - Abstract artistic background
- **Gradient** - Smooth gradient backdrop
- **Bokeh** - Blurred bokeh effect background
- **Solid Color** - Simple solid color background

---

### 7. **Body Composition** (Text Input)
Free-form text to describe body type:
- Examples: "athletic", "slim", "curvy", "muscular", "petite", "tall and lean"

---

### 8. **Imperfection** (Text Input)
Add realistic imperfections or distinguishing features:
- Examples: "freckles", "small scar on left cheek", "beauty mark above lip", "mole on chin"

---

### 9. **Exact Facial Structure** (Toggle Feature)
Enable this to specify detailed facial features:

#### When Enabled:
- **Eyes** (Text Input)
  - Examples: "almond-shaped, blue eyes", "large brown eyes with long lashes"
  
- **Eyebrows** (Text Input)
  - Examples: "thick, arched eyebrows", "thin, straight eyebrows"
  
- **Nose** (Text Input)
  - Examples: "straight, small nose", "button nose", "aquiline nose"
  
- **Mouth** (Text Input)
  - Examples: "full lips, wide smile", "thin lips", "cupid's bow lips"
  
- **Ears** (Text Input)
  - Examples: "small, close-set ears", "large ears"

---

### 10. **Transform Head** (Toggle Feature)
Enable this to specify camera angle/shot type:

#### When Enabled - Angle Options:
- **Close-Up** - Tight shot of face
- **Medium Close-Up** - Head and shoulders
- **Wide Close-Up** - Upper body visible
- **Full-Body** - Complete body shot

---

## Complete Example Configuration

```json
{
  "ethnicity": "Mixed - Asian & European",
  "gender": "female",
  "skinColor": "light",
  "hairColor": "brown",
  "facialExpression": "smiling",
  "backgroundEnvironment": "studio",
  "bodyComposition": "athletic and toned",
  "imperfection": "small freckles across nose",
  "exactFacialStructure": true,
  "eyes": "almond-shaped, hazel eyes with gold flecks",
  "eyebrows": "naturally arched, medium thickness",
  "nose": "straight, proportionate nose",
  "mouth": "full lips with natural pink tone",
  "ears": "small, well-proportioned ears",
  "transformHead": true,
  "angle": "medium-close-up"
}
```

---

## Webhook Integration

All settings are sent to the webhook endpoint:
- **URL**: `https://n8n.srv931715.hstgr.cloud/webhook/fakeavatar`
- **Method**: POST
- **Format**: FormData

### FormData Fields:
- `ethnicity`
- `gender`
- `skinColor`
- `hairColor`
- `facialExpression`
- `backgroundEnvironment` ⭐ NEW
- `bodyComposition`
- `imperfection`
- `exactFacialStructure` (boolean as string)
- `eyes`
- `eyebrows`
- `nose`
- `mouth`
- `ears`
- `transformHead` (boolean as string)
- `angle`

---

## Usage Tips

1. **Minimal Configuration**: You can generate an avatar with just basic settings (gender, ethnicity)
2. **Detailed Configuration**: Use all options for maximum control over the avatar appearance
3. **Background Matters**: Choose a background that matches the avatar's purpose (professional, casual, artistic)
4. **Natural Combinations**: Combine settings naturally (e.g., "beach" background with "happy" expression)
5. **Imperfections Add Realism**: Small imperfections make avatars look more realistic and unique

---

## Generated Output

The system returns a professional AI prompt that can be used to generate the fake avatar image using AI image generation tools.
