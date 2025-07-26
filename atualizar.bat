@echo off
echo ========================================
echo  ATUALIZANDO BRAND CO-PILOT v2.0
echo ========================================

echo.
echo 1. Adicionando arquivos ao git...
git add .

echo.
echo 2. Fazendo commit das melhorias...
git commit -m "feat: Implementar Fase 1 completa com sistema de projetos e tags editaveis

MELHORIAS PRINCIPAIS:
- Sistema completo de gerenciamento de projetos
- Tags editaveis com adicionar/remover funcionalidades
- Modelos de IA aprimorados (YAKE + RoBERTa)
- Integracao completa com Supabase
- API RESTful expandida com 6 endpoints
- Interface moderna e responsiva
- Persistencia de dados e historico
- Analise de sentimentos
- 24+ atributos de marca categorizados
- Validacao robusta e tratamento de erros
- Documentacao completa e exemplos

FASE 1 (ONBOARDING SEMANTICO): COMPLETA
Pronto para implementacao das proximas fases!"

echo.
echo 3. Fazendo push para o repositorio...
git push origin main

echo.
echo ========================================
echo  ATUALIZACAO CONCLUIDA!
echo ========================================
echo.
echo Fase 1 completa e disponivel em:
echo https://github.com/tjsasakifln/MWP
echo.
echo Proximos passos:
echo - Configurar Supabase com database_schema.sql
echo - Instalar dependencias: pip install -r requirements.txt
echo - Executar: uvicorn main:app --reload
echo.
pause