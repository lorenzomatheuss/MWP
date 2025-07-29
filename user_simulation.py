import random
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any

class UserSimulator:
    def __init__(self):
        self.user_profiles = self._generate_user_profiles()
        self.test_scenarios = []
        self.issues_found = []
        
    def _generate_user_profiles(self) -> List[Dict[str, Any]]:
        """Gera 100 perfis diferentes de usuários"""
        profiles = []
        
        # Tipos de empresa
        company_types = [
            "startup tecnológica", "consultoria", "e-commerce", "restaurante", 
            "clínica médica", "escritório de advocacia", "agência de marketing",
            "loja de roupas", "academia", "escola", "ONG", "freelancer designer",
            "empresa de construção", "salão de beleza", "pet shop", "farmácia",
            "contabilidade", "imobiliária", "transportadora", "floricultura"
        ]
        
        # Tamanhos de empresa
        company_sizes = ["micro", "pequena", "média", "grande"]
        
        # Níveis de experiência digital
        digital_experience = ["iniciante", "intermediário", "avançado", "expert"]
        
        # Orçamentos
        budgets = ["muito baixo", "baixo", "médio", "alto", "ilimitado"]
        
        # Urgência do projeto
        urgency_levels = ["baixa", "média", "alta", "crítica"]
        
        # Dispositivos preferenciais
        devices = ["mobile", "desktop", "tablet", "híbrido"]
        
        # Conexões de internet
        connections = ["lenta", "média", "rápida", "muito rápida"]
        
        # Idiomas
        languages = ["português", "inglês", "espanhol", "italiano", "francês"]
        
        for i in range(100):
            profile = {
                "id": f"user_{i+1:03d}",
                "company_type": random.choice(company_types),
                "company_size": random.choice(company_sizes),
                "digital_experience": random.choice(digital_experience),
                "budget": random.choice(budgets),
                "urgency": random.choice(urgency_levels),
                "primary_device": random.choice(devices),
                "connection_speed": random.choice(connections),
                "language": random.choice(languages),
                "accessibility_needs": random.choice([True, False]) if random.random() < 0.15 else False,
                "team_size": random.randint(1, 50),
                "brand_maturity": random.choice(["nova marca", "rebrand", "atualização", "expansão"]),
                "tech_savvy": random.uniform(0.1, 1.0),
                "patience_level": random.uniform(0.2, 1.0),
                "detail_oriented": random.uniform(0.3, 1.0),
                "risk_tolerance": random.uniform(0.1, 0.9)
            }
            profiles.append(profile)
            
        return profiles
    
    def _simulate_phase1(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Simula Fase 1: Semantic Onboarding"""
        phase_result = {
            "actions": [],
            "issues": [],
            "success": True,
            "completion_time": 0
        }
        
        # Ação 1: Criar projeto
        phase_result["actions"].append({
            "action": "create_project",
            "timestamp": datetime.now().isoformat(),
            "success": True
        })
        
        # Simular problemas baseados no perfil
        if user_profile["digital_experience"] == "iniciante":
            if random.random() < 0.3:
                phase_result["issues"].append({
                    "issue": "Usuário iniciante teve dificuldade para entender como criar projeto",
                    "cause": "Interface não intuitiva para usuários inexperientes",
                    "solution": "Adicionar tutorial interativo ou wizard de primeiros passos",
                    "severity": "medium",
                    "user_impact": "Aumenta tempo de onboarding e pode causar abandono"
                })
        
        # Ação 2: Upload de documento ou texto
        upload_success = True
        if user_profile["connection_speed"] == "lenta":
            if random.random() < 0.4:
                upload_success = False
                phase_result["issues"].append({
                    "issue": "Timeout no upload de documento devido à conexão lenta",
                    "cause": "Sistema não otimizado para conexões lentas",
                    "solution": "Implementar upload progressivo e compressão de arquivos",
                    "severity": "high",
                    "user_impact": "Impede progresso e frustra usuários com conexão limitada"
                })
        
        # Ação 3: Análise de briefing
        if upload_success:
            analysis_quality = random.uniform(0.3, 1.0)
            if analysis_quality < 0.6:
                phase_result["issues"].append({
                    "issue": "Análise de keywords e atributos imprecisa",
                    "cause": "Modelo YAKE não treinado para contexto específico do usuário",
                    "solution": "Implementar fine-tuning contextual e validação manual",
                    "severity": "medium",
                    "user_impact": "Reduz qualidade dos resultados finais"
                })
            
            phase_result["actions"].append({
                "action": "analyze_brief",
                "success": upload_success,
                "quality_score": analysis_quality
            })
        else:
            phase_result["success"] = False
            
        return phase_result
    
    def _simulate_phase2(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Simula Fase 2: Strategic Analysis"""
        phase_result = {
            "actions": [],
            "issues": [],
            "success": True
        }
        
        # Ação: Análise estratégica
        if user_profile["detail_oriented"] > 0.7:
            # Usuários detalhistas podem questionar os resultados
            if random.random() < 0.25:
                phase_result["issues"].append({
                    "issue": "Usuário detalhista insatisfeito com análise superficial",
                    "cause": "Falta de explicação sobre metodologia de análise",
                    "solution": "Adicionar seção explicativa sobre processo e permitir ajustes manuais",
                    "severity": "medium",
                    "user_impact": "Reduz confiança no sistema"
                })
        
        # Problemas com tensões criativas
        if user_profile["company_type"] in ["clínica médica", "escritório de advocacia", "farmácia"]:
            if random.random() < 0.35:
                phase_result["issues"].append({
                    "issue": "Tensões criativas inadequadas para setor conservador",
                    "cause": "Sistema não considera especificidades setoriais",
                    "solution": "Implementar perfis setoriais pré-definidos",
                    "severity": "high",
                    "user_impact": "Gera conceitos inadequados para o negócio"
                })
        
        # Usuários não técnicos podem ter dificuldade com sliders
        if user_profile["tech_savvy"] < 0.4:
            if random.random() < 0.4:
                phase_result["issues"].append({
                    "issue": "Interface de tensões criativas confusa para usuários não técnicos",
                    "cause": "Conceitos abstratos apresentados sem contexto adequado",
                    "solution": "Usar exemplos visuais e linguagem mais simples",
                    "severity": "medium",
                    "user_impact": "Usuário pode configurar incorretamente"
                })
        
        phase_result["actions"].append({
            "action": "strategic_analysis",
            "success": True
        })
        
        return phase_result
    
    def _simulate_phase3(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Simula Fase 3: Visual Concepts Generation"""
        phase_result = {
            "actions": [],
            "issues": [],
            "success": True
        }
        
        # Problemas com geração de imagens
        if random.random() < 0.2:  # 20% chance de falha na API
            phase_result["issues"].append({
                "issue": "Falha na geração de conceitos visuais (DALL-E API down)",
                "cause": "Dependência externa não disponível",
                "solution": "Implementar fallbacks e cache de imagens pré-geradas",
                "severity": "critical",
                "user_impact": "Bloqueia progresso completamente"
            })
            phase_result["success"] = False
            return phase_result
        
        # Qualidade dos conceitos
        concept_quality = random.uniform(0.4, 0.95)
        if concept_quality < 0.6:
            phase_result["issues"].append({
                "issue": "Conceitos visuais gerados não alinham com expectativas",
                "cause": "Prompts de geração não otimizados para contexto específico",
                "solution": "Melhorar engenharia de prompts e adicionar refinamento iterativo",
                "severity": "medium",
                "user_impact": "Necessita regeneração múltipla"
            })
        
        # Usuários de mobile podem ter problemas de performance
        if user_profile["primary_device"] == "mobile":
            if random.random() < 0.3:
                phase_result["issues"].append({
                    "issue": "Performance lenta ao carregar conceitos visuais em mobile",
                    "cause": "Imagens não otimizadas para dispositivos móveis",
                    "solution": "Implementar lazy loading e redimensionamento adaptativo",
                    "severity": "medium",
                    "user_impact": "Experiência frustante em dispositivos móveis"
                })
        
        # Problema com seleção de conceitos
        if user_profile["decision_making_style"] == "indeciso":
            if random.random() < 0.6:
                phase_result["issues"].append({
                    "issue": "Usuário indeciso não consegue escolher entre conceitos",
                    "cause": "Falta de critérios claros para comparação",
                    "solution": "Adicionar ferramenta de comparação lado a lado com critérios",
                    "severity": "low",
                    "user_impact": "Aumenta tempo de decisão"
                })
        
        phase_result["actions"].append({
            "action": "generate_visual_concepts",
            "success": True,
            "quality_score": concept_quality
        })
        
        return phase_result
    
    def _simulate_phase4(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Simula Fase 4: Brand Kit Generation"""
        phase_result = {
            "actions": [],
            "issues": [],
            "success": True
        }
        
        # Problemas com geração do kit
        if user_profile["budget"] == "muito baixo":
            if random.random() < 0.4:
                phase_result["issues"].append({
                    "issue": "Kit gerado com recursos limitados devido a restrições de budget",
                    "cause": "Sistema não diferencia níveis de serviço por orçamento",
                    "solution": "Criar tiers de funcionalidades baseados em orçamento",
                    "severity": "medium",
                    "user_impact": "Expectativas não atendidas"
                })
        
        # Download de assets
        download_success = True
        if user_profile["connection_speed"] == "lenta":
            if random.random() < 0.5:
                download_success = False
                phase_result["issues"].append({
                    "issue": "Falha no download do kit completo",
                    "cause": "Arquivos muito grandes para conexões lentas",
                    "solution": "Oferecer downloads separados e compressão",
                    "severity": "medium",
                    "user_impact": "Usuário não consegue acessar resultado final"
                })
        
        # Problemas com formatos de arquivo
        if user_profile["digital_experience"] == "iniciante":
            if random.random() < 0.3:
                phase_result["issues"].append({
                    "issue": "Usuário não sabe como usar arquivos gerados",
                    "cause": "Falta de instruções sobre uso dos assets",
                    "solution": "Incluir guia de uso e tutoriais no kit",
                    "severity": "medium",
                    "user_impact": "Valor do produto não é realizado"
                })
        
        phase_result["actions"].append({
            "action": "generate_brand_kit",
            "success": download_success
        })
        
        if not download_success:
            phase_result["success"] = False
        
        return phase_result
    
    def simulate_user_behavior(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Simula comportamento específico baseado no perfil do usuário"""
        simulation_result = {
            "user_id": user_profile["id"],
            "profile": user_profile,
            "actions": [],
            "issues_encountered": [],
            "completion_status": "pending",
            "time_spent": 0,
            "errors": [],
            "successful_steps": []
        }
        
        # Simular Fase 1: Semantic Onboarding
        phase1_result = self._simulate_phase1(user_profile)
        simulation_result["actions"].extend(phase1_result["actions"])
        simulation_result["issues_encountered"].extend(phase1_result["issues"])
        
        if phase1_result["success"]:
            simulation_result["successful_steps"].append("phase1")
            
            # Simular Fase 2: Strategic Analysis
            phase2_result = self._simulate_phase2(user_profile)
            simulation_result["actions"].extend(phase2_result["actions"])
            simulation_result["issues_encountered"].extend(phase2_result["issues"])
            
            if phase2_result["success"]:
                simulation_result["successful_steps"].append("phase2")
                
                # Simular Fase 3: Visual Concepts
                phase3_result = self._simulate_phase3(user_profile)
                simulation_result["actions"].extend(phase3_result["actions"])
                simulation_result["issues_encountered"].extend(phase3_result["issues"])
                
                if phase3_result["success"]:
                    simulation_result["successful_steps"].append("phase3")
                    
                    # Simular Fase 4: Brand Kit
                    phase4_result = self._simulate_phase4(user_profile)
                    simulation_result["actions"].extend(phase4_result["actions"])
                    simulation_result["issues_encountered"].extend(phase4_result["issues"])
                    
                    if phase4_result["success"]:
                        simulation_result["successful_steps"].append("phase4")
                        simulation_result["completion_status"] = "completed"
        
        # Calcular tempo total baseado no perfil
        base_time = 30  # 30 minutos base
        if user_profile["digital_experience"] == "iniciante":
            base_time *= 2.5
        elif user_profile["digital_experience"] == "intermediário":
            base_time *= 1.5
        elif user_profile["digital_experience"] == "expert":
            base_time *= 0.7
            
        if user_profile["connection_speed"] == "lenta":
            base_time *= 1.8
        elif user_profile["connection_speed"] == "muito rápida":
            base_time *= 0.8
            
        simulation_result["time_spent"] = base_time + random.uniform(-10, 15)
        
        return simulation_result
    
    def simulate_all_users(self) -> Dict[str, Any]:
        """Executa simulação para todos os 100 usuários"""
        results = {
            "total_users": len(self.user_profiles),
            "simulations": [],
            "summary": {
                "completed": 0,
                "partial_completion": 0,
                "failed": 0,
                "common_issues": {},
                "avg_completion_time": 0,
                "success_rate_by_phase": {
                    "phase1": 0,
                    "phase2": 0,
                    "phase3": 0,
                    "phase4": 0
                }
            },
            "critical_issues": [],
            "recommendations": []
        }
        
        print("🚀 Iniciando simulação para 100 usuários...")
        
        for i, user_profile in enumerate(self.user_profiles):
            print(f"👤 Simulando usuário {i+1}/100: {user_profile['company_type']}")
            
            simulation = self.simulate_user_behavior(user_profile)
            results["simulations"].append(simulation)
            
            # Atualizar estatísticas
            if simulation["completion_status"] == "completed":
                results["summary"]["completed"] += 1
            elif len(simulation["successful_steps"]) > 0:
                results["summary"]["partial_completion"] += 1
            else:
                results["summary"]["failed"] += 1
            
            # Contar sucessos por fase
            for phase in simulation["successful_steps"]:
                results["summary"]["success_rate_by_phase"][phase] += 1
            
            # Coletar issues comuns
            for issue in simulation["issues_encountered"]:
                issue_key = issue["issue"]
                if issue_key in results["summary"]["common_issues"]:
                    results["summary"]["common_issues"][issue_key] += 1
                else:
                    results["summary"]["common_issues"][issue_key] = 1
                
                # Identificar issues críticos
                if issue["severity"] == "critical":
                    results["critical_issues"].append(issue)
        
        # Calcular médias
        total_time = sum(sim["time_spent"] for sim in results["simulations"])
        results["summary"]["avg_completion_time"] = total_time / len(results["simulations"])
        
        # Calcular taxas de sucesso por fase
        for phase in results["summary"]["success_rate_by_phase"]:
            rate = results["summary"]["success_rate_by_phase"][phase] / len(self.user_profiles)
            results["summary"]["success_rate_by_phase"][phase] = round(rate * 100, 2)
        
        # Gerar recomendações
        results["recommendations"] = self._generate_recommendations(results)
        
        return results
    
    def _generate_recommendations(self, results: Dict[str, Any]) -> List[Dict[str, str]]:
        """Gera recomendações baseadas nos resultados da simulação"""
        recommendations = []
        
        # Issues mais comuns
        common_issues = sorted(
            results["summary"]["common_issues"].items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:5]
        
        for issue, count in common_issues:
            if count > 10:  # Se afeta mais de 10% dos usuários
                recommendations.append({
                    "priority": "high",
                    "issue": issue,
                    "recommendation": f"Priorizar correção - afeta {count}% dos usuários",
                    "impact": "high"
                })
        
        # Issues críticos
        if len(results["critical_issues"]) > 0:
            unique_critical = set(issue["issue"] for issue in results["critical_issues"])
            for critical in unique_critical:
                recommendations.append({
                    "priority": "critical",
                    "issue": critical,
                    "recommendation": "Correção imediata necessária - bloqueia funcionalidade",
                    "impact": "critical"
                })
        
        # Taxa de sucesso baixa em fases
        for phase, rate in results["summary"]["success_rate_by_phase"].items():
            if rate < 80:
                recommendations.append({
                    "priority": "medium",
                    "issue": f"Taxa de sucesso baixa na {phase}: {rate}%",
                    "recommendation": f"Investigar e melhorar fluxo da {phase}",
                    "impact": "medium"
                })
        
        return recommendations

if __name__ == "__main__":
    # Executar simulação
    simulator = UserSimulator()
    
    # Adicionar alguns atributos adicionais baseados no perfil
    for profile in simulator.user_profiles:
        # Estilo de tomada de decisão
        if profile["detail_oriented"] > 0.7:
            decision_style = "meticuloso"
        elif profile["risk_tolerance"] > 0.7:
            decision_style = "impulsivo"
        elif profile["patience_level"] < 0.4:
            decision_style = "apressado"
        else:
            decision_style = "equilibrado"
        
        profile["decision_making_style"] = decision_style
    
    results = simulator.simulate_all_users()
    
    # Salvar resultados
    with open('/mnt/d/Hackathon 2025/MWP/simulation_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"\n✅ Simulação concluída!")
    print(f"📊 Resultados salvos em simulation_results.json")
    print(f"👥 Total de usuários: {results['total_users']}")
    print(f"✅ Completaram: {results['summary']['completed']}")
    print(f"⚠️  Parcialmente: {results['summary']['partial_completion']}")
    print(f"❌ Falharam: {results['summary']['failed']}")
    print(f"⏱️ Tempo médio: {results['summary']['avg_completion_time']:.1f} min")