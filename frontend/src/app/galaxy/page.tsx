'use client';

import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  NodeTypes,
  BackgroundVariant,
} from 'reactflow';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Palette, Type, Image, Download } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import 'reactflow/dist/style.css';

interface GalaxyAssets {
  metaphors: Array<{
    prompt: string;
    image_url: string;
  }>;
  color_palettes: Array<{
    name: string;
    colors: string[];
    attribute_basis: string;
  }>;
  font_pairs: Array<{
    name: string;
    title_font: string;
    body_font: string;
    attribute_basis: string;
    style_description: string;
  }>;
  generation_metadata: {
    keywords_used: string[];
    attributes_used: string[];
    generated_at: string;
    total_assets: number;
  };
}

// Componente personalizado para nó de metáfora
const MetaphorNode = ({ data }: { data: any }) => {
  return (
    <Card className="w-80 shadow-lg border-blue-200 bg-blue-50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Image className="h-4 w-4 text-blue-600" aria-label="Imagem" />
          <CardTitle className="text-sm">Metáfora Visual</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {data.metaphor?.image_url ? (
          <div className="space-y-2">
            <img 
              src={data.metaphor.image_url} 
              alt={data.metaphor.prompt}
              className="w-full h-32 object-cover rounded-lg"
              loading="lazy"
            />
            <p className="text-xs text-gray-600">{data.metaphor.prompt}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-700">{data.metaphor?.prompt || data.metaphor}</p>
        )}
        <Button variant="outline" size="sm" className="mt-2 w-full">
          {data.metaphor?.image_url ? 'Usar Esta Imagem' : 'Gerar Imagem'}
        </Button>
      </CardContent>
    </Card>
  );
};

