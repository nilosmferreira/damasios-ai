# ✅ Sistema de Controle Financeiro - Basketball Pick-up Game

## 📋 Checklist de Requisitos Funcionais e Não Funcionais

### 🎯 **Progresso Geral**

- [ ] **0/25** Requisitos Funcionais Implementados
- [ ] **0/6** Requisitos Não Funcionais Implementados

---

## 👥 **4.1. Gestão de Atletas**

### ✅ **RF001** - Registro de Atletas

- [ ] **Action**: Função `action` para processar cadastro de atletas
- [ ] **Frontend**: Formulário de cadastro (nome, tipo cobrança, posições preferidas)
- [ ] **Validação**: Schema Zod para validação de dados no action
- [ ] **Database**: Schema Prisma implementado ✅
- [ ] **Testes**: Validação de dados e fluxo completo

**Critérios de Aceite:**

- Sistema permite cadastrar atleta com nome, tipo de cobrança e posições
- Validação impede cadastro com dados inválidos
- Atleta é associado automaticamente a um usuário

### ✅ **RF002** - Edição de Dados de Atletas

- [ ] **Action**: Função `action` para atualização de atletas
- [ ] **Frontend**: Formulário de edição de dados
- [ ] **Validação**: Schema Zod para edição no action
- [ ] **Database**: Relacionamentos implementados ✅
- [ ] **Testes**: Edição de diferentes campos

**Critérios de Aceite:**

- Coordenador pode editar nome, tipo cobrança e posições
- Mudanças são persistidas corretamente
- Interface mostra dados atualizados imediatamente

### ✅ **RF003** - Ativação/Inativação de Atletas

- [ ] **Action**: Função `action` para toggle de status ativo
- [ ] **Frontend**: Interface para ativar/inativar atletas
- [ ] **Lógica**: Atletas inativos não aparecem em listas ativas (loader)
- [ ] **Database**: Campo `isActive` implementado ✅
- [ ] **Testes**: Comportamento de atletas inativos

**Critérios de Aceite:**

- Atletas inativos não aparecem em confirmações de partida
- Atletas inativos não são incluídos no sorteio
- Status é claramente indicado na interface

### ✅ **RF004** - Listagem de Atletas

- [ ] **Loader**: Função `loader` com filtros e paginação
- [ ] **Frontend**: Lista com dados dos atletas ✅ (parcial)
- [ ] **Filtros**: Por status ativo/inativo, tipo cobrança
- [ ] **Database**: Queries otimizadas implementadas ✅
- [ ] **Testes**: Diferentes cenários de filtros

**Critérios de Aceite:**

- Lista exibe todos os dados relevantes do atleta
- Filtros funcionam corretamente
- Performance adequada com muitos atletas

---

## 🏀 **4.2. Gestão de Partidas**

### ✅ **RF005** - Cadastro de Partidas

- [ ] **Action**: Função `action` para criação de partidas
- [ ] **Frontend**: Formulário de cadastro (local, data, hora)
- [ ] **Validação**: Schema Zod para dados de partida no action
- [ ] **Database**: Schema implementado ✅
- [ ] **Testes**: Criação com diferentes cenários

**Critérios de Aceite:**

- Partida requer local obrigatório
- Data e hora são validadas (não pode ser no passado)
- Local pode ser reutilizado ou criado novo

### ✅ **RF006** - Edição de Partidas

- [ ] **Action**: Função `action` para atualização de partidas
- [ ] **Frontend**: Formulário de edição
- [ ] **Validação**: Regras para edição de partidas com confirmações
- [ ] **Database**: Relacionamentos preservados ✅
- [ ] **Testes**: Edição com e sem confirmações

**Critérios de Aceite:**

- Partidas podem ser editadas antes das confirmações
- Alterações notificam atletas confirmados (futuro)
- Validações impedem edições inválidas

### ✅ **RF007** - Listagem de Partidas

- [ ] **Loader**: Função `loader` com filtros por data
- [ ] **Frontend**: Lista de partidas futuras e passadas
- [ ] **Filtros**: Por período, local, status
- [ ] **Database**: Queries otimizadas ✅
- [ ] **Testes**: Diferentes filtros e ordenações

**Critérios de Aceite:**

- Lista mostra dados essenciais da partida
- Filtros permitem encontrar partidas específicas
- Indica número de confirmações por partida

### ✅ **RF008** - Confirmação de Presença (Atleta)

- [ ] **Action**: Função `action` para confirmação de presença
- [ ] **Frontend**: Interface para atletas confirmarem
- [ ] **Autenticação**: Apenas atletas podem confirmar (middleware)
- [ ] **Database**: Constraint única implementada ✅
- [ ] **Testes**: Confirmação e cancelamento

