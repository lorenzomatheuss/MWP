-- Schema atualizado para Brand Co-Pilot
-- Execute este script no SQL Editor do Supabase

-- Tabela para gerenciar projetos
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, -- Removido REFERENCES para demo sem autenticação
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela para armazenar os briefings e suas análises (aprimorada)
CREATE TABLE IF NOT EXISTS briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  analyzed_keywords JSONB DEFAULT '[]'::jsonb,
  analyzed_attributes JSONB DEFAULT '[]'::jsonb,
  sentiment TEXT DEFAULT 'neutral',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela para armazenar os ativos gerados pela IA
CREATE TABLE IF NOT EXISTS generated_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  brief_id uuid REFERENCES briefs(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL, -- 'logo', 'color_palette', 'copy', etc.
  asset_url TEXT,
  asset_data JSONB, -- Para armazenar dados estruturados (cores, textos, etc.)
  source_prompt TEXT,
  generation_params JSONB, -- Parâmetros usados na geração
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela para histórico de versões (para tags editáveis)
CREATE TABLE IF NOT EXISTS brief_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id uuid REFERENCES briefs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  keywords JSONB DEFAULT '[]'::jsonb,
  attributes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_briefs_project_id ON briefs(project_id);
CREATE INDEX IF NOT EXISTS idx_generated_assets_project_id ON generated_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_generated_assets_brief_id ON generated_assets(brief_id);
CREATE INDEX IF NOT EXISTS idx_brief_versions_brief_id ON brief_versions(brief_id);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers nas tabelas relevantes
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_briefs_updated_at BEFORE UPDATE ON briefs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security) - opcional, para segurança
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE generated_assets ENABLE ROW LEVEL SECURITY;

-- Exemplo de política para projects (descomente se usar autenticação)
-- CREATE POLICY "Users can only see their own projects" ON projects
--     FOR ALL USING (auth.uid() = user_id);