// Componente personalizado para nó de paleta de cores
const ColorPaletteNode = ({ data }: { data: any }) => {
  return (
    <Card className="w-80 shadow-lg border-purple-200 bg-purple-50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-purple-600" />
          <CardTitle className="text-sm">{data.palette.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 mb-2">
          {data.palette.colors.map((color: string, index: number) => (
            <div
              key={index}
              className="w-8 h-8 rounded border border-gray-300"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <p className="text-xs text-gray-600">Base: {data.palette.attribute_basis}</p>
        <Button variant="outline" size="sm" className="mt-2 w-full">
          Aplicar Paleta
        </Button>
      </CardContent>
    </Card>
  );
};

// Componente personalizado para nó de tipografia
const TypographyNode = ({ data }: { data: any }) => {
  return (
    <Card className="w-80 shadow-lg border-green-200 bg-green-50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-green-600" />
          <CardTitle className="text-sm">{data.fontPair.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-600">Título:</p>
            <p className="font-bold" style={{ fontFamily: data.fontPair.title_font }}>
              {data.fontPair.title_font}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Corpo:</p>
            <p style={{ fontFamily: data.fontPair.body_font }}>
              {data.fontPair.body_font}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2">{data.fontPair.style_description}</p>
        <Button variant="outline" size="sm" className="mt-2 w-full">
          Aplicar Fontes
        </Button>
      </CardContent>
    </Card>
  );
};

const nodeTypes: NodeTypes = {
  metaphor: MetaphorNode,
  colorPalette: ColorPaletteNode,
  typography: TypographyNode,
};

export default function GalaxyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [galaxyAssets, setGalaxyAssets] = useState<GalaxyAssets | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parâmetros da URL
  const keywords = searchParams?.get('keywords')?.split(',') || [];
  const attributes = searchParams?.get('attributes')?.split(',') || [];
  const projectId = searchParams?.get('projectId');
  const briefId = searchParams?.get('briefId');

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Criar nós no canvas a partir dos assets
  const createNodesFromAssets = useCallback((assets: GalaxyAssets) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    let yOffset = 0;
    
    // Adicionar nós de metáforas
    assets.metaphors.forEach((metaphor, index) => {
      newNodes.push({
        id: `metaphor-${index}`,
        type: 'metaphor',
        position: { x: 100, y: yOffset },
        data: { metaphor },
        draggable: true,
      });
      yOffset += 200;
    });

    // Adicionar nós de paletas de cores
    yOffset = 0;
    assets.color_palettes.forEach((palette, index) => {
      newNodes.push({
        id: `palette-${index}`,
        type: 'colorPalette',
        position: { x: 500, y: yOffset },
        data: { palette },
        draggable: true,
      });
      yOffset += 200;
    });

    // Adicionar nós de tipografia
    yOffset = 0;
    assets.font_pairs.forEach((fontPair, index) => {
      newNodes.push({
        id: `typography-${index}`,
        type: 'typography',
        position: { x: 900, y: yOffset },
        data: { fontPair },
        draggable: true,
      });
      yOffset += 200;
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  // Gerar galáxia de conceitos
  const generateGalaxy = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate-galaxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords,
          attributes,
          project_id: projectId,
          brief_id: briefId,
          demo_mode: true, // Usar modo demo para hackathon
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar galáxia de conceitos');
      }

      const data = await response.json();
      setGalaxyAssets(data.galaxy_data);
      createNodesFromAssets(data.galaxy_data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [keywords, attributes, projectId, briefId, createNodesFromAssets]);


  // Gerar automaticamente se parâmetros estão presentes
  useEffect(() => {
    if (keywords.length > 0 || attributes.length > 0) {
      generateGalaxy();
    }
  }, [keywords.length, attributes.length, generateGalaxy]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 sm:p-6">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.back()}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Voltar</span>
                <span className="sm:hidden">←</span>
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">Fase 2: Galáxia de Conceitos</h1>
                <p className="text-muted-foreground text-sm sm:text-base hidden sm:block">Explore e organize elementos visuais gerados pela IA</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {!galaxyAssets && (
                <Button 
                  onClick={generateGalaxy}
                  disabled={isLoading || (keywords.length === 0 && attributes.length === 0)}
                  className="button-mobile"
                >
                  {isLoading ? 'Gerando...' : 'Gerar Galáxia'}
                </Button>
              )}
              
              {galaxyAssets && (
                <>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button 
                    onClick={generateGalaxy}
                    disabled={isLoading}
                    size="sm"
                    variant="outline"
                  >
                    Regenerar
                  </Button>
                  <Button 
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set('keywords', keywords.join(','));
                      params.set('attributes', attributes.join(','));
                      if (projectId) params.set('projectId', projectId);
                      if (briefId) params.set('briefId', briefId);
                      router.push(`/curation?${params.toString()}`);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Ir para Curadoria →
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Tags de contexto */}
          {(keywords.length > 0 || attributes.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Baseado em:</span>
              {keywords.map((keyword, index) => (
                <span 
                  key={`keyword-${index}`}
                  className="bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-xs"
                >
                  {keyword}
                </span>
              ))}
              {attributes.map((attribute, index) => (
                <span 
                  key={`attr-${index}`}
                  className="bg-purple-100 text-purple-800 rounded-full px-2 py-1 text-xs"
                >
                  {attribute}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="h-[calc(100vh-140px)] sm:h-[calc(100vh-120px)]">
        {error && (
          <div className="p-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Gerando sua galáxia de conceitos...</p>
            </div>
          </div>
        )}

        {!isLoading && !error && nodes.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Image className="h-24 w-24 text-gray-300 mx-auto mb-4" aria-label="Sem imagens" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Pronto para explorar conceitos
              </h3>
              <p className="text-gray-600 mb-4">
                Clique em &quot;Gerar Galáxia&quot; para criar elementos visuais baseados no seu briefing
              </p>
            </div>
          </div>
        )}

        {nodes.length > 0 && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="reactflow-wrapper"
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        )}
      </div>

      {/* Stats Footer */}
      {galaxyAssets && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-6">
                <span>
                  <strong>{galaxyAssets.metaphors.length}</strong> metáforas visuais
                </span>
                <span>
                  <strong>{galaxyAssets.color_palettes.length}</strong> paletas de cores
                </span>
                <span>
                  <strong>{galaxyAssets.font_pairs.length}</strong> pares tipográficos
                </span>
              </div>
              <div>
                Gerado em {new Date(galaxyAssets.generation_metadata.generated_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}