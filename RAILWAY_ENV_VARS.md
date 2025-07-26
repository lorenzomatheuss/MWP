# Variáveis de Ambiente Necessárias no Railway

Para corrigir os erros de deploy, configure as seguintes variáveis de ambiente no painel do Railway:

## Variáveis Obrigatórias

### 1. Python Version Fix
- **Nome:** `NIXPACKS_PYTHON_VERSION`
- **Valor:** `3.11`
- **Motivo:** Força o uso do Python 3.11 que contém o módulo `distutils`

### 2. Supabase Configuration
- **Nome:** `SUPABASE_URL`
- **Valor:** `https://seu-projeto.supabase.co`
- **Motivo:** URL do seu projeto Supabase

- **Nome:** `SUPABASE_ANON_KEY`
- **Valor:** Sua chave anônima do Supabase
- **Motivo:** Chave de autenticação para acessar o Supabase

### 3. HuggingFace (Opcional)
- **Nome:** `HUGGINGFACE_API_TOKEN`
- **Valor:** Seu token da HuggingFace
- **Motivo:** Para modelos de IA (opcional no deploy atual)

## Como Configurar no Railway

1. Acesse o painel do Railway
2. Selecione seu projeto
3. Clique no serviço do backend
4. Vá para a aba "Variables"
5. Adicione cada variável acima
6. Clique em "Deploy" para aplicar as mudanças

## Arquivos Relacionados

- `railway.json` - Configuração de build e deploy
- `.env` - Arquivo local (não usado no Railway)
- `main.py` - Código que usa as variáveis

## Status das Correções

✅ Validação de variáveis de ambiente adicionada no código
✅ railway.json atualizado com NIXPACKS_PYTHON_VERSION
✅ Documentação criada