'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, Palette, Type, Image, FileText, Share, Eye } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface BrandKit {
  brand_name: string;
  guidelines_pdf: string;
  assets_package: {
    logos: Array<{
      format: string;
      url: string;
    }>;
    colors: Array<{
      name: string;
      hex: string;
      rgb: string;
    }>;
    fonts: Array<{
      name: string;
      weights: string[];
    }>;
    mockups: Array<{
      type: string;
      url: string;
    }>;
  };
  presentation_deck: string;
  guidelines_pages: {
    cover: string;
    logo_usage: string;
    color_palette: string;
    typography: string;
    applications: string;
  };
  generation_metadata?: {
    generated_at: string;
    concept_used: string;
    strategic_foundation: {
      purpose: string;
      values: string[];
      personality: string[];
    };
    deliverables: {
      guidelines_pages: number;
      logo_variations: number;
      color_palette_size: number;
      font_pairs: number;
      mockup_applications: number;
    };
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate-brand-kit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief_id: briefId,
          project_id: projectId,
          brand_name: brandName,
          selected_concept: {
            id: 'concept_1',
            logo_variations: [],
            color_palette: ['#2F855A', '#68D391', '#C6F6D5', '#F0FFF4', '#1A202C'],
            typography: {
              primary: 'Montserrat',
              secondary: 'Open Sans'
            }
          },
          strategic_analysis: {
            purpose: 'Desenvolver uma marca sustentável',
            values: ['Sustentabilidade', 'Qualidade'],
            personality_traits: ['Confiável', 'Inovador']
          },
          kit_preferences: {
            style: 'professional',
            format: 'complete',
            include_guidelines: true
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setBrandKit(result);
      } else {
        throw new Error('Falha ao gerar kit de marca');
      }
    } catch (error) {
      console.error('Erro ao gerar kit:', error);
      alert('Erro ao gerar kit de marca. Usando dados de exemplo.');
      
      // Kit de exemplo para demonstração
      setBrandKit({
        brand_name: brandName,
        guidelines_pdf: 'data:text/plain;charset=utf-8;base64,' + btoa(`Brand Guidelines for ${brandName}\n\n--- Color Palette ---\n- Primary: #2F855A\n- Secondary: #68D391\n\n--- Typography ---\n- Title Font: Montserrat\n- Body Font: Open Sans`),
        assets_package: {
          logos: [
            { format: 'PNG', url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' },
            { format: 'PNG', url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }
          ],
          colors: [
            { name: 'Primary', hex: '#2F855A', rgb: 'RGB(47, 133, 90)' },
            { name: 'Secondary', hex: '#68D391', rgb: 'RGB(104, 211, 145)' }
          ],
          fonts: [
            { name: 'Montserrat', weights: ['Regular', 'Medium', 'Bold'] },
            { name: 'Open Sans', weights: ['Regular', 'Italic', 'Bold'] }
          ],
          mockups: [
            { type: 'Business Card', url: 'https://via.placeholder.com/300x200/?text=Business+Card' }
          ]
        },
        presentation_deck: '#',
        guidelines_pages: {
          cover: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          logo_usage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          color_palette: 'https://via.placeholder.com/150x200/?text=Colors',
          typography: 'https://via.placeholder.com/150x200/?text=Fonts',
          applications: 'https://via.placeholder.com/150x200/?text=Apps'
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

  const downloadBrandKit = async () => {
    if (!brandKit) return;
    setIsDownloading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Pequeno atraso para feedback visual

    // Função auxiliar de download
    const downloadAsset = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Descarregar as diretrizes
    if (brandKit.guidelines_pdf) {
        downloadAsset(brandKit.guidelines_pdf, `${brandKit.brand_name}_Guidelines.txt`);
    }

    // Descarregar os logótipos
    brandKit.assets_package.logos.forEach((logo, index) => {
        if (logo.url.startsWith('data:image')) { // Descarregar apenas se for um logótipo gerado
            downloadAsset(logo.url, `${brandKit.brand_name}_Logo_${index + 1}.${logo.format.toLowerCase()}`);
        }
    });

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
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">Fase 4: Kit de Marca Completo</h1>
                <p className="text-muted-foreground text-sm hidden sm:block">Seu kit de marca profissional está pronto</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Eye className="h-4 w-4 mr-2" />
                Pré-visualizar
              </Button>
              <Button variant="outline" size="sm" className="hidden sm:flex">
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

      <div className="container mx-auto p-4 sm:p-6">
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
            {brandKit.assets_package.colors && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-purple-600" />
                    Paleta de Cores
                  </CardTitle>
                  <CardDescription>Cores da marca</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {brandKit.assets_package.colors.map((color, index) => (
                      <div key={index} className="text-center">
                        <div
                          className="w-full h-16 rounded-lg border shadow-sm mb-2"
                          style={{ backgroundColor: color.hex }}
                        />
                        <div className="text-xs font-mono text-gray-600">{color.hex}</div>
                        <div className="text-xs text-gray-500">{color.name}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Typography */}
            {brandKit.assets_package.fonts && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5 text-green-600" />
                    Tipografia
                  </CardTitle>
                  <CardDescription>Hierarquia tipográfica</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {brandKit.assets_package.fonts.map((font, index) => (
                    <div key={index}>
                      <div className="text-sm text-gray-600 mb-1">
                        {index === 0 ? 'Títulos e Cabeçalhos' : 'Corpo e Parágrafos'}
                      </div>
                      <div 
                        className="text-xl font-bold"
                        style={{ fontFamily: font.name }}
                      >
                        {font.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Pesos: {font.weights.join(', ')}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Logos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-blue-600" />
                  Logótipos
                </CardTitle>
                <CardDescription>
                  {brandKit.assets_package.logos.length} variações geradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {brandKit.assets_package.logos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {brandKit.assets_package.logos.slice(0, 4).map((logo, index) => (
                      <div key={index} className="text-center">
                        {logo.url.startsWith('data:image') ? (
                          <img
                            src={logo.url}
                            alt={`Logo ${index + 1}`}
                            className="w-full h-16 object-contain border rounded-lg bg-white"
                          />
                        ) : (
                          <div className="w-full h-16 border rounded-lg bg-gray-100 flex items-center justify-center">
                            <span className="text-xs text-gray-500">Logo {index + 1}</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">{logo.format}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <Image className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">Nenhum logótipo gerado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Guidelines Tab */}
        {activeTab === 'guidelines' && brandKit && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Guidelines Preview Images */}
            {Object.entries(brandKit.guidelines_pages).map(([key, url]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="capitalize">
                    {key.replace('_', ' ')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {url.startsWith('data:image') ? (
                    <img
                      src={url}
                      alt={`${key} guideline`}
                      className="w-full h-32 object-contain border rounded-lg bg-white"
                    />
                  ) : (
                    <div className="w-full h-32 border rounded-lg bg-gray-100 flex items-center justify-center">
                      <span className="text-sm text-gray-500">Guideline Preview</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
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
                    {brandKit.generation_metadata.deliverables.logo_variations +
                     brandKit.generation_metadata.deliverables.color_palette_size +
                     brandKit.generation_metadata.deliverables.font_pairs +
                     brandKit.generation_metadata.deliverables.mockup_applications}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Projeto ID</div>
                  <div className="font-mono text-xs">
                    {projectId?.slice(0, 8)}...
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