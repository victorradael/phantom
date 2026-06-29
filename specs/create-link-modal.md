# Spec: Create Link Modal Component

## 1. Defina o Objetivo Principal
Transformar o formulário existente de criação de links em um componente de modal reutilizável e esteticamente agradável. Este modal será acionado por um botão localizado abaixo da barra de busca e centralizará a ação de criação de novos links em toda a aplicação.

## 2. Seja Específico e Direto
- **Requisitos Funcionais:**
  - Botão de acionamento posicionado abaixo da `SearchBar`.
  - Abertura do modal ao clicar no botão.
  - O modal deve conter o formulário de criação de link com os campos atuais: URL, Name (opcional) e Tags.
  - Fechamento do modal ao clicar fora dele (backdrop click), na tecla `Esc` ou após o link ser criado.
  - Exibir notificação (Toast) ou seguir o fluxo existente em `addLinkToWorkspace` de `App.jsx`.
  - O modal deve ser um componente independente e reutilizável (ex: `<CreateLinkModal />`).
- **Requisitos Não Funcionais:**
  - Stack: **React**, **Tailwind CSS**, **Lucide-React** (ícones).
  - Design premium e mais trabalhado, com foco em UI moderna, mantendo a identidade visual "dark/purple" (ex: fundos `#1a0f2e`, `#0d0a14`, bordas `purple-900/40`).
  - Micro-animações suaves de entrada (fade-in, slide-up) e saída.
  - Acessibilidade: Foco automático no primeiro input ao abrir o modal, navegação por `Tab` e fechamento com `Esc`.

## 3. Forneça Exemplos de I/O
- **Entradas (Props do Componente):**
  - `isOpen` (boolean): Controle de estado para exibir o modal.
  - `onClose` (function): Função disparada para solicitar o fechamento do modal.
  - `onSubmit` (function): Função disparada ao submeter o form, recebendo os dados preenchidos.
  - `workspaceId` (string, opcional): Contexto do workspace atual.
- **Saídas (Exemplo do que será passado no onSubmit):**
  ```json
  {
    "url": "https://google.com",
    "alias": "Google",
    "tags": ["search", "ferramentas"]
  }
  ```

## 4. Defina as Restrições (Anti-objetivos)
- Não alterar a lógica de backend, electron store ou hooks de criação do link (`useLinks`, `addLinkToWorkspace`), o foco é extrair a UI do `App.jsx` para um Modal dedicado e melhorar seu visual.
- Não introduzir novas dependências (ex: Radix, Framer Motion) caso seja possível construir um modal responsivo apenas com Tailwind e React.
- Não remover os placeholders ou lógicas de input (como o `TagInput`).

## 5. Divida em Etapas (Step-by-step)
1. **Estrutura do Componente Modal:** Criar o componente base do Modal (`CreateLinkModal.jsx` em `src/components/`), com fundo escuro semi-transparente (backdrop) e o card central.
2. **Migração do Formulário:** Recortar a UI do formulário de criação de link (linhas ~642-669 do `App.jsx`) e adaptá-lo dentro do `<CreateLinkModal />`, mantendo o `TagInput`.
3. **Estilização Refinada:** Aplicar detalhes visuais premium usando Tailwind (sombras, blur no backdrop, hover effects no botão e inputs, outline roxo suave no focus).
4. **Implementação do Acionador:** No `App.jsx`, adicionar o estado `isCreateLinkModalOpen` e criar o botão "Add New Link" posicionado abaixo do `<SearchBar />`.
5. **Integração Lógica:** Ligar a função `addLinkToWorkspace` ao `onSubmit` do modal e garantir que o modal se feche automaticamente após a criação bem-sucedida.

## 6. Dê Contexto
- **Local do botão:** No arquivo `src/App.jsx`, logo abaixo de `<SearchBar links={links} workspaces={workspaces} onSelectLink={handleSearchSelect} />` (aprox. linha 599).
- **Formulário a substituir:** O trecho renderizado condicionalmente que possui os inputs `newUrl`, `newAlias` e `TagInput` (aprox. linha 642 de `App.jsx`), que deverá dar lugar ao botão e o respectivo modal.
