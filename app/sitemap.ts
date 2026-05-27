import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://obrascity.com.br", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://obrascity.com.br/como-funciona", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://obrascity.com.br/sobre", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: "https://obrascity.com.br/contato", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: "https://obrascity.com.br/login", lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: "https://obrascity.com.br/cadastro", lastModified: new Date(), changeFrequency: "yearly", priority: 0.6 },
    { url: "https://obrascity.com.br/privacidade", lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: "https://obrascity.com.br/termos", lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: "https://obrascity.com.br/politica-de-cookies", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
