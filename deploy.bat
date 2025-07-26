@echo off
echo Inicializando repositorio Git...
git init

echo Adicionando remote origin...
git remote add origin https://github.com/tjsasakifln/MWP.git

echo Adicionando todos os arquivos...
git add .

echo Fazendo commit...
git commit -m "feat: Implementar MVP do Brand Co-Pilot com Fase 1 (Onboarding Semantico)

- Criar backend FastAPI com analise de briefing usando IA
- Implementar frontend Next.js 14 com interface moderna
- Adicionar componentes Shadcn UI para interface
- Configurar integracao com Supabase e Hugging Face
- Implementar extracao de palavras-chave e atributos de marca
- Adicionar documentacao completa no README"

echo Fazendo push para o repositorio...
git branch -M main
git push -u origin main

echo Deploy concluido!
pause