'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Project {
  id: string;
  name: string;
  created_at: string;
}

interface AnalysisResult {
  brief_id: string | null;
  keywords: string[];
  attributes: string[];
  sentiment: string;
  project_id: string | null;
}

export default function HomePage() {
  // Estados existentes
  const [brief, setBrief] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Novos estados para projetos e tags editáveis
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [currentBriefId, setCurrentBriefId] = useState<string | null>(null);
  const [editedKeywords, setEditedKeywords] = useState<string[]>([]);
  const [editedAttributes, setEditedAttributes] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newAttribute, setNewAttribute] = useState('');
  
  // Estado para user_id (simulado)
  const [userId] = useState('demo-user-123');

  // Carregar projetos ao inicializar
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/projects/${userId}`);
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
      const response = await fetch('http://127.0.0.1:8000/projects', {
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

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/analyze-brief', {
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
      setEditedKeywords(data.keywords);
      setEditedAttributes(data.attributes);
      setCurrentBriefId(data.brief_id);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveEditedTags = async () => {
    if (!currentBriefId) return;
    
    try {
      const response = await fetch('http://127.0.0.1:8000/update-brief', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brief_id: currentBriefId,
          keywords: editedKeywords,
          attributes: editedAttributes
        }),
      });

      if (response.ok) {
        setKeywords(editedKeywords);
        setAttributes(editedAttributes);
        setIsEditing(false);
      } else {
        setError('Erro ao salvar alterações');
      }
    } catch (err) {
      setError('Erro ao salvar alterações');
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !editedKeywords.includes(newKeyword.trim())) {
      setEditedKeywords([...editedKeywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const addAttribute = () => {
    if (newAttribute.trim() && !editedAttributes.includes(newAttribute.trim())) {
      setEditedAttributes([...editedAttributes, newAttribute.trim()]);
      setNewAttribute('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setEditedKeywords(editedKeywords.filter(k => k !== keyword));
  };

  const removeAttribute = (attribute: string) => {
    setEditedAttributes(editedAttributes.filter(a => a !== attribute));
  };

  return (
    <main className="container mx-auto p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Brand Co-Pilot</h1>
        <p className="text-muted-foreground">Plataforma de desenvolvimento de marca alimentada por IA</p>
      </div>

      {/* Seção de Projetos */}
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Gerenciar Projetos</CardTitle>
          <CardDescription>
            Organize seus briefings por projeto para melhor controle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Criar Projeto */}
            <div className="flex gap-2">
              <Input
                placeholder="Nome do novo projeto..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={createProject} 
                disabled={isCreatingProject || !newProjectName.trim()}
              >
                {isCreatingProject ? 'Criando...' : 'Criar Projeto'}
              </Button>
            </div>

            {/* Selecionar Projeto */}
            {projects.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Projeto Ativo:</label>
                <select 
                  value={selectedProject || ''} 
                  onChange={(e) => setSelectedProject(e.target.value || null)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Selecione um projeto...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seção de Análise de Briefing */}
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Fase 1: Onboarding Semântico</CardTitle>
          <CardDescription>
            Traduza um briefing de texto em parâmetros criativos para a IA
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
            <Button 
              onClick={handleAnalyze} 
              disabled={isLoading || !brief.trim()}
              className="w-full"
            >
              {isLoading ? 'Analisando...' : 'Analisar Briefing e Gerar Conceitos'}
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>

          {/* Resultados da Análise */}
          {(keywords.length > 0 || attributes.length > 0) && (
            <div className="mt-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Análise da IA</h3>
                <div className="space-x-2">
                  {!isEditing ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsEditing(true);
                        setEditedKeywords([...keywords]);
                        setEditedAttributes([...attributes]);
                      }}
                    >
                      Editar Tags
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        size="sm"
                        onClick={saveEditedTags}
                        disabled={!currentBriefId}
                      >
                        Salvar Alterações
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Keywords */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-blue-600">Palavras-chave:</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(isEditing ? editedKeywords : keywords).map((kw, index) => (
                    <span 
                      key={`${kw}-${index}`}
                      className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm flex items-center gap-2"
                    >
                      {kw}
                      {isEditing && (
                        <button 
                          onClick={() => removeKeyword(kw)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                
                {isEditing && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nova palavra-chave..."
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={addKeyword}>Adicionar</Button>
                  </div>
                )}
              </div>

              {/* Attributes */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-purple-600">Atributos de Marca:</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(isEditing ? editedAttributes : attributes).map((attr, index) => (
                    <span 
                      key={`${attr}-${index}`}
                      className="bg-purple-100 text-purple-800 rounded-full px-3 py-1 text-sm flex items-center gap-2"
                    >
                      {attr}
                      {isEditing && (
                        <button 
                          onClick={() => removeAttribute(attr)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {isEditing && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Novo atributo..."
                      value={newAttribute}
                      onChange={(e) => setNewAttribute(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addAttribute()}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={addAttribute}>Adicionar</Button>
                  </div>
                )}
              </div>

              {selectedProject && currentBriefId && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✅ Análise salva no projeto "{projects.find(p => p.id === selectedProject)?.name}"
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}