# Brand Co-Pilot MVP

MVP do projeto Brand Co-Pilot com a Fase 1 (Onboarding Semântico) implementada.

## Estrutura do Projeto

```
MWP/
├── main.py                 # Backend FastAPI
├── requirements.txt        # Dependências Python
├── .env                   # Variáveis de ambiente
├── frontend/              # Aplicação Next.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx   # Página principal
│   │   │   ├── layout.tsx # Layout da aplicação
│   │   │   └── globals.css
│   │   ├── components/ui/ # Componentes Shadcn UI
│   │   └── lib/
│   └── package.json
└── README.md
```

## Configuração e Execução

### 1. Backend (FastAPI)

1. Crie um ambiente virtual Python:
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

2. Instale as dependências:
```bash
pip install -r requirements.txt
```

3. Configure as variáveis de ambiente no arquivo `.env`:
```
SUPABASE_URL="sua_url_supabase_aqui"
SUPABASE_ANON_KEY="sua_chave_anon_supabase_aqui"
HUGGINGFACE_API_TOKEN="seu_token_huggingface_aqui"
```

4. Execute o servidor:
```bash
uvicorn main:app --reload
```

O backend estará disponível em: http://127.0.0.1:8000

### 2. Frontend (Next.js)

1. Navegue até o diretório frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

O frontend estará disponível em: http://localhost:3000

### 3. Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Vá em "Project Settings" > "API" e copie a URL e anon key
3. Cole os valores no arquivo `.env`
4. No SQL Editor do Supabase, execute o script para criar as tabelas:

```sql
-- Tabela para gerenciar projetos
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela para armazenar os briefings e suas análises
CREATE TABLE briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  raw_text TEXT,
  analyzed_keywords JSONB,
  analyzed_attributes JSONB
);

-- Tabela para armazenar os ativos gerados pela IA
CREATE TABLE generated_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  asset_type TEXT,
  asset_url TEXT,
  source_prompt TEXT
);
```

## Funcionalidades Implementadas

### Fase 1: Onboarding Semântico
- Interface para inserção de briefing do cliente
- Análise automática usando modelos de IA da Hugging Face
- Extração de palavras-chave e atributos de marca
- Exibição de tags editáveis com os resultados da análise

## Tecnologias Utilizadas

### Backend
- **FastAPI**: Framework web moderno e rápido
- **Transformers**: Biblioteca para modelos de IA/NLP
- **Supabase**: Banco de dados e autenticação
- **Python-dotenv**: Gerenciamento de variáveis de ambiente

### Frontend
- **Next.js 14**: Framework React com App Router
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Framework de CSS utilitário
- **Shadcn UI**: Componentes de interface modernos

## APIs Disponíveis

### POST /analyze-brief
Analisa um briefing de texto e extrai palavras-chave e atributos de marca.

**Request:**
```json
{
  "text": "Somos uma nova marca de café sustentável para a Geração Z..."
}
```

**Response:**
```json
{
  "keywords": ["café", "sustentável", "nova"],
  "attributes": ["moderno", "sustentável", "vibrante"]
}
```

## Próximos Passos

O MVP está pronto para demonstração e pode ser expandido com:
- Geração de logotipos com DALL-E
- Criação de paletas de cores
- Geração de copy para diferentes canais
- Integração completa com Supabase para persistência
- Autenticação de usuários