**Critérios de Aceite:**

- Atleta pode confirmar/cancelar presença
- Sistema impede confirmações duplicadas
- Status de confirmação é visível para coordenador

### ✅ **RF009** - Lista de Atletas Confirmados

- [ ] **Loader**: Função `loader` para atletas confirmados por partida
- [ ] **Frontend**: Visualização dos confirmados
- [ ] **Dados**: Inclui informações relevantes do atleta
- [ ] **Database**: Queries com joins implementadas ✅
- [ ] **Testes**: Lista com diferentes cenários

**Critérios de Aceite:**

- Lista mostra atletas confirmados para partida específica
- Inclui dados como posições preferidas e tipo cobrança
- Permite acesso rápido ao sorteio de quintetos

### ✅ **RF010** - Registro de Participação Efetiva

- [ ] **Action**: Função `action` para registrar participação real
- [ ] **Frontend**: Interface para marcar quem jogou
- [ ] **Lógica**: Apenas confirmados podem participar
- [ ] **Database**: Relacionamentos implementados ✅
- [ ] **Integração**: Trigger automático para pendência financeira

**Critérios de Aceite:**

- Apenas atletas confirmados podem ser marcados como participantes
- Participação efetiva gera pendência para diaristas
- Sistema previne participações duplicadas

---

## 💰 **4.3. Controle Financeiro**

### ✅ **RF011** - Geração Automática de Pendência (Diaristas)

- [ ] **Server Function**: Função serverless para trigger após participação
- [ ] **Lógica**: Cálculo automático do valor da diária
- [ ] **Configuração**: Valor da diária configurável (.env)
- [ ] **Database**: Schema implementado ✅
- [ ] **Testes**: Geração em diferentes cenários

**Critérios de Aceite:**

- Pendência criada automaticamente após participação
- Valor calculado corretamente
- Data de vencimento definida adequadamente

### ✅ **RF012** - Geração Automática de Pendência (Mensalistas)

- [ ] **Cron Job**: Job automático no dia 10 de cada mês (servidor)
- [ ] **Lógica**: Apenas para mensalistas ativos
- [ ] **Configuração**: Valor da mensalidade configurável (.env)
- [ ] **Database**: Schema implementado ✅
- [ ] **Testes**: Execução mensal e edge cases

**Critérios de Aceite:**

- Pendências mensais geradas automaticamente
- Apenas mensalistas ativos são incluídos
- Sistema evita duplicações no mesmo mês

### ✅ **RF013** - Registro de Pagamentos

- [ ] **Action**: Função `action` para quitar pendências
- [ ] **Frontend**: Interface para registrar pagamentos
- [ ] **Validação**: Confirmação antes de quitar
- [ ] **Database**: Update de status implementado ✅
- [ ] **Integração**: Registro automático no fluxo de caixa

**Critérios de Aceite:**

- Pagamento atualiza status da pendência
- Data de pagamento é registrada
- Entrada é registrada automaticamente no fluxo de caixa

### ✅ **RF014** - Status de Pendências Financeiras

- [ ] **Loader**: Função `loader` com filtros por status e atleta
- [ ] **Frontend**: Dashboard de pendências
- [ ] **Filtros**: Por status, atleta, período
- [ ] **Database**: Queries otimizadas ✅
- [ ] **Relatórios**: Resumos por atleta e período

**Critérios de Aceite:**

- Lista mostra todas as pendências com detalhes
- Filtros permitem localizar pendências específicas
- Totais são calculados corretamente

### ✅ **RF015** - Registro de Entradas de Caixa

- [ ] **Action**: Função `action` para registrar entradas
- [ ] **Frontend**: Formulário de entrada manual
- [ ] **Categorização**: Tipos de entrada (mensalidade, diária, outros)
- [ ] **Database**: Schema CashFlow implementado ✅
- [ ] **Testes**: Diferentes tipos de entrada

**Critérios de Aceite:**

- Entradas podem ser registradas manualmente
- Descrição obrigatória para rastreabilidade
- Valor sempre positivo para entradas

### ✅ **RF016** - Registro de Saídas de Caixa

- [ ] **Action**: Função `action` para registrar saídas
- [ ] **Frontend**: Formulário de saída
- [ ] **Categorização**: Tipos de saída (aluguel, árbitro, zelador, etc.)
- [ ] **Database**: Schema CashFlow implementado ✅
- [ ] **Testes**: Diferentes tipos de saída

**Critérios de Aceite:**

- Saídas podem ser registradas com descrição
- Valor sempre positivo (tipo OUTFLOW define a direção)
- Categorização facilita relatórios

