'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Upload, FileText, CheckCircle, AlertCircle, Sliders, Target, Heart, Zap, Palette, Wand2, Download, Eye, Package, FileDown, Image, Monitor, Sparkles, Atom, Layers, Zap as Lightning, Orbit, Trash2, RefreshCcw, Plus, HelpCircle, MoreHorizontal } from 'lucide-react';
import { QuantumSlider } from '@/components/ui/quantum-slider';
import { DataStream, NeuralNetwork, QuantumParticles, HolographicText, QuantumButton } from '@/components/ui/quantum-effects';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import NextImage from 'next/image';

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
  const [isDeletingProject, setIsDeletingProject] = useState<string | null>(null);
  
  // Estados para conexão da API
  const [apiHealth, setApiHealth] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');

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
  
  // Estado para user_id (simulado) - UUID válido para demo
  const [userId] = useState('550e8400-e29b-41d4-a716-446655440000');

  // Função para testar saúde da API
  const checkApiHealth = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        setApiHealth('unhealthy');
        return;
      }

      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const health = await response.json();
        console.log('API Health:', health);
        setApiHealth('healthy');
      } else {
        setApiHealth('unhealthy');
      }
    } catch (error) {
      console.error('Erro ao verificar saúde da API:', error);
      setApiHealth('unhealthy');
    }
  };

  const loadProjects = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (err) {
      console.error('Erro ao carregar projetos:', err);
    }
  }, [userId]);

  // Função para análise estratégica automática
  const performStrategicAnalysis = useCallback(async () => {
    if (!brief || !currentBriefId) return;
    
    setIsAnalyzingStrategy(true);
    setError(null);
    
    try {
      // Verificar se a URL da API está configurada
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('URL da API não configurada. Verifique a variável NEXT_PUBLIC_API_URL.');
      }

      const response = await fetch(`${apiUrl}/strategic-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brief_id: currentBriefId,
          brief_content: brief
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 422) {
          throw new Error(errorData.detail || errorData.message || 'Erro de validação: verifique os dados enviados');
        }
        throw new Error(errorData.message || `Erro HTTP: ${response.status}. Tente novamente ou verifique sua conexão.`);
      }

      const data = await response.json();
      
      if (data.analysis) {
        setStrategicAnalysis({
          purpose: data.analysis.purpose || '',
          values: data.analysis.brand_values || [],
          personality_traits: data.analysis.personality_traits || [],
          creative_tensions: {
            traditional_contemporary: 50,
            corporate_creative: 50,
            minimal_detailed: 50,
            serious_playful: 50
          },
          validated: false
        });
      } else {
        // Análise mock se a API não retornar dados válidos
        setStrategicAnalysis({
          purpose: 'Criar uma marca inovadora e sustentável que conecta pessoas através da tecnologia.',
          values: ['Inovação', 'Sustentabilidade', 'Conexão Humana'],
          personality_traits: ['Moderna', 'Confiável', 'Inspiradora'],
          creative_tensions: {
            traditional_contemporary: 50,
            corporate_creative: 50,
            minimal_detailed: 50,
            serious_playful: 50
          },
          validated: false
        });
      }
    } catch (err) {
      console.error('Erro na análise estratégica:', err);
      
      let errorMessage = 'Erro desconhecido';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        errorMessage = 'Erro na comunicação com o servidor';
      }
      
      setError(`${errorMessage}. Tente novamente ou verifique sua conexão.`);
    } finally {
      setIsAnalyzingStrategy(false);
    }
  }, [brief, currentBriefId]);

  // Função para geração de conceitos visuais
  const generateVisualConcepts = useCallback(async () => {
    if (!currentBriefId || !strategicAnalysis.validated) return;
    
    setIsGeneratingVisuals(true);
    setError(null);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('URL da API não configurada');
      }

      console.log('Gerando conceitos visuais...', {
        briefId: currentBriefId,
        projectId: selectedProject,
        strategicAnalysis
      });

      const response = await fetch(`${apiUrl}/generate-visual-concepts`, {
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
            traditional_contemporary: strategicAnalysis.creative_tensions?.traditional_contemporary || 50,
            corporate_creative: strategicAnalysis.creative_tensions?.corporate_creative || 50,
            minimal_detailed: strategicAnalysis.creative_tensions?.minimal_detailed || 50,
            serious_playful: strategicAnalysis.creative_tensions?.serious_playful || 50
          }
        }),
      });

      console.log('Resposta conceitos visuais:', response.status);

      if (!response.ok) {
        let errorMessage = 'Falha na geração dos conceitos visuais';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          if (response.status === 404) {
            errorMessage = 'Serviço de conceitos visuais não encontrado';
          } else if (response.status === 422) {
            errorMessage = 'Dados inválidos para geração de conceitos. Verifique a análise estratégica.';
          } else if (response.status === 500) {
            errorMessage = 'Erro interno do servidor na geração de conceitos';
          }
        }
        throw new Error(errorMessage);
      }

      const visuals = await response.json();
      console.log('Conceitos visuais gerados:', visuals);
      
      if (!visuals || !visuals.concepts) {
        throw new Error('Resposta de conceitos visuais inválida');
      }
      
      setGeneratedVisuals(visuals);
      
    } catch (err) {
      console.error('Erro na geração de conceitos visuais:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro na geração de conceitos visuais';
      setError(`${errorMessage}. Tente novamente.`);
    } finally {
      setIsGeneratingVisuals(false);
    }
  }, [currentBriefId, selectedProject, strategicAnalysis, keywords, attributes]);

  // Carregar projetos ao inicializar
  useEffect(() => {
    checkApiHealth();
    loadProjects();
  }, [loadProjects]);

  // Triggerar análise estratégica quando mudar para step 2
  useEffect(() => {
    if (currentStep === 2 && currentBriefId && !strategicAnalysis.purpose) {
      performStrategicAnalysis();
    }
  }, [currentStep, currentBriefId, performStrategicAnalysis, strategicAnalysis.purpose]);

  // Triggerar geração visual quando mudar para step 3
  useEffect(() => {
    if (currentStep === 3 && strategicAnalysis.validated && !generatedVisuals) {
      generateVisualConcepts();
    }
  }, [currentStep, strategicAnalysis.validated, generateVisualConcepts, generatedVisuals]);

  // Triggerar geração do kit quando mudar para step 4
  useEffect(() => {
    if (currentStep === 4 && selectedConcept && !brandKit) {
      // Auto-gerar nome da marca se não fornecido
      if (!brandName) {
        const projectName = projects.find(p => p.id === selectedProject)?.name || 'Nova Marca';
        setBrandName(projectName);
      }
    }
  }, [currentStep, selectedConcept, brandKit, brandName, projects, selectedProject]);

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    
    setIsCreatingProject(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
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

  const deleteProject = async (projectId: string) => {
    setIsDeletingProject(projectId);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update state immediately after successful deletion
        setProjects(prevProjects => {
          const newProjects = prevProjects.filter(p => p.id !== projectId);
          console.log(`Deleted project ${projectId}. Projects count: ${prevProjects.length} -> ${newProjects.length}`);
          return newProjects;
        });
        
        if (selectedProject === projectId) {
          setSelectedProject(null);
        }
        
        // Also refresh from server to ensure consistency
        await loadProjects();
      } else {
        console.error('Failed to delete project:', response.status, response.statusText);
        setError(`Erro ao excluir projeto: ${response.status}`);
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Erro ao excluir projeto');
    } finally {
      setIsDeletingProject(null);
    }
  };

  const clearAllProjects = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSelectedProject(null);
        setProjects([]);
      }
    } catch (err) {
      setError('Erro ao limpar projetos');
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
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/parse-document`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 422) {
          throw new Error(errorData.detail || 'Formato de documento inválido ou dados insuficientes.');
        }
        throw new Error(errorData.message || 'Falha ao processar documento');
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analyze-brief`, {
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
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 422) {
          throw new Error(errorData.detail || 'Dados inválidos no briefing. Verifique o conteúdo e tente novamente.');
        }
        throw new Error(errorData.message || 'Falha ao analisar o briefing.');
      }

      const data: AnalysisResult = await response.json();
      console.log('Dados da análise de brief:', data);
      
      // Garantir que keywords e attributes sejam arrays válidos
      const validKeywords = Array.isArray(data.keywords) ? data.keywords.filter(k => typeof k === 'string') : [];
      const validAttributes = Array.isArray(data.attributes) ? data.attributes.filter(a => typeof a === 'string') : [];
      
      setKeywords(validKeywords);
      setAttributes(validAttributes);
      setCurrentBriefId(data.brief_id);
      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };


  // Função para validar análise estratégica
  const validateStrategicAnalysis = () => {
    console.log('Validando análise estratégica:', strategicAnalysis);
    
    if (!strategicAnalysis.purpose || strategicAnalysis.purpose.trim() === '') {
      setError('O propósito da marca é obrigatório para continuar');
      return;
    }
    
    // Validação mais flexível - permitir continuar mesmo com arrays vazios
    if (strategicAnalysis.values.length === 0 && strategicAnalysis.personality_traits.length === 0) {
      setError('Pelo menos um valor ou traço de personalidade é necessário');
      return;
    }
    
    console.log('Análise validada com sucesso, prosseguindo para etapa 3');
    setError(null); // Limpar erros
    setStrategicAnalysis(prev => ({ ...prev, validated: true }));
    setCurrentStep(3);
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
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate-brand-kit`, {
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
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 422) {
          throw new Error(errorData.detail || 'Dados insuficientes para gerar o kit. Verifique todas as etapas anteriores.');
        }
        throw new Error(errorData.message || 'Falha na geração do kit de marca');
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
      { number: 1, title: 'Upload', icon: Upload, completed: currentStep > 1, color: 'from-blue-500 to-blue-600' },
      { number: 2, title: 'Análise', icon: Target, completed: currentStep > 2, color: 'from-green-500 to-green-600' },
      { number: 3, title: 'Geração', icon: Sparkles, completed: currentStep > 3, color: 'from-purple-500 to-purple-600' },
      { number: 4, title: 'Exportação', icon: Package, completed: false, color: 'from-orange-500 to-orange-600' }
    ];

    return (
      <div className="relative mb-8 sm:mb-12">
        <DataStream className="h-1" lineCount={3} />
        <div className="flex justify-center px-4">
          <div className="flex items-center space-x-4 sm:space-x-8 overflow-x-auto pb-4 pt-2 px-2 relative z-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = step.completed;
              
              return (
                <div key={step.number} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div 
                      className={`
                        relative w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-sm sm:text-base font-heading font-bold
                        transition-all duration-500 transform-gpu cursor-pointer
                        ${
                          isActive 
                            ? `bg-gradient-to-br ${step.color} shadow-quantum animate-neon-pulse scale-110` 
                            : isCompleted 
                            ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-neon-cyan scale-105' 
                            : 'bg-brand-glass-white backdrop-blur-quantum border border-brand-glass-white hover:border-brand-neon-cyan'
                        }
                      `}
                      onClick={() => navigateToStep(step.number)}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      ) : isActive ? (
                        <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      ) : (
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-foreground/60" />
                      )}
                      
                      {/* Holographic glow effect - positioned behind icon */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent animate-holographic-shimmer pointer-events-none -z-10" />
                      )}
                    </div>
                    
                    <span className={`
                      mt-2 text-xs sm:text-sm font-heading font-medium text-center max-w-[80px] sm:max-w-none
                      ${
                        isActive 
                          ? 'text-brand-gold text-shadow-glow' 
                          : isCompleted 
                          ? 'text-green-400' 
                          : 'text-muted-foreground'
                      }
                    `}>
                      {step.title}
                    </span>
                  </div>
                  
                  {/* Neural connection line */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-4 sm:mx-6 relative">
                      <div className={`
                        h-0.5 rounded-full transition-all duration-1000
                        ${
                          isCompleted 
                            ? 'bg-gradient-to-r from-green-400 to-brand-neon-cyan animate-data-stream' 
                            : 'bg-brand-glass-white'
                        }
                      `} />
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-neon-cyan animate-neon-pulse" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Background neural network */}
        <div className="absolute inset-0 opacity-10">
          <NeuralNetwork nodeCount={12} />
        </div>
      </div>
    );
  };

  // Render das etapas
  const renderStep1 = () => (
    <div className="space-y-8">
      {/* Gerenciamento de Projetos Premium */}
      <TooltipProvider>
        <Card className="border-border/50 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Gestão de Projetos</CardTitle>
                  <CardDescription>Organize e gerencie seus projetos de branding</CardDescription>
                </div>
              </div>
              
              {projects.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          Limpar Todos
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Limpeza</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação irá remover todos os projetos permanentemente. Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={clearAllProjects}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Limpar Todos
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Criar Novo Projeto */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Novo Projeto</label>
              <div className="flex gap-3">
                <Input
                  placeholder="Nome do projeto (ex: Rebranding Empresa X)"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="flex-1 h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' && newProjectName.trim()) {
                      createProject();
                    }
                  }}
                />
                <Button 
                  onClick={createProject} 
                  disabled={isCreatingProject || !newProjectName.trim()}
                  className="h-11 px-6 bg-primary hover:bg-primary/90 transition-all"
                >
                  {isCreatingProject ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                      Criando
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Lista de Projetos */}
            {projects.length > 0 ? (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Projetos Existentes</label>
                <div className="grid gap-2">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer group hover:border-primary/50 ${
                        selectedProject === project.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/50 hover:bg-accent/50'
                      }`}
                      onClick={() => setSelectedProject(project.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          selectedProject === project.id ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{project.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {selectedProject === project.id && (
                          <CheckCircle className="w-4 h-4 text-primary mr-2" />
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                              onClick={(e) => e.stopPropagation()}
                              disabled={isDeletingProject === project.id}
                            >
                              {isDeletingProject === project.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza de que deseja excluir o projeto &quot;{project.name}&quot;? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteProject(project.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Nenhum projeto criado</p>
                <p className="text-xs text-muted-foreground">Crie seu primeiro projeto para começar</p>
              </div>
            )}
            
            {selectedProject && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-primary font-medium">
                  ✓ Projeto &quot;{projects.find(p => p.id === selectedProject)?.name}&quot; selecionado
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TooltipProvider>

      {/* Upload de Documentos Premium */}
      <Card className="border-border/50 shadow-lg bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Análise Inteligente de Documentos</CardTitle>
              <CardDescription>
                Upload de briefs, apresentações e documentos estratégicos com IA
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div 
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 group overflow-visible
              ${dragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border/50 hover:border-primary/50 hover:bg-accent/30'}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mx-auto overflow-visible">
                  <FileText className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-lg">{selectedFile.name}</p>
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <span>{Math.round(selectedFile.size / 1024)} KB</span>
                    <span>•</span>
                    <span>{selectedFile.type || 'Documento'}</span>
                  </div>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={parseDocument} 
                    disabled={isUploading}
                    className="px-8 h-11"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                        Processando com IA...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Processar com IA
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedFile(null)}
                    className="h-11"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-8 py-4">
                <div className="flex items-center justify-center w-24 h-24 rounded-full bg-muted/20 mx-auto group-hover:bg-primary/10 transition-colors overflow-visible p-2">
                  <Upload className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-semibold">Arraste arquivos aqui</p>
                  <p className="text-muted-foreground">Ou clique para selecionar documentos</p>
                  <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, TXT, PPT, PPTX (máx. 10MB)</p>
                </div>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer h-11 px-8">
                    <Plus className="w-4 h-4 mr-2" />
                    Selecionar Arquivo
                  </Button>
                </label>
              </div>
            )}
          </div>

          {/* Preview Premium das seções extraídas */}
          {uploadResult && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background">
                    <Eye className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Análise Concluída</h3>
                    <p className="text-sm text-muted-foreground">Seções estratégicas identificadas por IA</p>
                  </div>
                </div>
                <div className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                  ${uploadResult.overall_confidence > 0.7 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400' 
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400'
                  }
                `}>
                  {uploadResult.overall_confidence > 0.7 ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  Confiança: {Math.round(uploadResult.overall_confidence * 100)}%
                </div>
              </div>
              
              <div className="grid gap-4">
                {uploadResult.sections.map((section, index) => (
                  <div key={index} className="p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card/80 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          section.confidence > 0.7 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />
                        <h4 className="font-semibold text-sm">{section.title}</h4>
                      </div>
                      <span className={`
                        px-3 py-1 rounded-full text-xs font-medium
                        ${section.confidence > 0.7 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                        }
                      `}>
                        {Math.round(section.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{section.content}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={validateAndProceed}
                  disabled={uploadResult.overall_confidence < 0.7}
                  className="flex-1 h-11"
                >
                  {uploadResult.overall_confidence > 0.7 ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Prosseguir para Análise
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Confiança Insuficiente
                    </>
                  )}
                </Button>
                {uploadResult.overall_confidence < 0.7 && (
                  <Button variant="outline" onClick={() => setCurrentStep(1)} className="h-11">
                    <FileText className="w-4 h-4 mr-2" />
                    Inserir Manualmente
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entrada Manual Premium */}
      <Card className="border-border/50 shadow-lg bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <Zap className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Brief Estratégico</CardTitle>
              <CardDescription>
                Descreva seu projeto para análise completa com IA generativa
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!selectedProject && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                    Projeto Obrigatório
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-1">
                    Selecione ou crie um projeto antes de inserir o brief
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Brief do Projeto</label>
            <Textarea
              placeholder="Exemplo: Projeto de rebranding para empresa de tecnologia B2B. Objetivo: modernizar a identidade visual e comunicar inovação. Público-alvo: CTOs e diretores de TI de empresas médias e grandes. Valores: inovação, confiabilidade, expertise técnica..."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={8}
              className="min-h-[200px] bg-background/50 border-border/50 focus:border-primary/50 transition-all resize-none"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Inclua: objetivo, público-alvo, valores, posicionamento desejado</span>
              <span>{brief.length}/2000 caracteres</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              onClick={handleAnalyze} 
              disabled={isLoading || !brief.trim() || !selectedProject}
              className="flex-1 h-12 font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2" />
                  Processando com IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Iniciar Análise Estratégica
                </>
              )}
            </Button>
            
            {brief.trim() && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setBrief('')}
                className="h-12 px-6"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
          
          {brief.trim() && brief.length < 50 && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-500/5 dark:border-blue-500/20">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Para uma análise mais precisa, inclua mais detalhes sobre o projeto, objetivos e público-alvo.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );


  // Render da Tela 2 - Análise Estratégica
  const renderStep2 = () => (
    <div className="space-y-8">
      <Card className="border-border/50 shadow-lg bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Target className="w-6 h-6 text-primary" />
            Análise Estratégica
          </CardTitle>
          <CardDescription>
            Processamento semântico para extração da essência da marca
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAnalyzingStrategy ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
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
                    <span key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-primary/20">
                      <Heart size={14} />
                      {value}
                      <button 
                        onClick={() => {
                          const newValues = strategicAnalysis.values.filter((_, i) => i !== index);
                          setStrategicAnalysis(prev => ({ ...prev, values: newValues }));
                        }}
                        className="text-primary hover:text-primary/80"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar valor..."
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
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
                    <span key={index} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-secondary/20">
                      <Zap size={14} />
                      {trait}
                      <button 
                        onClick={() => {
                          const newTraits = strategicAnalysis.personality_traits.filter((_, i) => i !== index);
                          setStrategicAnalysis(prev => ({ ...prev, personality_traits: newTraits }));
                        }}
                        className="text-secondary-foreground hover:text-muted-foreground"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar traço de personalidade..."
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
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
      <Card className="">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Sliders className="w-6 h-6 text-primary" />
            Matriz de Tensões Criativas
          </CardTitle>
          <CardDescription>
            Mapeamento estratégico de vetores de design
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <QuantumSlider
              label="Visual Spectrum"
              leftLabel="Tradicional"
              rightLabel="Contemporâneo"
              value={strategicAnalysis.creative_tensions.traditional_contemporary}
              onChange={(value) => updateCreativeTension('traditional_contemporary', value)}
              color="gold"
            />
            
            <QuantumSlider
              label="Approach Vector"
              leftLabel="Corporativo"
              rightLabel="Criativo"
              value={strategicAnalysis.creative_tensions.corporate_creative}
              onChange={(value) => updateCreativeTension('corporate_creative', value)}
              color="cyan"
            />
            
            <QuantumSlider
              label="Complexity Matrix"
              leftLabel="Minimalista"
              rightLabel="Detalhado"
              value={strategicAnalysis.creative_tensions.minimal_detailed}
              onChange={(value) => updateCreativeTension('minimal_detailed', value)}
              color="purple"
            />
            
            <QuantumSlider
              label="Tone Frequency"
              leftLabel="Sério"
              rightLabel="Descontraído"
              value={strategicAnalysis.creative_tensions.serious_playful}
              onChange={(value) => updateCreativeTension('serious_playful', value)}
              color="pink"
            />
          </div>

          <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
              <h4 className="font-bold mb-4 text-center">
                Matriz Estratégica
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-card border border-border/50">
                  <span className="text-primary font-bold">Visual:</span>{' '}
                  <span className="text-foreground font-medium">
                    {strategicAnalysis.creative_tensions.traditional_contemporary > 50 ? 'Contemporâneo' : 'Tradicional'}
                  </span>
                  <span className="text-muted-foreground ml-2">({strategicAnalysis.creative_tensions.traditional_contemporary}%)</span>
                </div>
                <div className="p-3 rounded-lg bg-card border border-border/50">
                  <span className="text-primary font-bold">Abordagem:</span>{' '}
                  <span className="text-foreground font-medium">
                    {strategicAnalysis.creative_tensions.corporate_creative > 50 ? 'Criativo' : 'Corporativo'}
                  </span>
                  <span className="text-muted-foreground ml-2">({strategicAnalysis.creative_tensions.corporate_creative}%)</span>
                </div>
                <div className="p-3 rounded-lg bg-card border border-border/50">
                  <span className="text-primary font-bold">Complexidade:</span>{' '}
                  <span className="text-foreground font-medium">
                    {strategicAnalysis.creative_tensions.minimal_detailed > 50 ? 'Detalhado' : 'Minimalista'}
                  </span>
                  <span className="text-muted-foreground ml-2">({strategicAnalysis.creative_tensions.minimal_detailed}%)</span>
                </div>
                <div className="p-3 rounded-lg bg-card border border-border/50">
                  <span className="text-primary font-bold">Tom:</span>{' '}
                  <span className="text-foreground font-medium">
                    {strategicAnalysis.creative_tensions.serious_playful > 50 ? 'Descontraído' : 'Sério'}
                  </span>
                  <span className="text-muted-foreground ml-2">({strategicAnalysis.creative_tensions.serious_playful}%)</span>
                </div>
              </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Voltar
            </Button>
            <Button
              size="lg"
              onClick={validateStrategicAnalysis}
              className="flex-1 font-bold"
              disabled={!strategicAnalysis.purpose || strategicAnalysis.values.length === 0}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Prosseguir para Geração Visual
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render da Tela 3 - Geração Visual
  const renderStep3 = () => (
    <div className="space-y-8">
      <Card variant="morphing" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-neon-purple/15 via-brand-neon-pink/10 to-brand-gold/15" />
        <div className="absolute inset-0 opacity-20">
          <QuantumParticles particleCount={20} colors={['#8A2BE2', '#FF69B4', '#FFD700']} />
        </div>
        <CardHeader className="relative z-20">
          <CardTitle className="flex items-center gap-3">
            <div className="relative">
              <Sparkles className="w-7 h-7 text-brand-neon-purple animate-pulse" />
              <Wand2 className="w-4 h-4 text-brand-gold absolute -top-1 -right-1 animate-bounce" />
            </div>
            <HolographicText>AI Visual Genesis</HolographicText>
          </CardTitle>
          <CardDescription>
            Stable Diffusion XL quantum rendering based on strategic neural patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGeneratingVisuals ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6"></div>
              <h3 className="text-lg font-semibold mb-2">Gerando Conceitos Visuais</h3>
              <p className="text-muted-foreground mb-4">Isso pode levar alguns minutos...</p>
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
                        ? 'ring-2 ring-primary shadow-lg' 
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
                        <div className="flex items-center justify-center p-2 bg-primary/10 rounded-lg">
                          <CheckCircle className="text-primary mr-2" size={16} />
                          <span className="text-primary font-medium text-sm">Selecionado</span>
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
                <QuantumButton
                  variant="quantum"
                  size="lg"
                  onClick={finalizeSelectedConcept}
                  className="flex-1 font-bold"
                  disabled={!selectedConcept}
                >
                  <Orbit className="w-5 h-5 mr-2" />
                  MATERIALIZE HOLOGRAPHIC ASSETS
                </QuantumButton>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Palette className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">Aguardando geração de conceitos visuais...</p>
              <QuantumButton
                variant="neon"
                size="lg"
                onClick={generateVisualConcepts}
                className="mt-6 font-bold"
                disabled={!strategicAnalysis.validated}
              >
                <Lightning className="w-5 h-5 mr-2" />
                GENERATE QUANTUM CONCEPTS
              </QuantumButton>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Render da Tela 4 - Export Profissional
  const renderStep4 = () => (
    <div className="space-y-8">
      <Card variant="quantum" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/20 via-brand-neon-cyan/10 to-brand-neon-purple/15" />
        <div className="absolute inset-0 opacity-25">
          <NeuralNetwork nodeCount={25} />
        </div>
        <DataStream className="absolute inset-0 opacity-40" lineCount={6} />
        <CardHeader className="relative z-20">
          <CardTitle className="flex items-center gap-3">
            <div className="relative">
              <Package className="w-7 h-7 text-brand-gold" />
              <div className="absolute -inset-1 border-2 border-brand-neon-cyan rounded-lg animate-neon-pulse" />
              <Orbit className="w-3 h-3 text-brand-neon-purple absolute -top-1 -right-1 animate-spin" />
            </div>
            <HolographicText>Holographic Export Matrix</HolographicText>
          </CardTitle>
          <CardDescription>
            Quantum materialization of brand assets across dimensional formats
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
                <QuantumButton
                  variant="quantum"
                  size="lg"
                  onClick={generateBrandKit}
                  disabled={!brandName.trim() || isGeneratingKit}
                  className="flex-1 font-bold text-lg"
                >
                  {isGeneratingKit ? (
                    <>
                      <Atom className="w-6 h-6 mr-3 animate-spin" />
                      MATERIALIZING QUANTUM KIT...
                    </>
                  ) : (
                    <>
                      <Orbit className="w-6 h-6 mr-3" />
                      GENERATE HOLOGRAPHIC BRAND KIT
                    </>
                  )}
                </QuantumButton>
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
              <div className="relative text-center bg-gradient-to-br from-brand-gold/20 via-brand-neon-cyan/10 to-brand-neon-purple/20 rounded-2xl p-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-brand-neon-cyan/10 animate-holographic-shimmer" />
                <div className="relative z-10">
                  <div className="relative inline-block mb-6">
                    <CheckCircle className="w-16 h-16 text-green-400 animate-neon-pulse" />
                    <div className="absolute inset-0 w-16 h-16 border-2 border-green-400 rounded-full animate-ping" />
                  </div>
                  <HolographicText className="text-3xl sm:text-4xl font-bold mb-4">
                    QUANTUM KIT MATERIALIZED
                  </HolographicText>
                  <p className="text-lg text-muted-foreground/90 font-sans leading-relaxed">
                    <span className="text-brand-gold font-semibold">Holographic brand guidelines</span>, 
                    <span className="text-brand-neon-cyan font-semibold">quantum assets</span> and 
                    <span className="text-brand-neon-purple font-semibold">neural presentations</span> 
                    ready for dimensional deployment
                  </p>
                </div>
                <DataStream className="absolute inset-0 opacity-30" lineCount={4} />
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
                    <Package className="mx-auto text-primary mb-3" size={32} />
                    <h3 className="font-semibold mb-2">Assets Package</h3>
                    <p className="text-sm text-muted-foreground mb-4">Logos, cores e fontes em PNG, SVG, PDF</p>
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
                        <Image size={16} aria-label="Logos" />
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
    <main className="min-h-screen bg-background transition-colors duration-300">
      
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8 sm:space-y-12 relative z-10">
        {/* Premium Header */}
        <div className="border-b border-border/20 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">5º</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">5º Elemento</h1>
                <p className="text-xs text-muted-foreground">Premium Branding Platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border/20">
                <div className={`w-2 h-2 rounded-full ${
                  apiHealth === 'healthy' ? 'bg-emerald-500' : 
                  apiHealth === 'unhealthy' ? 'bg-red-500' : 
                  'bg-yellow-500'
                }`} />
                <span className="text-xs font-medium text-muted-foreground">
                  {apiHealth === 'healthy' ? 'Online' : 
                   apiHealth === 'unhealthy' ? 'Offline' : 
                   'Conectando...'}
                </span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
        
        {/* Hero Section */}
        <div className="text-center px-4 py-12 relative">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Identidade que Domina Mercados
            </h2>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              <span className="text-primary font-medium">4 elementos</span> criam a identidade. 
              <span className="text-primary font-medium"> O 5º</span> cria 
              <span className="text-foreground font-bold"> domínio de mercado</span>.
            </p>
            
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>IA Generativa</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Análise Estratégica</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Export Profissional</span>
              </div>
            </div>
          </div>
        </div>

        {renderStepIndicator()}

        <div className="max-w-6xl mx-auto px-4 sm:px-0 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/5 via-transparent to-brand-neon-cyan/5 rounded-3xl blur-3xl" />
          
          <div className="relative z-10">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>
        </div>

        {error && (
          <div className="max-w-4xl mx-auto px-4 sm:px-0">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm sm:text-base">{error}</p>
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
      </div>
    </main>
  );
}