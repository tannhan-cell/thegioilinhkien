const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env, ctx) {
    // 1. Xử lý yêu cầu Preflight OPTIONS từ Trình duyệt
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // 2. API Lấy danh sách sản phẩm (GET)
    if (url.pathname === "/api/products" && request.method === "GET") {
      // Lấy từ KV / D1 / Memory
      const products = await env.MY_KV.get("products", { type: "json" }) || [];
      return new Response(JSON.stringify(products), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. API Thêm/Sửa sản phẩm (POST)
    if (url.pathname === "/api/admin/products" && request.method === "POST") {
      const newProduct = await request.json();
      let products = await env.MY_KV.get("products", { type: "json" }) || [];

      if (newProduct.id) {
        // Cập nhật
        products = products.map(p => String(p.id) === String(newProduct.id) ? newProduct : p);
      } else {
        // Thêm mới
        newProduct.id = Date.now().toString();
        products.push(newProduct);
      }

      // Lưu lại vào KV / Database
      await env.MY_KV.put("products", JSON.stringify(products));

      return new Response(JSON.stringify({ success: true, products }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
};
