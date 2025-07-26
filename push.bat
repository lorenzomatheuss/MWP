@echo off
echo Fazendo commit e push das melhorias...

git add .
git commit -m "fix: otimizar deploy removendo dependencias pesadas

- Removido PyTorch e Transformers do requirements.txt
- Implementado fallbacks leves para analise de atributos
- Analise de sentimento baseada em keywords
- Criado .dockerignore para otimizar build
- Mantido YAKE para extracao de palavras-chave
- README atualizado com estado atual do sistema
- Deploy otimizado para plataformas cloud"

git push origin main

echo.
echo Push concluido! Verifique em:
echo https://github.com/tjsasakifln/MWP
pause