'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowRight, Sliders, Target, Heart, Zap, Palette, Wand2, Download, Eye, Package, FileDown, Image, Monitor } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  created_at: string;
}

interface DocumentSection {
  title: string;
  content: string;
  confidence: number;
  type: 'company_info' | 'values' | 'target_audience' | 'objectives' | 'brand_personality' | 'other';
}

interface UploadResult {
  filename: string;
  sections: DocumentSection[];
  overall_confidence: number;
  total_words: number;
}

interface AnalysisResult {
  brief_id: string | null;
  keywords: string[];
  attributes: string[];
  sentiment: string;
  project_id: string | null;
  confidence_score?: number;
}

interface StrategicAnalysis {
  purpose: string;
  values: string[];
  personality_traits: string[];
  creative_tensions: {
    traditional_contemporary: number;
    corporate_creative: number;
    minimal_detailed: number;
    serious_playful: number;
  };
  validated: boolean;
}

interface VisualConcept {
  id: string;
  logo_variations: string[];
  color_palette: string[];
  typography: {
    primary: string;
    secondary: string;
  };
  graphic_elements: string[];
  rationale: string;
  style_prompt: string;
}

interface GeneratedVisuals {
  concepts: VisualConcept[];
  generation_metadata: {
    model: string;
    timestamp: string;
    parameters: any;
  };
}

interface BrandKit {
  brand_name: string;
  guidelines_pdf: string;
  assets_package: {
    logos: { format: string; url: string; }[];
    colors: { name: string; hex: string; rgb: string; }[];
    fonts: { name: string; weights: string[]; }[];
    mockups: { type: string; url: string; }[];
  };
  presentation_deck: string;
  guidelines_pages: {
    cover: string;
    logo_usage: string;
    color_palette: string;
    typography: string;
    applications: string;
  };
}

