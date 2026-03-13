import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Tavily Research
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      tavilyConfigured: !!process.env.VITE_TAVILY_API_KEY?.trim()
    });
  });

  app.post("/api/research", async (req, res) => {
    const { keywords, isDeepDive } = req.body;
    const apiKey = process.env.VITE_TAVILY_API_KEY?.trim().replace(/^["']|["']$/g, '');

    if (!apiKey) {
      return res.status(500).json({ error: "VITE_TAVILY_API_KEY not configured" });
    }

    console.log(`Using Tavily Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);

    const query = Array.isArray(keywords) ? keywords.join(" ").trim() : "";

    if (!query) {
      return res.status(400).json({ error: "Search query cannot be empty" });
    }

    try {
      const requestBody: any = {
        api_key: apiKey,
        query: query,
        search_depth: isDeepDive ? "advanced" : "basic",
        topic: "general",
        max_results: isDeepDive ? 10 : 5,
      };

      console.log("Attempting Tavily Search:", { query: requestBody.query, depth: requestBody.search_depth });

      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
          const parsed = JSON.parse(errorText);
          errorMessage = parsed.detail?.error || parsed.error || errorText;
        } catch (e) {
          // Not JSON, use raw text
        }
        console.error("Tavily API Error:", errorMessage);
        return res.status(response.status).json({ error: errorMessage });
      }

      const data = await response.json();
      
      if (!data.results) {
        console.error("Tavily returned no results field:", data);
        return res.json([]);
      }

      // Transform Tavily results to our ResearchItem format
      const results = data.results.map((r: any, i: number) => ({
        id: `tavily-${i}-${Date.now()}`,
        title: r.title,
        summary: r.content,
        source: new URL(r.url).hostname,
        url: r.url,
        tags: keywords,
      }));

      res.json(results);
    } catch (error: any) {
      console.error("Tavily search failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
