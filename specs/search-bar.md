# Barra de Busca Global por Workspaces

## 1. Defina o Objetivo Principal
Criar uma barra de buscas global na interface principal do Phantom para localizar com maior facilidade os links cadastrados no aplicativo. A busca deve varrer todos os links existentes e apresentar os resultados agrupados por Workspace, facilitando a identificação da origem de cada link.

## 2. Seja Específico e Direto
- **Requisitos Funcionais:**
  - O componente de busca deve ser acessível de forma global.
  - A busca deve ser "case-insensitive" (não diferenciar maiúsculas de minúsculas).
  - A busca deve filtrar os links pela URL ou nome/alias do link.
  - O resultado deve apresentar os links encontrados separados e agrupados pelo nome do Workspace a que pertencem.
- **Requisitos Não Funcionais:**
  - A busca deve ocorrer localmente (client-side), aproveitando os dados em memória.
  - Sugere-se utilizar "debounce" no input de busca para melhor performance e evitar renders desnecessários.
- **Stack Tecnológica:**
  - **Frontend:** React (usando Vite), Tailwind CSS para estilização, Lucide React para ícones.
  - **Estado e Integração:** Utilizar os hooks locais já existentes do projeto (`useLinks` e `useWorkspaces`).

## 3. Forneça Exemplos de I/O
- **Entrada (Busca do usuário):** String digitada na barra de busca. Ex: `"github"`
- **Processamento:**
  - Obter a lista completa de `links` e `workspaces` através dos hooks existentes no app.
  - Filtrar os `links` onde `url` ou título contém o termo `"github"`.
- **Saída Estruturada:**
  O componente deve formatar os dados filtrados em grupos (exemplo de como o agrupamento se parecerá no código):
  ```json
  [
    {
      "workspaceId": "uuid-1",
      "workspaceName": "Trabalho",
      "links": [
        { "uuid": "L1", "url": "https://github.com/...", "alias": "Repo 1" }
      ]
    },
    {
      "workspaceId": "uuid-2",
      "workspaceName": "Pessoal",
      "links": [
        { "uuid": "L2", "url": "https://github.com", "alias": "GitHub" }
      ]
    }
  ]
  ```

## 4. Defina as Restrições (Anti-objetivos)
- **Não** criar endpoints ou chamadas externas no backend para a busca; tudo ocorre no client-side consumindo os hooks existentes.
- **Não** alterar a estrutura de persistência de dados (arquivos do Electron Store).
- **Não** adicionar novas bibliotecas de controle de estado global como Redux. O estado do React atual atende o necessário.

## 5. Divida em Etapas (Step-by-step)
1. **Criar a UI de Busca:** Desenvolver o componente da barra de busca usando Tailwind e ícone do Lucide.
2. **Lógica de Agrupamento e Filtro:** Implementar a lógica local que filtra os links com base na query ("case-insensitive") e mapeia esses links agrupando-os pelo `workspace_uuid` correspondente.
3. **Exibir os Resultados:** Criar a estrutura visual para exibir os Workspaces e seus respectivos links correspondentes à busca de forma hierárquica/agrupada.
4. **Integração e Ações:** Integrar o componente na página principal e garantir que, ao clicar em um link do resultado da busca, sua ação esperada seja concluída (ex: redirecionamento ou foco).

## 6. Dê Contexto
O Phantom salva Links e Workspaces e fornece esses dados para o frontend via preload do Electron (`window.api`), abstraídos pelos hooks `useLinks` e `useWorkspaces` (por exemplo, no `App.jsx`). Os links carregam consigo a chave de relação `workspaceId` (ou `workspace_uuid`), que deve ser cruzada com a lista de workspaces para renderizar corretamente o nome do Workspace no topo de cada agrupamento de resultado.
