# 🚀 ROTEIRO DE DEMONSTRAÇÃO - MWP (HACKATHON)

## ⚡ Configuração Rápida (30 segundos)

### Backend
```bash
cd MWP
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd frontend
npm run dev
```

## 🎯 ROTEIRO DE PITCH (3 MINUTOS)

### 🎪 Gancho (0-30s)
"Branding premium depende da criatividade humana, mas o tempo é limitado. E se pudéssemos dar a cada designer o poder de mil brainstormings?"

**Ação:** Abrir homepage (localhost:3000)

### 🌌 Demonstração Ao Vivo (30-150s)

#### Fase 1: Onboarding Semântico (30-45s)
1. **Cole o briefing de exemplo:**
```
"Queremos criar uma marca para uma cafeteria sustentável e moderna no centro de São Paulo. 
Nosso público são profissionais jovens, de 25-40 anos, que valorizam qualidade, 
sustentabilidade e experiências autênticas. O ambiente deve transmitir inovação 
tecnológica mas com toque humano e aconchegante."
```

2. **Mostrar as tags extraídas rapidamente:** 
   - Keywords: cafeteria, sustentável, moderna, São Paulo, qualidade
   - Attributes: moderno, sustentável, jovem, premium, inovador

**Frase:** "A IA entendeu o briefing automaticamente"

#### Fase 2: Galáxia de Conceitos (45-75s)
1. **Clicar em "Gerar Galáxia"** - mostrar velocidade instantânea (URLs pré-geradas)
2. **Destacar os clusters visuais:**
   - Metáforas com imagens reais do Unsplash
   - Paletas de cores organizadas
   - Pares tipográficos

**Frase:** "Aqui está o universo de possibilidades - não é uma lista, é uma galáxia"

#### Fase 3: Tela de Curadoria - CLÍMAX (75-135s) ⭐
1. **Clicar em "Ir para Curadoria"**
2. **Demonstrar o "diálogo" Humano-IA:**
   - Arrastar imagem de café + geometria → Canvas
   - Arrastar paleta sustentável → Canvas
   - **Mostrar prompt dinâmico se atualizando:** "Criar identidade visual para 'marca' combinando..."
3. **Blend instantâneo:**
   - Selecionar 2 imagens
   - Clicar "Blend Imagens" → mostrar resultado em ~1 segundo (Pillow local)
4. **Aplicar cores:**
   - Selecionar imagem + paleta
   - Clicar "Aplicar Cores" → mostrar estilização instantânea

**Frase principal:** "Este não é um processo linear, é um diálogo. Eu dirijo, a IA pilota"

#### Fase 4: Kit Final (135-150s)
1. **Adicionar nome da marca:** "Verde Bytes"
2. **Clicar "Finalizar Kit"**
3. **Mostrar página brand-kit:**
   - Paleta organizada
   - Tipografia aplicada
   - Diretrizes profissionais
4. **Demonstrar download tangível** (arquivo é baixado)

**Frase:** "E aqui está o resultado tangível: um kit de marca pronto para usar"

### 🚀 Impacto e Encerramento (150-180s)
**Visão:** "Não estamos fazendo logos mais rápido. Estamos criando um futuro onde a IA aumenta a intuição humana. Cada designer agora tem acesso ao poder de exploração criativa que antes levaria semanas."

## ⚙️ CONFIGURAÇÕES TÉCNICAS PARA DEMO

### ✅ Otimizações Implementadas:
1. **URLs pré-geradas** para Fase 2 (anti-falha de API)
2. **Processamento local** com Pillow para blends rápidos
3. **Prompt dinâmico** atualizado em tempo real
4. **Assets pré-carregados** na Tela de Curadoria
5. **Download funcional** na Fase 4

### 🎛️ Modo Demo Ativado:
- `demo_mode: true` no backend
- URLs do Unsplash pré-carregadas
- Placeholders visuais para fallback
- Processamento offline prioritário

### ⚡ Comandos de Emergência:
Se algo falhar durante demo:
```bash
# Reiniciar backend rapidamente
python main.py

# Ver logs do frontend
npm run dev -- --verbose
```

## 📊 MÉTRICAS DE SUCESSO DA DEMO:
- [ ] Briefing → Tags em < 3s
- [ ] Galáxia gerada em < 2s  
- [ ] Blend de imagens em < 1s
- [ ] Aplicação de cores em < 1s
- [ ] Kit final gerado em < 3s
- [ ] Download funcional

## 🎯 PONTOS-CHAVE PARA JURADOS:
1. **Velocidade:** Demonstrar fluidez sem travamentos
2. **Inteligência:** IA entende contexto e gera relevante
3. **Interatividade:** Processo co-criativo real
4. **Tangibilidade:** Saída profissional pronta
5. **Diferencial:** Não é wrapper de API, é workflow inovador

---
**Tempo total de demo: 3 minutos**
**Preparação necessária: 1 minuto**
**Fator de risco: Baixo (tudo offline/pré-gerado)**