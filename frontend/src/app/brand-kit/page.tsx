'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, Palette, Type, Image, FileText, Share, Eye } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface BrandKit {
  brand_name: string;
  primary_logo?: string;
  logo_variations: string[];
  color_palette?: {
    name: string;
    colors: string[];
    attribute_basis: string;
  };
  typography?: {
    title_font: string;
    body_font: string;
    attribute_basis: string;
  };
  visual_elements: any[];
  brand_guidelines: {
    logo_usage: string[];
    color_usage: string[];
    typography_usage: string[];
    visual_style: string[];
  };
  applications: {
    business_card?: string;
    letterhead?: string;
    social_media: string[];
    website_mockup?: string;
  };
  generation_metadata?: {
    project_id: string;
    brief_id: string;
    total_assets_used: number;
    generated_at: string;
    preferences: any;
  };
}

export default function BrandKitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estados
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'guidelines' | 'applications'>('overview');
  
  // Parâmetros da URL
  const projectId = searchParams?.get('projectId');
  const briefId = searchParams?.get('briefId');
  const brandName = searchParams?.get('brandName') || 'Minha Marca';
  const curatedAssetsParam = searchParams?.get('curatedAssets');
  
  let curatedAssets = [];
  try {
    curatedAssets = curatedAssetsParam ? JSON.parse(curatedAssetsParam) : [];
  } catch (e) {
    console.error('Erro ao parsear assets curados:', e);
  }

  // Gerar kit de marca
  const generateBrandKit = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('https://mwp-production-6b45.up.railway.app/finalize-brand-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          brief_id: briefId,
          curated_assets: curatedAssets,
          brand_name: brandName,
          kit_preferences: {
            style: 'professional',
            format: 'complete',
            include_guidelines: true
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setBrandKit(result.brand_kit);
      } else {
        throw new Error('Falha ao gerar kit de marca');
      }
    } catch (error) {
      console.error('Erro ao gerar kit:', error);
      alert('Erro ao gerar kit de marca. Usando dados de exemplo.');
      
      // Kit de exemplo para demonstração
      setBrandKit({
        brand_name: brandName,
        color_palette: {
          name: 'Paleta Principal',
          colors: ['#2F855A', '#68D391', '#C6F6D5', '#F0FFF4'],
          attribute_basis: 'sustentável'
        },
        typography: {
          title_font: 'Montserrat',
          body_font: 'Open Sans',
          attribute_basis: 'moderno'
        },
        visual_elements: curatedAssets,
        logo_variations: [],
        brand_guidelines: {
          logo_usage: [
            'Use o logo principal em fundos claros',
            'Mantenha área de respiro mínima equivalente à altura da letra',
            'Não distorça ou altere as proporções do logo'
          ],
          color_usage: [
            'Use a cor primária #2F855A para elementos principais',
            'Cores secundárias para detalhes e backgrounds',
            'Mantenha contraste adequado para legibilidade'
          ],
          typography_usage: [
            'Use Montserrat para títulos e cabeçalhos',
            'Use Open Sans para textos corridos e corpo',
            'Mantenha hierarquia tipográfica consistente'
          ],
          visual_style: [
            'Mantenha consistência visual em todas as aplicações',
            'Use elementos visuais de forma equilibrada',
            'Respeite o espaçamento e respiração da marca'
          ]
        },
        applications: {
          social_media: [],
        }
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Executar geração automaticamente
  useEffect(() => {
    if (projectId && briefId && brandName) {
      generateBrandKit();
    }
  }, [projectId, briefId, brandName]);

  // Simular download do kit
  const downloadBrandKit = async () => {
    setIsDownloading(true);
    
    // Simular processamento com feedback visual
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Criar um elemento para demonstrar o download
    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,Kit de Marca - ' + brandName + '\n\nEste é um exemplo do kit completo que seria gerado.\n\nIncluído:\n- Paleta de cores\n- Tipografia\n- Diretrizes de uso\n- Elementos visuais\n- Mockups de aplicação';
    link.download = `${brandName.replace(/\s+/g, '_')}_Brand_Kit.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsDownloading(false);
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Gerando seu Kit de Marca</h2>
          <p className="text-gray-600">Compilando todos os elementos e criando diretrizes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Fase 4: Kit de Marca Completo</h1>
                <p className="text-gray-600">Seu kit de marca profissional está pronto</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Pré-visualizar
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
              <Button 
                onClick={downloadBrandKit}
                disabled={isDownloading}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 relative"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? 'Preparando Download...' : 'Baixar Kit Completo'}
                {!isDownloading && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Brand Header */}
        {brandKit && (
          <Card className="mb-6">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-900">
                {brandKit.brand_name}
              </CardTitle>
              <CardDescription className="text-lg">
                Kit de Marca Completo • Gerado em {new Date().toLocaleDateString()}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'overview', label: 'Visão Geral', icon: Eye },
            { id: 'guidelines', label: 'Diretrizes', icon: FileText },
            { id: 'applications', label: 'Aplicações', icon: Share }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center gap-2"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Content Areas */}
        {activeTab === 'overview' && brandKit && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Color Palette */}
            {brandKit.color_palette && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-purple-600" />
                    Paleta de Cores
                  </CardTitle>
                  <CardDescription>{brandKit.color_palette.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {brandKit.color_palette.colors.map((color, index) => (
                      <div key={index} className="text-center">
                        <div
                          className="w-full h-16 rounded-lg border shadow-sm mb-2"
                          style={{ backgroundColor: color }}
                        />
                        <div className="text-xs font-mono text-gray-600">{color}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-600">Base:</div>
                    <div className="font-medium">{brandKit.color_palette.attribute_basis}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Typography */}
            {brandKit.typography && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5 text-green-600" />
                    Tipografia
                  </CardTitle>
                  <CardDescription>Hierarquia tipográfica</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Títulos e Cabeçalhos</div>
                    <div 
                      className="text-xl font-bold"
                      style={{ fontFamily: brandKit.typography.title_font }}
                    >
                      {brandKit.typography.title_font}
                    </div>
                    <div className="text-xs text-gray-500">
                      The quick brown fox jumps
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Corpo e Parágrafos</div>
                    <div 
                      className="text-base"
                      style={{ fontFamily: brandKit.typography.body_font }}
                    >
                      {brandKit.typography.body_font}
                    </div>
                    <div className="text-xs text-gray-500">
                      The quick brown fox jumps over the lazy dog
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="text-xs text-gray-600">Estilo:</div>
                    <div className="text-sm font-medium">{brandKit.typography.attribute_basis}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Visual Elements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-blue-600" />
                  Elementos Visuais
                </CardTitle>
                <CardDescription>
                  {brandKit.visual_elements.length} elementos curados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {brandKit.visual_elements.length > 0 ? (
                  <div className="space-y-3">
                    {brandKit.visual_elements.slice(0, 3).map((element, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium mb-1">
                          Elemento {index + 1}
                        </div>
                        <div className="text-xs text-gray-600">
                          {element.description || element.metaphor || 'Elemento visual curado'}
                        </div>
                      </div>
                    ))}
                    {brandKit.visual_elements.length > 3 && (
                      <div className="text-center text-sm text-gray-500">
                        +{brandKit.visual_elements.length - 3} mais elementos
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <Image className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">Nenhum elemento visual</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Guidelines Tab */}
        {activeTab === 'guidelines' && brandKit && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Uso do Logo</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {brandKit.brand_guidelines.logo_usage.map((guideline, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{guideline}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Uso de Cores</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {brandKit.brand_guidelines.color_usage.map((guideline, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{guideline}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tipografia</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {brandKit.brand_guidelines.typography_usage.map((guideline, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{guideline}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estilo Visual</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {brandKit.brand_guidelines.visual_style.map((guideline, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{guideline}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Share className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Aplicações em Desenvolvimento</h3>
              <p className="text-gray-600 mb-4">
                Mockups de cartão de visita, papel timbrado e redes sociais serão gerados em breve.
              </p>
              <Button variant="outline">
                Solicitar Aplicações Personalizadas
              </Button>
            </div>
          </div>
        )}

        {/* Summary Card */}
        {brandKit?.generation_metadata && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Resumo da Geração</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Assets Utilizados</div>
                  <div className="font-semibold">
                    {brandKit.generation_metadata.total_assets_used}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Projeto ID</div>
                  <div className="font-mono text-xs">
                    {brandKit.generation_metadata.project_id.slice(0, 8)}...
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Gerado em</div>
                  <div className="font-semibold">
                    {new Date(brandKit.generation_metadata.generated_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Status</div>
                  <div className="font-semibold text-green-600">Completo</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}