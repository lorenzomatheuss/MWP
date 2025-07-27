'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Palette, Type, Image, Wand2, Download, Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface CuratedAsset {
  id: string;
  type: 'image' | 'color_palette' | 'typography' | 'blended' | 'metaphor';
  data: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface BlendedImage {
  id: string;
  image_data: string;
  source_assets: string[];
  blend_mode: string;
}

export default function CurationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estados
  const [curatedAssets, setCuratedAssets] = useState<CuratedAsset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [isBlending, setIsBlending] = useState(false);
  const [isApplyingStyle, setIsApplyingStyle] = useState(false);
  const [livePrompt, setLivePrompt] = useState('');
  const [brandName, setBrandName] = useState('');
  const [blendedImages, setBlendedImages] = useState<BlendedImage[]>([]);
  
  // Parâmetros da URL
  const projectId = searchParams?.get('projectId');
  const briefId = searchParams?.get('briefId');
  const keywords = searchParams?.get('keywords')?.split(',') || [];
  const attributes = searchParams?.get('attributes')?.split(',') || [];

  // Assets pré-carregados para demonstração rápida (hackathon mode)
  const [galaxyAssets] = useState([
    {
      id: 'metaphor-1',
      type: 'metaphor' as const,
      data: { 
        metaphor: 'Café sustentável em circuitos tecnológicos',
        image_url: 'https://images.unsplash.com/photo-1554755229-ca4470e22238?q=80&w=1974&auto=format&fit=crop'
      }
    },
    {
      id: 'metaphor-2',
      type: 'metaphor' as const,
      data: { 
        metaphor: 'Natureza em geometria minimalista',
        image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1974&auto=format&fit=crop'
      }
    },
    {
      id: 'metaphor-3',
      type: 'metaphor' as const,
      data: { 
        metaphor: 'Conceito premium em mármore',
        image_url: 'https://images.unsplash.com/photo-1621358351138-294cb503f3a6?q=80&w=1974&auto=format&fit=crop'
      }
    },
    {
      id: 'palette-1', 
      type: 'color_palette' as const,
      data: { 
        name: 'Paleta Natural',
        colors: ['#2F855A', '#68D391', '#C6F6D5', '#F0FFF4'],
        attribute_basis: 'sustentável'
      }
    },
    {
      id: 'palette-2', 
      type: 'color_palette' as const,
      data: { 
        name: 'Paleta Premium',
        colors: ['#1A1A1A', '#D4AF37', '#F7FAFC', '#E2E8F0'],
        attribute_basis: 'premium'
      }
    },
    {
      id: 'typography-1',
      type: 'typography' as const,
      data: {
        name: 'Par Moderno',
        title_font: 'Montserrat',
        body_font: 'Open Sans',
        attribute_basis: 'moderno'
      }
    },
    {
      id: 'typography-2',
      type: 'typography' as const,
      data: {
        name: 'Par Premium',
        title_font: 'Playfair Display',
        body_font: 'Lato',
        attribute_basis: 'premium'
      }
    }
  ]);

  // Atualizar prompt dinâmico baseado nos assets selecionados
  useEffect(() => {
    const selectedItems = curatedAssets.filter(asset => selectedAssets.includes(asset.id));
    
    if (selectedItems.length === 0) {
      setLivePrompt('Selecione elementos para gerar um prompt dinâmico...');
      return;
    }

    let prompt = `Criar identidade visual para "${brandName || 'marca'}" combinando: `;
    
    selectedItems.forEach((asset, index) => {
      if (asset.type === 'color_palette') {
        prompt += `paleta de cores ${asset.data.name}`;
      } else if (asset.type === 'typography') {
        prompt += `tipografia ${asset.data.title_font}`;
      } else if (asset.type === 'image' || asset.type === 'blended') {
        prompt += `elementos visuais híbridos`;
      }
      
      if (index < selectedItems.length - 1) prompt += ', ';
    });
    
    prompt += `. Estilo: ${attributes.join(', ')}. Conceitos: ${keywords.join(', ')}.`;
    setLivePrompt(prompt);
  }, [curatedAssets, selectedAssets, brandName, keywords, attributes]);

  // Adicionar asset à tela de curadoria
  const addAssetToCanvas = (asset: any) => {
    const newAsset: CuratedAsset = {
      id: `curated-${asset.id}-${Date.now()}`,
      type: asset.type,
      data: asset.data,
      position: { 
        x: Math.random() * 400 + 50, 
        y: Math.random() * 300 + 50 
      },
      size: { width: 200, height: 150 }
    };
    
    setCuratedAssets(prev => [...prev, newAsset]);
  };

  // Selecionar/deselecionar asset
  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  // Blend de imagens selecionadas
  const blendSelectedAssets = async () => {
    const imageAssets = curatedAssets.filter(asset => 
      selectedAssets.includes(asset.id) && 
      (asset.type === 'image' || asset.type === 'blended')
    );
    
    if (imageAssets.length < 2) {
      alert('Selecione pelo menos 2 imagens para fazer blend');
      return;
    }

    setIsBlending(true);
    try {
      // URLs de imagem (suporte para image_url e image_data)
      const imageUrls = imageAssets.map(asset => 
        asset.data.image_data || asset.data.image_url || `https://picsum.photos/512/512?random=${asset.id}`
      );

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blend-concepts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_urls: imageUrls,
          blend_mode: 'overlay',
          project_id: projectId,
          brief_id: briefId
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        const blendedImage: BlendedImage = {
          id: `blended-${Date.now()}`,
          image_data: result.blended_image,
          source_assets: imageAssets.map(a => a.id),
          blend_mode: 'overlay'
        };
        
        setBlendedImages(prev => [...prev, blendedImage]);
        
        // Adicionar resultado ao canvas
        addAssetToCanvas({
          id: blendedImage.id,
          type: 'blended',
          data: {
            image_data: blendedImage.image_data,
            description: `Blend de ${imageAssets.length} imagens`
          }
        });
      }
    } catch (error) {
      console.error('Erro ao fazer blend:', error);
      alert('Erro ao fazer blend das imagens');
    } finally {
      setIsBlending(false);
    }
  };

  // Aplicar estilo de cores a uma imagem
  const applyColorStyle = async () => {
    const imageAssets = curatedAssets.filter(asset => 
      selectedAssets.includes(asset.id) && 
      (asset.type === 'image' || asset.type === 'blended')
    );
    
    const colorAssets = curatedAssets.filter(asset => 
      selectedAssets.includes(asset.id) && asset.type === 'color_palette'
    );
    
    if (imageAssets.length === 0 || colorAssets.length === 0) {
      alert('Selecione uma imagem e uma paleta de cores');
      return;
    }

    setIsApplyingStyle(true);
    try {
      const imageAsset = imageAssets[0];
      const colorAsset = colorAssets[0];
      
      const imageUrl = imageAsset.data.image_data || imageAsset.data.image_url || `https://picsum.photos/512/512?random=${imageAsset.id}`;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/apply-style`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          style_data: { colors: colorAsset.data.colors },
          style_type: 'color_palette',
          project_id: projectId,
          brief_id: briefId
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Adicionar resultado estilizado ao canvas
        addAssetToCanvas({
          id: `styled-${Date.now()}`,
          type: 'image',
          data: {
            image_data: result.styled_image,
            description: `Imagem com paleta ${colorAsset.data.name}`
          }
        });
      }
    } catch (error) {
      console.error('Erro ao aplicar estilo:', error);
      alert('Erro ao aplicar estilo');
    } finally {
      setIsApplyingStyle(false);
    }
  };

  // Finalizar e ir para Fase 4
  const proceedToFinalKit = () => {
    const params = new URLSearchParams();
    params.set('projectId', projectId || '');
    params.set('briefId', briefId || '');
    params.set('brandName', brandName);
    params.set('curatedAssets', JSON.stringify(curatedAssets.map(a => a.data)));
    
    router.push(`/brand-kit?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 sm:p-6">
        <div className="container mx-auto">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="outline" size="sm" onClick={() => router.back()} className="flex-shrink-0">
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Voltar</span>
                <span className="sm:hidden">←</span>
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">Fase 3: Tela de Curadoria</h1>
                <p className="text-muted-foreground text-sm hidden sm:block">Combine e refine elementos para criar sua identidade visual</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Nome da marca..."
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full sm:w-48 input-mobile"
              />
              <Button 
                onClick={proceedToFinalKit}
                disabled={curatedAssets.length === 0 || !brandName}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 button-mobile"
              >
                Finalizar Kit →
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[calc(100vh-200px)] lg:h-[calc(100vh-140px)]">
          {/* Sidebar - Elementos da Galáxia */}
          <div className="lg:col-span-3 space-y-4 overflow-y-auto scrollbar-thin max-h-96 lg:max-h-none">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Elementos Disponíveis
              </CardTitle>
              <CardDescription>
                Arraste elementos da galáxia para a tela de curadoria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {galaxyAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => addAssetToCanvas(asset)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {asset.type === 'color_palette' && <Palette className="h-4 w-4 text-purple-600" />}
                    {asset.type === 'typography' && <Type className="h-4 w-4 text-green-600" />}
                    {asset.type === 'metaphor' && <Image className="h-4 w-4 text-blue-600" />}
                    <span className="text-sm font-medium">
                      {asset.type === 'color_palette' && asset.data.name}
                      {asset.type === 'typography' && asset.data.name}
                      {asset.type === 'metaphor' && 'Metáfora Visual'}
                    </span>
                  </div>
                  
                  {asset.type === 'color_palette' && (
                    <div className="flex gap-1">
                      {asset.data.colors.map((color: string, index: number) => (
                        <div
                          key={index}
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                  
                  {asset.type === 'typography' && (
                    <div className="text-xs text-gray-600">
                      {asset.data.title_font} + {asset.data.body_font}
                    </div>
                  )}
                  
                  {asset.type === 'metaphor' && (
                    <div>
                      {asset.data.image_url ? (
                        <img 
                          src={asset.data.image_url} 
                          alt={asset.data.metaphor}
                          className="w-full h-16 object-cover rounded mb-1"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-16 bg-gray-200 rounded flex items-center justify-center mb-1">
                          <Image className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="text-xs text-gray-600 line-clamp-2">
                        {asset.data.metaphor}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Controles de Interação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={blendSelectedAssets}
                disabled={selectedAssets.length < 2 || isBlending}
                className="w-full"
                size="sm"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {isBlending ? 'Blendando...' : 'Blend Imagens'}
              </Button>
              
              <Button 
                onClick={applyColorStyle}
                disabled={selectedAssets.length === 0 || isApplyingStyle}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <Palette className="h-4 w-4 mr-2" />
                {isApplyingStyle ? 'Aplicando...' : 'Aplicar Cores'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Canvas de Curadoria */}
        <div className="lg:col-span-6 order-first lg:order-none">
          <Card className="h-full min-h-[400px] lg:min-h-[600px]">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Canvas de Curadoria</CardTitle>
              <CardDescription className="text-sm">
                Organize e combine elementos. Clique para selecionar múltiplos itens.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)]">
              <div className="relative w-full h-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg overflow-hidden">
                {curatedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className={`absolute cursor-pointer transition-all duration-200 ${
                      selectedAssets.includes(asset.id) 
                        ? 'ring-2 ring-blue-500 shadow-lg scale-105' 
                        : 'hover:shadow-md'
                    }`}
                    style={{
                      left: asset.position.x,
                      top: asset.position.y,
                      width: asset.size.width,
                      height: asset.size.height
                    }}
                    onClick={() => toggleAssetSelection(asset.id)}
                  >
                    <Card className="h-full">
                      <CardContent className="p-3 h-full flex flex-col justify-center">
                        {asset.type === 'color_palette' && (
                          <div>
                            <div className="text-xs font-medium mb-2">{asset.data.name}</div>
                            <div className="flex gap-1">
                              {asset.data.colors?.map((color: string, index: number) => (
                                <div
                                  key={index}
                                  className="w-6 h-6 rounded border"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {asset.type === 'typography' && (
                          <div>
                            <div className="text-xs font-medium mb-1">{asset.data.name}</div>
                            <div className="text-xs text-gray-600">
                              {asset.data.title_font}
                            </div>
                          </div>
                        )}
                        
                        {(asset.type === 'image' || asset.type === 'blended') && (
                          <div>
                            {asset.data.image_data || asset.data.image_url ? (
                              <img 
                                src={asset.data.image_data || asset.data.image_url} 
                                alt="Asset" 
                                className="w-full h-20 object-cover rounded"
                              />
                            ) : (
                              <div className="w-full h-20 bg-gray-200 rounded flex items-center justify-center">
                                <Image className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                            <div className="text-xs text-gray-600 mt-1">
                              {asset.data.description || asset.data.metaphor || 'Elemento visual'}
                            </div>
                          </div>
                        )}
                        
                        {asset.type === 'metaphor' && (
                          <div>
                            {asset.data.image_url ? (
                              <img 
                                src={asset.data.image_url} 
                                alt={asset.data.metaphor}
                                className="w-full h-20 object-cover rounded"
                              />
                            ) : (
                              <div className="w-full h-20 bg-gray-200 rounded flex items-center justify-center">
                                <Image className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                            <div className="text-xs text-gray-600 mt-1">
                              {asset.data.metaphor}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
                
                {curatedAssets.length === 0 && (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <Image className="h-16 w-16 mx-auto mb-4" />
                      <p>Arraste elementos da galáxia para começar a curadoria</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel de Prompt Dinâmico */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prompt Dinâmico</CardTitle>
              <CardDescription>
                Refinamento em tempo real baseado na sua seleção
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={livePrompt}
                onChange={(e) => setLivePrompt(e.target.value)}
                placeholder="O prompt será gerado automaticamente..."
                rows={6}
                className="resize-none"
              />
              <Button className="w-full mt-3" size="sm">
                <Wand2 className="h-4 w-4 mr-2" />
                Refinar com IA
              </Button>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Elementos no canvas:</span>
                <span className="font-medium">{curatedAssets.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Selecionados:</span>
                <span className="font-medium">{selectedAssets.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Blends criados:</span>
                <span className="font-medium">{blendedImages.length}</span>
              </div>
              {brandName && (
                <div className="pt-2 border-t">
                  <span className="text-xs text-gray-600">Marca: </span>
                  <span className="font-medium">{brandName}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}