### ✅ **RF017** - Relatório Mensal de Fluxo de Caixa

- [ ] **Loader**: Função `loader` para relatório por período
- [ ] **Frontend**: Dashboard com gráficos e totais
- [ ] **Cálculos**: Entradas, saídas e saldo do período
- [ ] **Database**: Queries agregadas otimizadas ✅
- [ ] **Export**: Possibilidade de exportar dados

**Critérios de Aceite:**

- Relatório calcula corretamente entradas e saídas
- Saldo do período é preciso
- Interface clara e informativa

### ✅ **RF018** - Transferência de Saldo Mensal

- [ ] **Server Function**: Função para fechamento mensal
- [ ] **Lógica**: Saldo anterior + movimentação = novo saldo
- [ ] **Auditoria**: Log de fechamentos mensais
- [ ] **Database**: Estrutura para saldos históricos
- [ ] **Testes**: Cenários de fechamento

**Critérios de Aceite:**

- Saldo é transferido automaticamente
- Histórico de saldos é mantido
- Processo é auditável

---

## 🔀 **4.4. Sorteio de Quintetos**

### ✅ **RF019** - Sorteio de Quintetos

- [ ] **Server Function**: Algoritmo de sorteio baseado em confirmações
- [ ] **Frontend**: Interface para executar sorteio
- [ ] **Lógica**: Considera atletas confirmados para a partida
- [ ] **Database**: Queries para atletas confirmados ✅
- [ ] **Testes**: Diferentes números de atletas

**Critérios de Aceite:**

- Sorteio usa apenas atletas confirmados
- Quintetos são balanceados por número
- Algoritmo é justo e aleatório

### ✅ **RF020** - Priorização de Mensalistas

- [ ] **Algoritmo**: Mensalistas têm prioridade na formação
- [ ] **Lógica**: Diaristas preenchem vagas restantes
- [ ] **Frontend**: Indicação visual de priorização
- [ ] **Database**: Consulta por tipo de cobrança ✅
- [ ] **Testes**: Cenários com diferentes proporções

**Critérios de Aceite:**

- Mensalistas são distribuídos primeiro
- Diaristas completam os quintetos
- Lógica é transparente para o usuário

### ✅ **RF021** - Distribuição por Posições

- [ ] **Algoritmo**: Distribuição ideal por posição
- [ ] **Lógica**: 1 armador, 2 alas, 2 pivôs por quinteto
- [ ] **Flexibilidade**: Adaptação quando posições faltam
- [ ] **Database**: Consulta posições preferidas ✅
- [ ] **Testes**: Diferentes combinações de posições

**Critérios de Aceite:**

- Quintetos respeitam distribuição ideal quando possível
- Sistema adapta quando posições específicas faltam
- Balanceamento é preservado

### ✅ **RF022** - Exibição de Quintetos Sugeridos

- [ ] **Frontend**: Interface clara com quintetos formados
- [ ] **Visualização**: Posições e tipos de cobrança visíveis
- [ ] **Ações**: Possibilidade de re-sortear ou ajustar
- [ ] **Persistência**: Salvar quintetos finais (opcional)
- [ ] **Testes**: Diferentes layouts e tamanhos

**Critérios de Aceite:**

- Quintetos são exibidos de forma clara
- Informações relevantes são mostradas
- Interface permite ajustes se necessário

---

## 👤 **4.5. Gestão de Usuários e Acesso**

### ✅ **RF023** - Cadastro de Usuários

- [ ] **Action**: Função `action` para criação de usuários
- [ ] **Frontend**: Formulário de cadastro (admin apenas)
- [ ] **Segurança**: Hash de senhas (bcrypt)
- [ ] **Database**: Schema User implementado ✅
- [ ] **Testes**: Criação de diferentes tipos de usuário

**Critérios de Aceite:**

- Apenas administradores podem criar usuários
- Senhas são hashadas adequadamente
- Emails são únicos no sistema

### ✅ **RF024** - Autenticação de Usuários

- [ ] **Session**: Sistema de sessões do React Router v7
- [ ] **Frontend**: Formulário de login
- [ ] **Segurança**: Proteção contra ataques comuns
- [ ] **Database**: Verificação de credenciais ✅
- [ ] **Testes**: Login válido e inválido

**Critérios de Aceite:**

- Login funciona com email e senha
- Sessões são gerenciadas adequadamente
- Senhas incorretas são rejeitadas

### ✅ **RF025** - Controle de Acesso por Perfil

- [ ] **Middleware**: Middleware de autorização nas rotas
- [ ] **Frontend**: Interface adaptada por perfil
- [ ] **Roles**: ADMINISTRADOR vs ATLETA
- [ ] **Database**: Enum UserRole implementado ✅
- [ ] **Testes**: Acesso negado para funções não permitidas