export default function HomePage() {
  const router = useRouter();
  
  // Estados para workflow de etapas
  const [currentStep, setCurrentStep] = useState(1);
  
  // Estados para upload e parsing
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Estados existentes adaptados
  const [brief, setBrief] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para projetos
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [currentBriefId, setCurrentBriefId] = useState<string | null>(null);
  
  // Estados para análise estratégica (Tela 2)
  const [strategicAnalysis, setStrategicAnalysis] = useState<StrategicAnalysis>({
    purpose: '',
    values: [],
    personality_traits: [],
    creative_tensions: {
      traditional_contemporary: 50,
      corporate_creative: 50,
      minimal_detailed: 50,
      serious_playful: 50
    },
    validated: false
  });
  const [isAnalyzingStrategy, setIsAnalyzingStrategy] = useState(false);
  
  // Estados para geração visual (Tela 3)
  const [generatedVisuals, setGeneratedVisuals] = useState<GeneratedVisuals | null>(null);
  const [isGeneratingVisuals, setIsGeneratingVisuals] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  
  // Estados para export profissional (Tela 4)
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [isGeneratingKit, setIsGeneratingKit] = useState(false);
  const [brandName, setBrandName] = useState('');
  
  // Estado para user_id (simulado)
  const [userId] = useState('demo-user-123');

  // Carregar projetos ao inicializar
  useEffect(() => {
    loadProjects();
  }, []);

  // Triggerar análise estratégica quando mudar para step 2
  useEffect(() => {
    if (currentStep === 2 && currentBriefId && !strategicAnalysis.purpose) {
      performStrategicAnalysis();
    }
  }, [currentStep, currentBriefId]);

  // Triggerar geração visual quando mudar para step 3
  useEffect(() => {
    if (currentStep === 3 && strategicAnalysis.validated && !generatedVisuals) {
      generateVisualConcepts();
    }
  }, [currentStep, strategicAnalysis.validated]);

  // Triggerar geração do kit quando mudar para step 4
  useEffect(() => {
    if (currentStep === 4 && selectedConcept && !brandKit) {
      // Auto-gerar nome da marca se não fornecido
      if (!brandName) {
        const projectName = projects.find(p => p.id === selectedProject)?.name || 'Nova Marca';
        setBrandName(projectName);
      }
    }
  }, [currentStep, selectedConcept]);

  const loadProjects = async () => {
    try {
      const response = await fetch(`https://mwp-production-6b45.up.railway.app/projects/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (err) {
      console.error('Erro ao carregar projetos:', err);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    
    setIsCreatingProject(true);
    try {
      const response = await fetch('https://mwp-production-6b45.up.railway.app/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: newProjectName,
          user_id: userId 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedProject(data.project_id);
        setNewProjectName('');
        await loadProjects();
      }
    } catch (err) {
      setError('Erro ao criar projeto');
    } finally {
      setIsCreatingProject(false);
    }
  };

  // Funções para upload e parsing de documentos
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const parseDocument = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (selectedProject) formData.append('project_id', selectedProject);
      
      const response = await fetch('https://mwp-production-6b45.up.railway.app/parse-document', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Falha ao processar documento');
      }
      
      const result = await response.json();
      setUploadResult(result);
      
      // Auto-popula o campo de brief se confidence > 70%
      if (result.overall_confidence > 0.7) {
        const briefText = result.sections
          .map((section: DocumentSection) => `${section.title}: ${section.content}`)
          .join('\n\n');
        setBrief(briefText);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar documento');
    } finally {
      setIsUploading(false);
    }
  };

  const validateAndProceed = () => {
    if (!uploadResult || uploadResult.overall_confidence < 0.7) {
      setError('Confidence score muito baixo. Ajuste o documento ou insira informações manualmente.');
      return;
    }
    setCurrentStep(2);
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://mwp-production-6b45.up.railway.app/analyze-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: brief,
          project_id: selectedProject 
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao analisar o briefing.');
      }

      const data: AnalysisResult = await response.json();
      setKeywords(data.keywords);
      setAttributes(data.attributes);
      setCurrentBriefId(data.brief_id);
      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para análise estratégica automática
  const performStrategicAnalysis = async () => {
    if (!brief || !currentBriefId) return;
    
    setIsAnalyzingStrategy(true);
    setError(null);
    
    try {
      const response = await fetch('https://mwp-production-6b45.up.railway.app/strategic-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brief_id: currentBriefId,
          text: brief,
          keywords,
          attributes,
          project_id: selectedProject
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na análise estratégica');
      }

      const analysis = await response.json();
      
      setStrategicAnalysis({
        purpose: analysis.purpose,
        values: analysis.values,
        personality_traits: analysis.personality_traits,
        creative_tensions: analysis.creative_tensions,
        validated: false
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na análise estratégica');
    } finally {
      setIsAnalyzingStrategy(false);
    }
  };

  // Função para validar análise estratégica
  const validateStrategicAnalysis = () => {
    if (!strategicAnalysis.purpose || strategicAnalysis.values.length === 0) {
      setError('Complete todos os campos antes de validar');
      return;
    }
    
    setStrategicAnalysis(prev => ({ ...prev, validated: true }));
    setCurrentStep(3);
  };

  // Função para geração de conceitos visuais
  const generateVisualConcepts = async () => {
    if (!currentBriefId || !strategicAnalysis.validated) return;
    
    setIsGeneratingVisuals(true);
    setError(null);
    
    try {
      const response = await fetch('https://mwp-production-6b45.up.railway.app/generate-visual-concepts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brief_id: currentBriefId,
          project_id: selectedProject,
          strategic_analysis: strategicAnalysis,
          keywords,
          attributes,
          style_preferences: {
            traditional_contemporary: strategicAnalysis.creative_tensions.traditional_contemporary,
            corporate_creative: strategicAnalysis.creative_tensions.corporate_creative,
            minimal_detailed: strategicAnalysis.creative_tensions.minimal_detailed,
            serious_playful: strategicAnalysis.creative_tensions.serious_playful
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na geração dos conceitos visuais');
      }

      const visuals = await response.json();
      setGeneratedVisuals(visuals);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na geração de conceitos visuais');
    } finally {
      setIsGeneratingVisuals(false);
    }
  };

  // Função para finalizar conceito selecionado
  const finalizeSelectedConcept = () => {
    if (!selectedConcept) {
      setError('Selecione um conceito antes de prosseguir');
      return;
    }
    setCurrentStep(4);
  };

  // Função para gerar kit de marca profissional
  const generateBrandKit = async () => {
    if (!selectedConcept || !brandName.trim()) {
      setError('Nome da marca é obrigatório');
      return;
    }
    
    setIsGeneratingKit(true);
    setError(null);
    
    try {
      const selectedConceptData = generatedVisuals?.concepts.find(c => c.id === selectedConcept);
      
      const response = await fetch('https://mwp-production-6b45.up.railway.app/generate-brand-kit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brief_id: currentBriefId,
          project_id: selectedProject,
          brand_name: brandName,
          selected_concept: selectedConceptData,
          strategic_analysis: strategicAnalysis,
          kit_preferences: {
            include_guidelines: true,
            include_presentation: true,
            include_mockups: true,
            format_preferences: ['PDF', 'PNG', 'SVG']
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na geração do kit de marca');
      }

      const kit = await response.json();
      setBrandKit(kit);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na geração do kit de marca');
    } finally {
      setIsGeneratingKit(false);
    }
  };

  // Função para download de asset específico
  const downloadAsset = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para atualizar tensão criativa
  const updateCreativeTension = (key: string, value: number) => {
    setStrategicAnalysis(prev => ({
      ...prev,
      creative_tensions: {
        ...prev.creative_tensions,
        [key]: value
      }
    }));
  };

  const navigateToStep = (step: number) => {
    if (step === 2 && (!keywords.length && !attributes.length)) {
      setError('Complete a análise antes de prosseguir');
      return;
    }
    if (step === 3 && !strategicAnalysis.validated) {
      setError('Complete a análise estratégica antes de prosseguir');
      return;
    }
    if (step === 4 && !selectedConcept) {
      setError('Selecione um conceito visual antes de prosseguir');
      return;
    }
    setCurrentStep(step);
  };

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: 'Upload', completed: currentStep > 1 },
      { number: 2, title: 'Análise', completed: currentStep > 2 },
      { number: 3, title: 'Geração', completed: currentStep > 3 },
      { number: 4, title: 'Export', completed: false }
    ];

    return (
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                ${currentStep === step.number 
                  ? 'bg-blue-600 text-white' 
                  : step.completed 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {step.completed ? <CheckCircle size={20} /> : step.number}
              </div>
              <span className="ml-2 text-sm font-medium">{step.title}</span>
              {index < steps.length - 1 && (
                <ArrowRight className="ml-4 text-gray-400" size={16} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render das etapas
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Gerenciamento de Projetos */}
      <Card>
        <CardHeader>
          <CardTitle>Projeto</CardTitle>
          <CardDescription>Selecione ou crie um projeto para organizar seu trabalho</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nome do novo projeto..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={createProject} disabled={isCreatingProject || !newProjectName.trim()}>
                {isCreatingProject ? 'Criando...' : 'Criar'}
              </Button>
            </div>
            {projects.length > 0 && (
              <select 
                value={selectedProject || ''} 
                onChange={(e) => setSelectedProject(e.target.value || null)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Selecione um projeto...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload de Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload size={24} />
            Upload de Documento
          </CardTitle>
          <CardDescription>
            Faça upload de briefings, apresentações ou documentos estratégicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <FileText className="mx-auto text-blue-600" size={48} />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {Math.round(selectedFile.size / 1024)} KB
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={parseDocument} disabled={isUploading}>
                    {isUploading ? 'Processando...' : 'Processar Documento'}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedFile(null)}>
                    Remover
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="mx-auto text-gray-400" size={48} />
                <div>
                  <p className="text-lg font-medium">Arraste um arquivo aqui</p>
                  <p className="text-gray-500">ou clique para selecionar</p>
                </div>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer">
                    Selecionar Arquivo
                  </Button>
                </label>
              </div>
            )}
          </div>

          {/* Preview das seções extraídas */}
          {uploadResult && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Seções Estratégicas Identificadas</h3>
                <div className={`
                  flex items-center gap-2 px-3 py-1 rounded-full text-sm
                  ${uploadResult.overall_confidence > 0.7 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                  }
                `}>
                  {uploadResult.overall_confidence > 0.7 ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  Confidence: {Math.round(uploadResult.overall_confidence * 100)}%
                </div>
              </div>
              
              <div className="grid gap-3">
                {uploadResult.sections.map((section, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{section.title}</h4>
                      <span className={`
                        px-2 py-1 rounded text-xs
                        ${section.confidence > 0.7 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                        }
                      `}>
                        {Math.round(section.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3">{section.content}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={validateAndProceed}
                  disabled={uploadResult.overall_confidence < 0.7}
                  className="flex-1"
                >
                  Prosseguir para Análise
                </Button>
                {uploadResult.overall_confidence < 0.7 && (
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Inserir Manualmente
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entrada Manual como Fallback */}
      <Card>
        <CardHeader>
          <CardTitle>Entrada Manual</CardTitle>
          <CardDescription>Ou insira o briefing manualmente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Descreva o projeto, objetivos, público-alvo, valores da marca..."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={6}
            />
            <Button 
              onClick={handleAnalyze} 
              disabled={isLoading || !brief.trim() || !selectedProject}
              className="w-full"
            >
              {isLoading ? 'Analisando...' : 'Analisar Briefing'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Componente Slider personalizado
  const CustomSlider = ({ 
    label, 
    leftLabel, 
    rightLabel, 
    value, 
    onChange 
  }: {
    label: string;
    leftLabel: string;
    rightLabel: string;
    value: number;
    onChange: (value: number) => void;
  }) => (
    <div className="space-y-3">
      <h4 className="font-medium text-center">{label}</h4>
      <div className="relative">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg appearance-none slider"
        />
        <div className="flex justify-center mt-1">
          <span className="text-sm font-medium">{value}%</span>
        </div>
      </div>
    </div>
  );

  // Render da Tela 2 - Análise Estratégica
  const renderStep2 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target size={24} />
            Análise Estratégica Automática
          </CardTitle>
          <CardDescription>
            Processamento semântico do briefing para extrair propósito, valores e personalidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAnalyzingStrategy ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Analisando estratégia da marca...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Propósito */}
              <div>
                <label className="block text-sm font-medium mb-2">Propósito da Marca</label>
                <Textarea
                  value={strategicAnalysis.purpose}
                  onChange={(e) => setStrategicAnalysis(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="O que a marca representa e por que existe..."
                  rows={3}
                />
              </div>

              {/* Valores */}
              <div>
                <label className="block text-sm font-medium mb-2">Valores Fundamentais</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {strategicAnalysis.values.map((value, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      <Heart size={14} />
                      {value}
                      <button 
                        onClick={() => {
                          const newValues = strategicAnalysis.values.filter((_, i) => i !== index);
                          setStrategicAnalysis(prev => ({ ...prev, values: newValues }));
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar valor..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const value = (e.target as HTMLInputElement).value.trim();
                        if (value && !strategicAnalysis.values.includes(value)) {
                          setStrategicAnalysis(prev => ({ 
                            ...prev, 
                            values: [...prev.values, value] 
                          }));
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Traços de Personalidade */}
              <div>
                <label className="block text-sm font-medium mb-2">Traços de Personalidade</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {strategicAnalysis.personality_traits.map((trait, index) => (
                    <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      <Zap size={14} />
                      {trait}
                      <button 
                        onClick={() => {
                          const newTraits = strategicAnalysis.personality_traits.filter((_, i) => i !== index);
                          setStrategicAnalysis(prev => ({ ...prev, personality_traits: newTraits }));
                        }}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar traço de personalidade..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const trait = (e.target as HTMLInputElement).value.trim();
                        if (trait && !strategicAnalysis.personality_traits.includes(trait)) {
                          setStrategicAnalysis(prev => ({ 
                            ...prev, 
                            personality_traits: [...prev.personality_traits, trait] 
                          }));
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Espectros de Tensões Criativas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders size={24} />
            Espectros de Tensões Criativas
          </CardTitle>
          <CardDescription>
            Mapeamento visual dos eixos estratégicos para guiar decisões de design
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomSlider
              label="Estilo Visual"
              leftLabel="Tradicional"
              rightLabel="Contemporâneo"
              value={strategicAnalysis.creative_tensions.traditional_contemporary}
              onChange={(value) => updateCreativeTension('traditional_contemporary', value)}
            />
            
            <CustomSlider
              label="Abordagem"
              leftLabel="Corporativo"
              rightLabel="Criativo"
              value={strategicAnalysis.creative_tensions.corporate_creative}
              onChange={(value) => updateCreativeTension('corporate_creative', value)}
            />
            
            <CustomSlider
              label="Complexidade"
              leftLabel="Minimalista"
              rightLabel="Detalhado"
              value={strategicAnalysis.creative_tensions.minimal_detailed}
              onChange={(value) => updateCreativeTension('minimal_detailed', value)}
            />
            
            <CustomSlider
              label="Tom"
              leftLabel="Sério"
              rightLabel="Descontraído"
              value={strategicAnalysis.creative_tensions.serious_playful}
              onChange={(value) => updateCreativeTension('serious_playful', value)}
            />
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2">Resumo Estratégico</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Estilo:</strong> {strategicAnalysis.creative_tensions.traditional_contemporary > 50 ? 'Contemporâneo' : 'Tradicional'} 
                ({strategicAnalysis.creative_tensions.traditional_contemporary}%)
              </div>
              <div>
                <strong>Abordagem:</strong> {strategicAnalysis.creative_tensions.corporate_creative > 50 ? 'Criativo' : 'Corporativo'} 
                ({strategicAnalysis.creative_tensions.corporate_creative}%)
              </div>
              <div>
                <strong>Complexidade:</strong> {strategicAnalysis.creative_tensions.minimal_detailed > 50 ? 'Detalhado' : 'Minimalista'} 
                ({strategicAnalysis.creative_tensions.minimal_detailed}%)
              </div>
              <div>
                <strong>Tom:</strong> {strategicAnalysis.creative_tensions.serious_playful > 50 ? 'Descontraído' : 'Sério'} 
                ({strategicAnalysis.creative_tensions.serious_playful}%)
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Voltar
            </Button>
            <Button 
              onClick={validateStrategicAnalysis}
              className="flex-1"
              disabled={!strategicAnalysis.purpose || strategicAnalysis.values.length === 0}
            >
              Validar e Prosseguir para Geração Visual
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render da Tela 3 - Geração Visual
  const renderStep3 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 size={24} />
            Geração Visual Automática
          </CardTitle>
          <CardDescription>
            Criação de 3 conceitos visuais distintos usando Stable Diffusion XL baseados na análise estratégica
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGeneratingVisuals ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-6"></div>
              <h3 className="text-lg font-semibold mb-2">Gerando Conceitos Visuais</h3>
              <p className="text-gray-600 mb-4">Isso pode levar alguns minutos...</p>
              <div className="bg-gray-100 rounded-lg p-4 max-w-md mx-auto">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Processando prompts estratégicos...</span>
                    <span>✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gerando logos com IA...</span>
                    <span>⏳</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Criando paletas de cores...</span>
                    <span>⏳</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Selecionando tipografias...</span>
                    <span>⏳</span>
                  </div>
                </div>
              </div>
            </div>
          ) : generatedVisuals ? (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">3 Conceitos Gerados</h3>
                <p className="text-gray-600">Selecione o conceito que melhor representa a identidade da marca</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {generatedVisuals.concepts.map((concept, index) => (
                  <Card 
                    key={concept.id} 
                    className={`cursor-pointer transition-all ${
                      selectedConcept === concept.id 
                        ? 'ring-2 ring-purple-600 shadow-lg' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedConcept(concept.id)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">Conceito {index + 1}</CardTitle>
                      <CardDescription className="text-sm">{concept.rationale}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Logo Preview */}
                      <div>
                        <h4 className="font-medium text-sm mb-2">Logo</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {concept.logo_variations.slice(0, 2).map((logo, logoIndex) => (
                            <div key={logoIndex} className="bg-gray-100 rounded-lg p-4 text-center">
                              <img 
                                src={logo} 
                                alt={`Logo variation ${logoIndex + 1}`}
                                className="w-full h-20 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Mb2dvPC90ZXh0Pjwvc3ZnPg==';
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Color Palette */}
                      <div>
                        <h4 className="font-medium text-sm mb-2">Paleta de Cores</h4>
                        <div className="flex gap-1">
                          {concept.color_palette.map((color, colorIndex) => (
                            <div
                              key={colorIndex}
                              className="w-8 h-8 rounded-full border border-gray-200"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Typography */}
                      <div>
                        <h4 className="font-medium text-sm mb-2">Tipografia</h4>
                        <div className="space-y-1">
                          <div className="text-sm" style={{ fontFamily: concept.typography.primary }}>
                            <strong>Principal:</strong> {concept.typography.primary}
                          </div>
                          <div className="text-sm" style={{ fontFamily: concept.typography.secondary }}>
                            <strong>Secundária:</strong> {concept.typography.secondary}
                          </div>
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      {selectedConcept === concept.id && (
                        <div className="flex items-center justify-center p-2 bg-purple-50 rounded-lg">
                          <CheckCircle className="text-purple-600 mr-2" size={16} />
                          <span className="text-purple-600 font-medium text-sm">Selecionado</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Preview Detalhado do Conceito Selecionado */}
              {selectedConcept && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye size={20} />
                      Preview Detalhado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const concept = generatedVisuals.concepts.find(c => c.id === selectedConcept);
                      if (!concept) return null;
                      
                      return (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Todas as variações de logo */}
                            <div>
                              <h4 className="font-medium mb-3">Variações de Logo</h4>
                              <div className="grid grid-cols-2 gap-3">
                                {concept.logo_variations.map((logo, logoIndex) => (
                                  <div key={logoIndex} className="bg-gray-50 rounded-lg p-6 text-center">
                                    <img 
                                      src={logo} 
                                      alt={`Logo variation ${logoIndex + 1}`}
                                      className="w-full h-16 object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Mb2dvPC90ZXh0Pjwvc3ZnPg==';
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Rationale Estratégico */}
                            <div>
                              <h4 className="font-medium mb-3">Rationale Estratégico</h4>
                              <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-sm text-blue-900">{concept.rationale}</p>
                              </div>
                              <div className="mt-4 space-y-2">
                                <h5 className="font-medium text-sm">Como suporta os objetivos:</h5>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  <li>• Reflete os valores de {strategicAnalysis.values.slice(0, 2).join(' e ')}</li>
                                  <li>• Comunica personalidade {strategicAnalysis.personality_traits.slice(0, 2).join(' e ')}</li>
                                  <li>• Alinhado com posicionamento {strategicAnalysis.creative_tensions.traditional_contemporary > 50 ? 'contemporâneo' : 'tradicional'}</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Voltar
                </Button>
                <Button 
                  onClick={finalizeSelectedConcept}
                  className="flex-1"
                  disabled={!selectedConcept}
                >
                  Finalizar e Gerar Assets Profissionais
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Palette className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">Aguardando geração de conceitos visuais...</p>
              <Button 
                onClick={generateVisualConcepts}
                className="mt-4"
                disabled={!strategicAnalysis.validated}
              >
                Gerar Conceitos Agora
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Render da Tela 4 - Export Profissional
  const renderStep4 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package size={24} />
            Export Profissional
          </CardTitle>
          <CardDescription>
            Geração automática de brand guidelines, assets em múltiplos formatos e deck de apresentação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!brandKit ? (
            <div className="space-y-6">
              {/* Configuração do Kit */}
              <div>
                <label className="block text-sm font-medium mb-2">Nome da Marca</label>
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Digite o nome da marca..."
                  className="max-w-md"
                />
              </div>

              {/* Preview do Conceito Selecionado */}
              {selectedConcept && generatedVisuals && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Conceito Selecionado</h3>
                  {(() => {
                    const concept = generatedVisuals.concepts.find(c => c.id === selectedConcept);
                    if (!concept) return null;
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Logo Principal</h4>
                          <img 
                            src={concept.logo_variations[0]} 
                            alt="Logo principal"
                            className="w-full h-20 object-contain bg-white rounded border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Mb2dvPC90ZXh0Pjwvc3ZnPg==';
                            }}
                          />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">Paleta de Cores</h4>
                          <div className="flex gap-1">
                            {concept.color_palette.slice(0, 4).map((color, index) => (
                              <div
                                key={index}
                                className="w-8 h-8 rounded border"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">Tipografia</h4>
                          <div className="text-sm">
                            <div style={{ fontFamily: concept.typography.primary }}>
                              {concept.typography.primary}
                            </div>
                            <div style={{ fontFamily: concept.typography.secondary }} className="text-gray-600">
                              {concept.typography.secondary}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Botão de Geração */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  Voltar
                </Button>
                <Button 
                  onClick={generateBrandKit}
                  disabled={!brandName.trim() || isGeneratingKit}
                  className="flex-1"
                >
                  {isGeneratingKit ? 'Gerando Kit Profissional...' : 'Gerar Kit de Marca Completo'}
                </Button>
              </div>

              {/* Status de Geração */}
              {isGeneratingKit && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="font-semibold text-center mb-4">Gerando Kit Profissional</h3>
                  <div className="space-y-3 max-w-md mx-auto">
                    <div className="flex justify-between text-sm">
                      <span>Criando brand guidelines (15 páginas)...</span>
                      <span>⏳</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Exportando assets em múltiplos formatos...</span>
                      <span>⏳</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Gerando deck de apresentação...</span>
                      <span>⏳</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Criando mockups de aplicação...</span>
                      <span>⏳</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header do Kit Gerado */}
              <div className="text-center bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                <CheckCircle className="mx-auto text-green-600 mb-4" size={48} />
                <h2 className="text-2xl font-bold mb-2">Kit de Marca Completo</h2>
                <p className="text-gray-600">Brand guidelines, assets e apresentação prontos para uso profissional</p>
              </div>

              {/* Downloads Principais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <FileDown className="mx-auto text-blue-600 mb-3" size={32} />
                    <h3 className="font-semibold mb-2">Brand Guidelines</h3>
                    <p className="text-sm text-gray-600 mb-4">PDF completo com 15 páginas estruturadas</p>
                    <Button 
                      size="sm" 
                      onClick={() => downloadAsset(brandKit.guidelines_pdf, `${brandName}_Guidelines.pdf`)}
                      className="w-full"
                    >
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Package className="mx-auto text-purple-600 mb-3" size={32} />
                    <h3 className="font-semibold mb-2">Assets Package</h3>
                    <p className="text-sm text-gray-600 mb-4">Logos, cores e fontes em PNG, SVG, PDF</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full"
                      onClick={() => downloadAsset('#', `${brandName}_Assets.zip`)}
                    >
                      Download ZIP
                    </Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Monitor className="mx-auto text-orange-600 mb-3" size={32} />
                    <h3 className="font-semibold mb-2">Deck Executivo</h3>
                    <p className="text-sm text-gray-600 mb-4">8 slides client-ready com rationale</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => downloadAsset(brandKit.presentation_deck, `${brandName}_Presentation.pptx`)}
                      className="w-full"
                    >
                      Download PPTX
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Assets Detalhados */}
              <Card>
                <CardHeader>
                  <CardTitle>Assets Inclusos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logos */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Image size={16} />
                        Logos ({brandKit.assets_package.logos.length} variações)
                      </h4>
                      <div className="space-y-2">
                        {brandKit.assets_package.logos.map((logo, index) => (
                          <div key={index} className="flex justify-between items-center text-sm bg-gray-50 rounded p-2">
                            <span>Logo variação {index + 1} - {logo.format}</span>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => downloadAsset(logo.url, `logo_${index + 1}.${logo.format.toLowerCase()}`)}
                            >
                              <Download size={14} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mockups */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Monitor size={16} />
                        Mockups ({brandKit.assets_package.mockups.length} aplicações)
                      </h4>
                      <div className="space-y-2">
                        {brandKit.assets_package.mockups.map((mockup, index) => (
                          <div key={index} className="flex justify-between items-center text-sm bg-gray-50 rounded p-2">
                            <span>{mockup.type}</span>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => downloadAsset(mockup.url, `mockup_${mockup.type.toLowerCase()}.png`)}
                            >
                              <Download size={14} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preview das Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview - Brand Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.entries(brandKit.guidelines_pages).map(([page, url]) => (
                      <div key={page} className="text-center">
                        <div className="bg-gray-100 rounded-lg p-2 mb-2 aspect-[3/4]">
                          <img 
                            src={url} 
                            alt={`${page} page`}
                            className="w-full h-full object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEzMyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEzMyIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwIiB5PSI3MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QYWdlPC90ZXh0Pjwvc3ZnPg==';
                            }}
                          />
                        </div>
                        <p className="text-xs capitalize">{page.replace('_', ' ')}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Ações Finais */}
              <div className="text-center bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-2">Sistema de Identidade Visual Completo</h3>
                <p className="text-gray-600 mb-4">
                  Todos os assets foram gerados com rationale estratégico e estão prontos para implementação profissional.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Novo Projeto
                  </Button>
                  <Button 
                    onClick={() => downloadAsset(brandKit.guidelines_pdf, `${brandName}_Complete_Kit.zip`)}
                  >
                    Download Kit Completo
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <main className="container mx-auto p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">MWP - Brand Co-Pilot</h1>
        <p className="text-muted-foreground">Sistema de Identidade Visual Profissional</p>
      </div>

      {renderStepIndicator()}

      <div className="max-w-4xl mx-auto">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      {error && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setError(null)}
              className="mt-2"
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}