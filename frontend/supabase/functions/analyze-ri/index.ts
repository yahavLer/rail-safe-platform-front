import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      console.error('No image provided');
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing image with AI...');

    const systemPrompt = `אתה מומחה בטיחות רכבות. תפקידך לנתח תמונות ולזהות מפגעי בטיחות אפשריים על מסילות רכבת.

עליך לזהות ולדווח על:
1. חסימות על המסילה (ענפים, אבנים, פסולת, חפצים)
2. נזק למסילה (סדקים, עיוותים, שחיקה)
3. בעיות בתשתיות (עמודים, כבלים, גדרות)
4. סכנות סביבתיות (הצפות, שקיעת קרקע, צמחייה חודרנית)
5. בעיות אבטחה (ונדליזם, גרפיטי, פריצה לגדר)

החזר תשובה בפורמט JSON הבא בלבד, ללא טקסט נוסף:
{
  "detected": true/false,
  "hazardType": "סוג המפגע בעברית",
  "description": "תיאור מפורט של המפגע בעברית",
  "suggestedLikelihood": 1-4,
  "suggestedImpact": 1-4,
  "confidence": 0-100,
  "category": "אחת מהקטגוריות: תשתיות/מסילה, תשתיות/חשמל, תשתיות/איתות, סביבה/צמחייה, סביבה/מזג אוויר, אבטחה/פריצה",
  "recommendations": ["המלצה 1", "המלצה 2"]
}

אם לא זוהה מפגע:
{
  "detected": false,
  "description": "לא זוהה מפגע בטיחותי בתמונה",
  "confidence": 0
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'נתח את התמונה הזו וזהה מפגעי בטיחות אפשריים על מסילת הרכבת. החזר את התוצאה בפורמט JSON בלבד.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'מערכת הזיהוי עמוסה, נסה שוב בעוד מספר שניות' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'נדרשת הוספת קרדיטים למערכת' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'שגיאה בניתוח התמונה' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    console.log('AI Response:', aiResponse);

    // Parse the JSON response
    let analysisResult;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      analysisResult = {
        detected: false,
        description: 'לא ניתן היה לנתח את התמונה',
        confidence: 0
      };
    }

    console.log('Analysis result:', analysisResult);

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-risk-image function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'שגיאה לא צפויה' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