**Critérios de Aceite:**

- Administradores têm acesso completo
- Atletas veem apenas suas funcionalidades
- Tentativas de acesso não autorizado são bloqueadas

---

## 🔧 **5. Requisitos Não Funcionais**

### ⚡ **RNF001 - Usabilidade**

- [ ] **Design**: Interface intuitiva e responsiva
- [ ] **UX**: Fluxos simples para tarefas comuns
- [ ] **Acessibilidade**: Suporte a leitores de tela
- [ ] **Mobile**: Interface adaptada para dispositivos móveis
- [ ] **Testes**: Usabilidade com usuários reais

### 🚀 **RNF002 - Performance**

- [ ] **SSR**: Tempo de resposta < 500ms para 95% das requests
- [ ] **Frontend**: First Contentful Paint < 1.5s
- [ ] **Database**: Queries otimizadas com índices
- [ ] **Caching**: Estratégia de cache para loaders
- [ ] **Testes**: Load testing com cenários reais

### 🔒 **RNF003 - Segurança**

- [ ] **Autenticação**: Sessions seguras do React Router
- [ ] **Autorização**: Controle granular de acesso em loaders/actions
- [ ] **Senhas**: Hash com salt (bcrypt)
- [ ] **HTTPS**: Comunicação criptografada
- [ ] **Testes**: Penetration testing básico

### 🛡️ **RNF004 - Confiabilidade**

- [ ] **Error Handling**: Error boundaries e tratamento em actions/loaders
- [ ] **Logging**: Logs estruturados para debugging
- [ ] **Monitoring**: Monitoramento de saúde da aplicação SSR
- [ ] **Backup**: Estratégia de backup de dados
- [ ] **Testes**: Cenários de falha e recuperação

### 🔧 **RNF005 - Manutenibilidade**

- [ ] **Código**: Padrões de clean code
- [ ] **Documentação**: README e docs técnicas
- [ ] **Testes**: Cobertura mínima de 80%
- [ ] **TypeScript**: Tipagem rigorosa para loaders/actions
- [ ] **Linting**: ESLint e Prettier configurados

### 📈 **RNF006 - Escalabilidade**

- [ ] **Database**: Índices para queries frequentes
- [ ] **SSR**: Design escalável de loaders/actions
- [ ] **Containerização**: Docker para deployment
- [ ] **Arquitetura**: Separação clara de responsabilidades
- [ ] **Testes**: Performance com volume crescente

---

## 🎯 **Roadmap de Implementação Sugerido**

### **Fase 1: Base e Autenticação** (Semana 1-2)

- [ ] RF024, RF025 - Sistema de autenticação com sessions
- [ ] RF023 - Cadastro de usuários (actions)
- [ ] RNF003 - Segurança básica (middleware)

### **Fase 2: Gestão de Atletas** (Semana 3)

- [ ] RF001, RF002, RF003, RF004 - CRUD completo com loaders/actions

### **Fase 3: Gestão de Partidas** (Semana 4-5)

- [ ] RF005, RF006, RF007 - CRUD de partidas (loaders/actions)
- [ ] RF008, RF009 - Sistema de confirmações

### **Fase 4: Controle Financeiro** (Semana 6-7)

- [ ] RF015, RF016 - Registro de fluxo de caixa (actions)
- [ ] RF013, RF014 - Gestão de pendências (loaders/actions)
- [ ] RF011, RF012 - Automação financeira (server functions)

### **Fase 5: Sorteio e Participação** (Semana 8)

- [ ] RF010 - Participação efetiva (actions)
- [ ] RF019, RF020, RF021, RF022 - Sistema de sorteio (server functions)

### **Fase 6: Relatórios e Refinamentos** (Semana 9-10)

- [ ] RF017, RF018 - Relatórios mensais (loaders)
- [ ] RNF001, RNF002, RNF004, RNF005, RNF006 - Melhorias técnicas

---

## 📊 **Métricas de Sucesso**

### **Funcionais**

- [ ] **100%** dos requisitos funcionais implementados
- [ ] **0** bugs críticos em produção
- [ ] **< 3** bugs menores por release

### **Técnicos**

- [ ] **> 80%** cobertura de testes
- [ ] **< 500ms** tempo médio de resposta
- [ ] **99%** uptime da aplicação

### **Usuário**

- [ ] **> 90%** dos atletas usando confirmação online
- [ ] **< 5%** discrepâncias financeiras
- [ ] **Redução de 70%** no tempo de gestão administrativa

---

**Última atualização**: 24 de junho de 2025  
**Versão**: 1.0  
**Status**: Em desenvolvimento inicial
