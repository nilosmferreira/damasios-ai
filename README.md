# 🏀 Sistema de Controle Financeiro - Basketball Pick-up Game

Um sistema completo para gestão de partidas de basquete e controle financeiro, construído com as tecnologias mais modernas.

## 🎉 **Novo** - Versão 2.0.0 com Redesign Completo!

✨ **Interface Modernizada**: Sidebar responsivo com navegação intuitiva  
📊 **Dashboards Inteligentes**: Painéis personalizados por perfil (admin/atleta)  
📱 **Mobile-First**: Experiência otimizada para todos os dispositivos  
🎯 **UX Aprimorada**: Layout unificado e componentes Shadcn UI premium

## 🚀 Tecnologias Utilizadas

- **React Router v7** - Framework SSR/SPA moderno
- **TypeScript** - Tipagem estática para maior segurança
- **Prisma** - ORM type-safe para PostgreSQL
- **Tailwind CSS v4** - Framework CSS utility-first
- **Shadcn UI** - Componentes UI modernos e acessíveis
- **Zod** - Validação de schemas TypeScript-first
- **Docker** - Containerização para desenvolvimento
- **PostgreSQL** - Banco de dados relacional

## 📋 Funcionalidades Implementadas

### ✅ **Fase 1** - Base e Autenticação _(v0.1.0)_

- Sistema de autenticação com sessões
- Middleware de proteção de rotas
- Interface de login/logout
- Dashboard principal
- Gestão de usuários (admin)

### ✅ **Fase 2** - CRUD de Atletas _(v0.2.0)_

- **Cadastro de Atletas**: Formulário completo com validação
- **Edição de Atletas**: Interface modal para atualização
- **Ativação/Desativação**: Toggle de status com feedback visual
- **Listagem Avançada**: Filtros por nome, email, status e tipo de cobrança
- **Paginação**: Sistema otimizado para performance
- **Validação Robusta**: Schemas Zod para todos os formulários

### ✅ **Fase 3** - Redesign UI/UX _(v2.0.0)_

- **Sidebar Responsivo**: Layout moderno com navegação lateral
- **Dashboards Diferenciados**: Painéis específicos para admin e atletas
- **Layout Unificado**: Sistema de layout consistente para todas as páginas
- **Mobile-First**: Interface totalmente responsiva
- **Navegação Inteligente**: Menu adaptativo baseado no papel do usuário
- **Estatísticas em Tempo Real**: Cards dinâmicos com dados atualizados
- **Componentes Modernos**: Shadcn UI para experiência premium

### 🎯 **Próximas Fases**

- **Fase 4**: Gestão de Partidas (CRUD + Confirmações)
- **Fase 5**: Controle Financeiro (Pendências + Fluxo de Caixa)
- **Fase 6**: Sorteio de Quintetos
- **Fase 7**: Relatórios e Refinamentos

## �️ Setup do Projeto

### Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- pnpm (recomendado)

### Instalação

```bash
# 1. Clonar o repositório
git clone <repo-url>
cd estudo-copilot

# 2. Instalar dependências
pnpm install

# 3. Configurar ambiente
cp .env.example .env

# 4. Subir banco de dados
docker-compose up -d

# 5. Executar migrações
pnpm run db:migrate

# 6. Popular banco (usuário admin)
pnpm run db:seed
```

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
pnpm run dev

# Comandos úteis
pnpm run db:reset    # Reset do banco
pnpm run db:studio   # Interface Prisma Studio
```

## 🔐 Credenciais Padrão

- **Admin**: `admin@sistema.com` / `admin123`

## 📊 Progresso do Projeto

**Requisitos Funcionais**: 7/25 (28%) ✅  
**Requisitos Não Funcionais**: 1/6 (17%) ✅

### Estrutura do Banco

- **Users** - Usuários do sistema (Admin/Atleta)
- **Athletes** - Perfis de atletas
- **Places** - Locais das partidas
- **Matches** - Partidas agendadas
- **MatchConfirmations** - Confirmações de presença
- **FinancialPendings** - Pendências financeiras
- **CashFlows** - Movimentações do caixa
- **Participations** - Participações em partidas

## 🎨 Interface

Interface moderna construída com:

- **Shadcn UI** - Componentes reutilizáveis
- **Tailwind CSS** - Estilização utility-first
- **Lucide Icons** - Ícones modernos
- **Design Responsivo** - Mobile-first

## 📚 Documentação

- [`TODO.md`](./TODO.md) - Checklist detalhado de funcionalidades
- [`requeriments.md`](./requeriments.md) - Especificação completa do sistema
- Fluxogramas em Mermaid para processos complexos

## 🏗️ Arquitetura

### SSR com React Router v7

- **File-based routing** - Roteamento baseado em arquivos
