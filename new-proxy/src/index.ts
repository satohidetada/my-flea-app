export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
      const data = await request.json();
      
      // 送られてきたデータをそのままGASに転送
      const gasResponse = await fetch("https://script.google.com/macros/s/AKfycbwp_DnqFMfYAnNaQe0EowV73hTeoNMNbAlyolTlm7gTa4edu9EThdnpYe2C3D_MNaep/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await gasResponse.json();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }
};
