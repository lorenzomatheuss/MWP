'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const [brief, setBrief] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/analyze-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: brief }),
      });

      if (!response.ok) {
        throw new Error('Falha ao analisar o briefing.');
      }

      const data = await response.json();
      setKeywords(data.keywords);
      setAttributes(data.attributes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-2">Brand Co-Pilot</h1>
      <p className="text-muted-foreground mb-8">Comece colando o briefing do seu cliente abaixo.</p>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Fase 1: Onboarding Semântico</CardTitle>
          <CardDescription>
            Traduza um briefing de texto em parâmetros criativos para a IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full gap-4">
            <Textarea
              placeholder="Ex: Somos uma nova marca de café sustentável para a Geração Z..."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={6}
            />
            <Button onClick={handleAnalyze} disabled={isLoading}>
              {isLoading ? 'Analisando...' : 'Analisar Briefing e Gerar Conceitos'}
            </Button>
            {error && <p className="text-red-500">{error}</p>}
          </div>

          {(keywords.length > 0 || attributes.length > 0) && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Análise da IA (Tags Editáveis)</h3>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw) => (
                  <span key={kw} className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm">
                    {kw}
                  </span>
                ))}
                {attributes.map((attr) => (
                  <span key={attr} className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm">
                    {attr}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}